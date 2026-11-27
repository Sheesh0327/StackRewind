#!/usr/bin/env python3
"""Unit and HTTP integration tests for scripts/author-studio.py."""

from __future__ import annotations

import base64
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

REPO_ROOT = Path(__file__).resolve().parent.parent
STUDIO_PATH = REPO_ROOT / "scripts" / "author-studio.py"


def load_studio_module():
    spec = importlib.util.spec_from_file_location("author_studio", STUDIO_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


studio = load_studio_module()


def http_json(url: str, payload: dict | None = None) -> tuple[int, dict, dict]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"} if payload is not None else {}
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if payload is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, dict(resp.headers), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, dict(exc.headers), json.loads(exc.read().decode("utf-8"))
        finally:
            exc.close()


class AuthorStudioReadOnlyServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = studio.create_studio_server(REPO_ROOT, port=0, default_compact=False)
        cls.port = cls.server.server_address[1]
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def test_studio_and_root_serve_no_cache(self) -> None:
        for route, marker in (("/", "StackRewind"), ("/studio", "LOCALHOST AUTHORING STUDIO")):
            with urllib.request.urlopen(f"{self.base_url}{route}", timeout=10) as resp:
                self.assertEqual(resp.status, 200)
                cc = resp.headers.get("Cache-Control", "")
                self.assertIn("no-store", cc)
                body = resp.read().decode("utf-8")
                self.assertIn(marker, body)

    def test_state_endpoint_reports_volumes_and_ch2_cliffhanger(self) -> None:
        status, headers, data = http_json(f"{self.base_url}/api/state")
        self.assertEqual(status, 200)
        self.assertIn("no-store", headers.get("Cache-Control", ""))
        net = next((v for v in data["volumes"] if v["id"] == "networking"), None)
        self.assertIsNotNone(net)
        self.assertEqual(net["nextChapterNumber"], 3)
        self.assertIsNotNone(net["prevCliffhanger"])
        self.assertIn("global Internet", net["prevCliffhanger"]["finalDialogue"])
        self.assertIsNotNone(net["nextRoadmap"])
        self.assertEqual(net["nextRoadmap"]["title"], "The Van That Needed Three Networks")
        self.assertEqual(net["nextRoadmap"]["suggestedPages"], 7)

    def test_roadmap_injection_allows_empty_brief_for_ch3(self) -> None:
        status, _, ch3 = http_json(
            f"{self.base_url}/api/prompts/chatgpt",
            {
                "targetType": "chapter",
                "volumeId": "networking",
                "chapterNumber": 3,
                "saveFile": False,
            },
        )
        self.assertEqual(status, 200)
        self.assertIn("content/networking/ROADMAP.md", ch3["prompt"])
        self.assertIn("The Van That Needed Three Networks", ch3["prompt"])
        self.assertIn("Chapter 3 Storyboard Brief", ch3["prompt"])
        self.assertIn("`page: 1` .. `7`", ch3["prompt"])

    def test_chatgpt_prompt_chapter_and_volume_modes(self) -> None:
        status, _, ch_res = http_json(
            f"{self.base_url}/api/prompts/chatgpt",
            {
                "targetType": "chapter",
                "volumeId": "networking",
                "chapterNumber": 3,
                "era": "1974-1983",
                "bottleneck": "Isolated Ethernet LANs and ARPANET trunks could not route packets across boundaries.",
                "mechanisms": "IP datagram headers, subnet masks, and gateway forwarding tables.",
                "pageCount": 6,
                "saveFile": False,
            },
        )
        self.assertEqual(status, 200)
        self.assertIn("60-95", ch_res["prompt"])
        self.assertIn("Who Gets to Talk?", ch_res["prompt"])
        self.assertIn("net-ch3-p01", ch_res["prompt"])
        self.assertIn("deepDive", ch_res["prompt"])

        status, _, vol_res = http_json(
            f"{self.base_url}/api/prompts/chatgpt",
            {
                "targetType": "volume",
                "volumeId": "databases",
                "code": "db",
                "title": "Databases",
                "chapterCount": 4,
                "saveFile": False,
            },
        )
        self.assertEqual(status, 200)
        self.assertIn("Ordered Chapter Roadmap Table", vol_res["prompt"])
        self.assertIn('`id`: `"databases"`', vol_res["prompt"])

    def test_gemini_factcheck_prompt_contains_5_dimensions(self) -> None:
        status, _, res = http_json(
            f"{self.base_url}/api/prompts/gemini",
            {"volumeId": "networking", "chapterNumber": 2, "saveFile": False},
        )
        self.assertEqual(status, 200)
        self.assertIn("VERIFIED", res["prompt"])
        self.assertIn("IMPRECISE", res["prompt"])
        self.assertIn("INCORRECT", res["prompt"])
        self.assertIn("realWorldSighting", res["prompt"])
        self.assertIn("Authoritative Primary Sources", res["prompt"])
        self.assertIn("Per-Page YouTube Deep-Dives", res["prompt"])
        self.assertIn("never guess or invent URLs", res["prompt"])
        self.assertIn("furtherLearning", res["prompt"])
        self.assertIn("deepDive", res["prompt"])
        self.assertIn("content/networking/ROADMAP.md", res["prompt"])

    def test_claude_svg_prompts_per_scene_and_compact_mode(self) -> None:
        status, _, full_res = http_json(
            f"{self.base_url}/api/prompts/claude",
            {"volumeId": "networking", "chapterNumber": 2, "compact": False, "saveFile": False},
        )
        self.assertEqual(status, 200)
        self.assertEqual(len(full_res["scenes"]), 6)
        self.assertEqual(full_res["scenes"][0]["sceneModule"], "net-ch2-p01")
        self.assertIn("Reference Exemplar Scene", full_res["scenes"][0]["prompt"])
        self.assertIn("READY FOR NEXT", full_res["stagedPrompt"])

        status, _, cmp_res = http_json(
            f"{self.base_url}/api/prompts/claude",
            {"volumeId": "networking", "chapterNumber": 2, "compact": True, "saveFile": False},
        )
        self.assertEqual(status, 200)
        self.assertNotIn("Reference Exemplar Scene", cmp_res["scenes"][0]["prompt"])
        self.assertIn("createLoopingScene", cmp_res["scenes"][0]["prompt"])
        self.assertLess(cmp_res["scenes"][0]["chars"], full_res["scenes"][0]["chars"])


class AuthorStudioIsolatedWriteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="sr-studio-test-"))
        (self.tmp / "content" / "networking" / "scenes").mkdir(parents=True)
        (self.tmp / "assets" / "audio").mkdir(parents=True)
        shutil.copyfile(
            REPO_ROOT / "content" / "networking" / "scenes" / "looping-scene.js",
            self.tmp / "content" / "networking" / "scenes" / "looping-scene.js",
        )
        manifest = {
            "brand": {"name": "StackRewind", "tagline": "Test"},
            "defaultRoute": {"volume": "networking", "chapter": "ch1"},
            "volumes": [
                {"id": "networking", "number": 1, "code": "net", "title": "Networking", "status": "published", "chapters": []}
            ],
        }
        (self.tmp / "content" / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        self.server = studio.create_studio_server(self.tmp, port=0)
        self.base_url = f"http://127.0.0.1:{self.server.server_address[1]}"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_save_volume_chapter_scene_and_reject_path_escape(self) -> None:
        status, _, vol_res = http_json(
            f"{self.base_url}/api/save/volume",
            {"volumeId": "databases", "code": "db", "title": "Databases"},
        )
        self.assertEqual(status, 200)
        self.assertTrue((self.tmp / "content" / "databases" / "scenes" / "looping-scene.js").exists())

        sample_chapter = {
            "volumeId": "databases",
            "chapterId": "ch1",
            "chapterNumber": 1,
            "assetPrefix": "db-ch1",
            "era": "1970-1980",
            "title": "Why B-Trees Exist",
            "subtitle": "Keeping disk reads shallow.",
            "pages": [
                {
                    "page": 1,
                    "panelType": "svg-scene",
                    "sceneModule": "db-ch1-p01",
                    "title": "The Disk Seek Cliff",
                    "speaker": "The Guide",
                    "dialogue": "Scanning an unsorted [[Heap File|heap-file]] forces millions of disk seeks.",
                    "tts": "Scanning an unsorted Heap File forces millions of disk seeks.",
                    "sceneNotes": "Show disk platter spinning across sectors.",
                }
            ],
            "codex": {
                "heap-file": {
                    "term": "Heap File",
                    "plainEnglish": "An unordered collection of variable-length table records stored sequentially across disk pages without an index.",
                    "whyItWasInvented": "Appending rows to the end of a file is fast when no fast lookup index exists yet.",
                    "realWorldSighting": "PostgreSQL stores table row data inside unordered 8-kilobyte heap pages before indexing them with B-Trees.",
                }
            },
        }
        fenced_json = "```json\n" + json.dumps(sample_chapter) + "\n```"
        status, _, ch_res = http_json(
            f"{self.base_url}/api/save/chapter",
            {"chapterJson": fenced_json, "autoTts": False},
        )
        self.assertEqual(status, 200)
        self.assertTrue((self.tmp / ch_res["chapterPath"]).exists())
        self.assertTrue((self.tmp / ch_res["ttsPath"]).exists())
        tts_saved = json.loads((self.tmp / ch_res["ttsPath"]).read_text(encoding="utf-8"))
        self.assertEqual(tts_saved["voice"], "en-US-AndrewMultilingualNeural")
        self.assertEqual(tts_saved["pages"][0]["output"], "assets/audio/db-ch1-p01.mp3")

        # Valid scene save with markdown fences
        fenced_js = (
            "```js\n"
            'import { createLoopingScene } from "./looping-scene.js";\n'
            'export const { mount, unmount, pause, resume, replay } = createLoopingScene({\n'
            '  id: "db-ch1-p01", description: "Test", artwork: "<rect fill=\\"var(--sr-bg-surface)\\"/>",\n'
            "  duration: 4, still: 1, draw() {}\n"
            "});\n```"
        )
        status, _, sc_res = http_json(
            f"{self.base_url}/api/save/scene",
            {"volumeId": "databases", "sceneModule": "db-ch1-p01", "sceneCode": fenced_js},
        )
        self.assertEqual(status, 200)
        self.assertTrue((self.tmp / sc_res["scenePath"]).exists())

        # Path traversal & Console protection checks
        status, _, bad_vol = http_json(
            f"{self.base_url}/api/save/scene",
            {"volumeId": "../../js", "sceneModule": "db-ch1-p01", "sceneCode": fenced_js},
        )
        self.assertEqual(status, 400)
        self.assertIn("Invalid volumeId", bad_vol["error"])

        status, _, bad_audio = http_json(
            f"{self.base_url}/api/save/audio",
            {"filename": "../index.html", "sourceExt": "mp3", "audioBase64": base64.b64encode(b"ID3").decode()},
        )
        self.assertEqual(status, 400)

    def test_google_ai_studio_tts_mocked_and_missing_key(self) -> None:
        # Prepare a minimal chapter inside tmp
        ch = {
            "volumeId": "networking",
            "chapterId": "ch9",
            "chapterNumber": 9,
            "assetPrefix": "net-ch9",
            "era": "2020",
            "title": "Test",
            "subtitle": "Test",
            "pages": [
                {
                    "page": 1,
                    "panelType": "svg-scene",
                    "sceneModule": "net-ch9-p01",
                    "title": "Test",
                    "speaker": "The Guide",
                    "dialogue": "Testing Google AI Studio narration synthesis cleanly.",
                    "tts": "Testing Google AI Studio narration synthesis cleanly.",
                    "sceneNotes": "Test scene.",
                }
            ],
            "codex": {},
        }
        (self.tmp / "content" / "networking" / "chapter9.json").write_text(json.dumps(ch), encoding="utf-8")

        # Missing API key returns HTTP 400 clearly
        with patch.dict("os.environ", {"GEMINI_API_KEY": ""}, clear=False):
            status, _, err_res = http_json(
                f"{self.base_url}/api/run/tts",
                {"provider": "google-ai-studio", "volumeId": "networking", "chapterNumber": 9},
            )
            self.assertEqual(status, 400)
            self.assertIn("GEMINI_API_KEY", err_res["error"])

        if not shutil.which("ffmpeg"):
            return

        # Mock Gemini generateContent returning 0.1s silent 24kHz PCM -> WAV -> MP3 via ffmpeg
        pcm = b"\x00\x00" * 2400
        fake_resp_payload = json.dumps(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {"inlineData": {"mimeType": "audio/L16;rate=24000", "data": base64.b64encode(pcm).decode()}}
                            ]
                        }
                    }
                ]
            }
        ).encode("utf-8")

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return fake_resp_payload

        with patch("urllib.request.urlopen", return_value=FakeResponse()):
            app = studio.StudioApp(self.tmp)
            res = app.run_google_ai_studio_tts("content/networking/chapter9.json", api_key="test-key")
            self.assertTrue(res["ok"])
            out_mp3 = self.tmp / "assets" / "audio" / "net-ch9-p01.mp3"
            self.assertTrue(out_mp3.exists())
            self.assertGreater(out_mp3.stat().st_size, 0)


if __name__ == "__main__":
    unittest.main()
