# StackRewind Networking — How a Voice Crosses the World

The book opens on a telephone circuit sitting idle while another computer waits to send. It closes with a live call between two countries. By then, a curious newcomer should be able to explain why speech travels in pieces, how those pieces cross independently run networks, and how the listener hears a sentence even when some packets arrive late.

## Choose the next chapter

This roadmap is the editorial source of truth for the Networking volume. It sets the chapter order, the problem each chapter owns, and the historical evidence for its payoff. The [published cartridge manifest](../manifest.json) records which chapters readers can open.

1. Read the Networking entry in the manifest. Match its chapters to the numbers below.
2. For a request to generate the next chapter, pick the lowest numbered roadmap entry absent from that manifest entry. As of this roadmap, Chapters 1 and 2 are published, so **Chapter 3, “The Van That Needed Three Networks,”** is next.
3. Bring the selected brief and the preceding chapter’s ending into the chapter authoring review. A draft file or a storyboard does not count as publication. If every entry is present in the manifest, the roadmap is complete.
4. For Chapter N, use chapter ID **chN**, asset prefix **net-chN**, and data path **content/networking/chapterN.json**. Register it when its cartridge is ready to publish. Update the roadmap before changing the order or moving a topic to a different chapter.

## What every chapter must explain

- **Start with the job the stack could not do yet.** Show the obsolete assumption, the bottleneck, or the failed attempt. Give the reader a chance to predict the outcome before showing the historical result.
- **Explain why the mechanism has this shape.** Name the constraint behind a field, width, handshake, timer, or layer boundary. Show what the bits mean to the device that reads them and what would go wrong if the field or step disappeared. Attribute recalled design motives to the participant who reported them and label teaching reconstructions.
- **Make the explanation travel.** Put one worked trace, timing diagram, or request in the main story. Ask readers to use the same reasoning on a second situation. When the answer depends on a term such as frame, packet, port, or prefix, label the actual field.
- **Let comprehension set the length.** Add scenes until the reader can follow the mechanism and solve the chapter’s puzzle. A single reasoning step per scene keeps the narrative moving. The storyboards give an order for the ideas and can expand when an idea needs more room.

## Part I · Could these machines talk at all?

### 1. Why Packets Exist

**1960–1969 · Published.** One computer has gone quiet. Another has data ready. Why must it wait? Start with the idle circuit, then show bursts from two senders taking turns on a shared trunk. Give Baran’s survivability work, Davies’s packet-switching work, and the ARPANET experiment their own motivations. End with UCLA’s first login attempt reaching the letters L and O before the remote system failed. Return to the same trade-off today with a photo upload and a call competing for one home uplink. [Baran’s RAND memorandum](https://nsarchive.gwu.edu/sites/default/files/documents/3035764/Document-01.pdf) · [NPL history](https://www.npl.co.uk/about-us/history/timeline) · [Kleinrock’s account and log](https://www.lk.cs.ucla.edu/data/files/Kleinrock/An%20Early%20History%20Of%20The%20Internet.pdf)

**Design rationale.** Why send small packets? One brief burst can take a turn while the first sender still has work. A second path solves a separate problem when a link fails. **Reader puzzle.** Compare a reserved circuit with queued packets. Predict when the waiting sender gets a turn and what would be needed to keep sending after a link fails.

### 2. Who Gets to Talk?

**1970–1983 · Published.** Two island terminals can each reach the receiver. What happens when they speak together? Follow ALOHA’s transmit-and-retry rule, what synchronized slots do to the overlap window, and how Ethernet detects a collision and retries after a random wait. PARC’s operating coax network shows what the design could do. Look ahead to the difference between dedicated full-duplex wired links and Wi-Fi’s shared airtime. Close with the published cliffhanger about getting a message from one kind of network to another. [Abramson’s ALOHA paper](https://people.eecs.berkeley.edu/~pister/290Q/Papers/MAC%20protocols/ALOHA%20abramson%201970.pdf) · [Metcalfe and Boggs’s Ethernet report](https://www.cs.cornell.edu/courses/cs414/2001FA/papers/ethernet/ethernet.htm)

**Design rationale.** Why listen while sending and require a minimum frame length on shared coax? A sender has to stay active long enough to hear a collision from the far end. **Reader puzzle.** Use a near and a far transmitter on a timing diagram. Predict when each can detect a collision and how different retry delays help.

### 3. The Van That Needed Three Networks

**1972–1977.** A computer in a moving California van needs to reach another computer in California. Why does the test route go through London? Let the reader see why a local frame cannot travel unchanged over three unlike networks. A gateway sends the internetwork packet onward in a new local envelope. Reveal the three-network transmission after the reader can predict what must survive each boundary. Today, a home router can carry the same destination IP across Wi-Fi and Ethernet using different frames. Close on a lost packet and ask who is responsible for it. [Cerf and Kahn’s design](https://pages.cs.wisc.edu/~pb/740/CK74.pdf) · [SRI’s demonstration account and route diagram](https://www.sri.com/wp-content/uploads/2022/08/A-heritage-of-innovation-Advances-in-Communications.pdf)

**Design rationale.** Why build a stack? Local framing moves data across one link. IP provides a common packet between networks. Transport lets endpoints decide how to deliver data to the application. A link can change without requiring the application to learn its rules. **Reader puzzle.** On a side-by-side frame diagram, identify which destination belongs to the next link, which survives the gateway, and which job still needs both endpoints. [TCP/IP layering in RFC 1122](https://www.rfc-editor.org/rfc/rfc1122.html#section-1.1.3)

**Transfer to a packet capture.** Use a labeled modern IPv4 frame beside the historical demonstration. Point to the link-layer destination and the separate 32-bit destination in the IP header. On the far side of an ordinary router, find the new link-layer destination and the same destination IP. Chapter 8 takes those four IP address bytes apart. [IPv4 header format](https://www.rfc-editor.org/rfc/rfc791.html#section-3.1)

### 4. Who Puts the Bytes Back?

**1970s–1983.** The second piece arrives first. Then an acknowledgment disappears and the first piece arrives twice. Ask what should appear on the terminal. Show byte sequence numbers, acknowledgments, duplicate detection, and retransmission timers giving applications an ordered stream. Mills’s path measurements expose a catch: a delayed reply can trigger a retransmission even when the data arrived. Today, a file transfer can conceal the same recovery from the person downloading it. [TCP’s worked exchanges](https://www.rfc-editor.org/rfc/rfc793.html) · [Mills’s Internet measurements](https://www.rfc-editor.org/rfc/rfc889.html)

**Design rationale.** Why three handshake messages? Each endpoint starts with its own sequence number and needs evidence that the other end received it. Numbering bytes then lets the receiver recognize gaps across different segment sizes. **Reader puzzle.** Identify SYN, SYN-ACK, and ACK in a capture. Later, predict which byte the receiver will acknowledge as the next one it expects when a segment arrives out of order. [TCP connection synchronization](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.4.1)

### 5. The Syllable That Arrived Too Late

**1973–1980.** Should a listener wait for a missing syllable while the speaker keeps talking? Use early packet-voice work to make the cost of waiting audible. Then introduce UDP’s smaller contract: send a datagram to an application port and leave recovery decisions to the application. Date the early Network Voice Protocol experiments before UDP. End with a call that can keep playing after a gap. Chapter 29 explains how the receiver knows when to play the next syllable. [Cohen’s Network Voice Protocol account](https://www.rfc-editor.org/rfc/rfc741.html) · [Original UDP specification](https://www.rfc-editor.org/rfc/rfc768.html)

**Design rationale.** Why have ports as well as IP addresses? One machine can have several applications waiting for traffic. A port helps the receiving stack choose the socket that should get the datagram. **Reader puzzle.** Compare two datagrams sent to one IP. Identify what distinguishes the intended receivers, then decide whether one late piece of speech is still useful.

### 6. Mail for Someone on Another Machine

**1971–1982.** Tomlinson could send from one computer and walk a few steps to read the result on the other. His recollection gives the remote mailbox and the **user@host** address a reason to exist. Follow a later SMTP exchange until the receiver accepts responsibility for a message. Its owner can be asleep when that happens, just as a modern email server can accept a message before a person reads it. Tomlinson did not remember the first message’s text. [Tomlinson’s oral history](https://archive.computerhistory.org/resources/access/text/2016/03/102702118-05-01-acc.pdf) · [Original SMTP exchanges](https://www.rfc-editor.org/rfc/rfc821.html)

**Design rationale.** Why split the mail envelope from the message content? A server needs a delivery address even when the recipient sees different message headers. **Reader puzzle.** In an SMTP exchange, find the envelope recipient and the reply confirming that the server accepted responsibility for the message.

### 7. The Morning After the Great Switch

**1981–1983.** A prototype works. How do you move the rest of the network? Follow ARPANET’s plan to move hosts from NCP to TCP/IP by January 1, 1983. In the February survey, 161 of the 214 hosts listed as supporting TCP Telnet accepted that service. End by showing how a modern service migration also needs a test from outside the machine being moved. Then rewind to the moment a machine first tries to join a network. [Transition plan](https://www.rfc-editor.org/rfc/rfc801.html) · [February host survey](https://www.rfc-editor.org/rfc/rfc842.html)

**Design rationale.** Why set a common cutover date? Two machines can each work alone and still fail to understand each other when only one has changed protocols. **Reader puzzle.** Find one host that claimed TCP Telnet support and one that accepted a connection. Explain what the outside test established.

## Part II · From a bare machine to a working connection

### 8. The Computer That Knew No One

**1982–1997.** A machine boots without an IP address. How can a server send it one? Walk through discovery, an offer, a request, and a lease. Then give the machine an off-link destination and use ARP to find the local gateway’s Ethernet address. In 1993, interoperability testers hit the bootstrap problem in practice when clients had to accept replies before their configuration was complete. Let the reader predict what a laptop learns upon joining a home network. [ARP’s worked example](https://www.rfc-editor.org/rfc/rfc826.html) · [DHCP message flow](https://www.rfc-editor.org/rfc/rfc2131.html) · [Interoperability proceedings, printed p. 93](https://www.ietf.org/proceedings/28.pdf)

**Design rationale.** Why does a host need a prefix and a gateway as well as an address? The prefix identifies destinations on the local link. The gateway gives the host a next hop for other destinations. **Reader puzzle.** Use the capture below to predict when the laptop will ask ARP about a destination and when it will ask about the gateway.

#### Why is my router 192.168.1.1?

Open with two homes whose routers both say `192.168.1.1`. Why can both be right? Keep the 1993 interoperability test as the payoff for the DHCP story, then give readers a modern packet capture to solve the address puzzle.

| Page | Beat |
| --- | --- |
| 1 | A new laptop joins the network with no IPv4 address. Ask how it can get a reply before it has an address of its own. |
| 2 | Follow the DHCP discovery, offer, request, and acknowledgment. Give the laptop `192.168.1.42/24` and advertise `192.168.1.1` as the default gateway. Use the 1993 interoperability test to show why the bootstrap exchange mattered. |
| 3 | Return to the two homes. IANA reserved `192.168.0.0/16` and two other blocks for reuse on private networks without global coordination. A vendor can choose `192.168.1.1` as the first usable address of a typical `/24`. Show `192.168.1.254` as another possible configured gateway on the same subnet. |
| 4 | Turn `192.168.1.1` into `11000000 10101000 00000001 00000001`, then show the same four bytes as `C0 A8 01 01` in the packet view. Explain that dots and decimal digits are display notation. The network stack reads the 32 bits as an IPv4 address because the header format tells it where the address field is. |
| 5 | Use `/24` to compare the first 24 bits, corresponding to mask `255.255.255.0`. Ask which destination is on-link for the laptop: its printer at `192.168.1.50` or the public DNS resolver at `1.1.1.1`. Show why the laptop can reach the printer directly and needs a next hop for the resolver. |
| 6 | Follow the resolver-bound packet as far as the home router. On the local Ethernet segment, ARP resolves the gateway’s MAC address. The frame names that MAC as its destination, while the enclosed IP header still names `1.1.1.1`. |
| 7 | Show what happens when equipment claims `1.1.1.1` locally. A matching on-link route can send traffic for the public resolver to the wrong place. APNIC documented real equipment and networks using this public address locally before the resolver launched. |
| 8 | Give readers a labeled DHCP acknowledgment, ARP reply, and outbound frame. Ask them to point to the laptop’s address, the next hop, and the final IP destination, then find the four gateway-address bytes in the DHCP router option. |

**Why IPv4 uses four octets.** When the team separated IP from TCP, it debated 32-bit, 128-bit, and variable-length addresses. In Vint Cerf’s recollection, 32 bits gave the experiment enough room and kept the team from reopening the packet format for another implementation cycle. The IPv4 specification defines two fixed-width, four-octet fields for source and destination. Four groups of eight bits give 2^32 possible bit patterns, and dotted decimal writes each group as a number from 0 to 255. Show the 32-bit limit again when Chapters 17, 20, and 21 explain how the growing Internet coped. [Cerf’s account of the address-size debate](https://elists.isoc.org/pipermail/internet-history/2019-February/004939.html) · [IPv4 address format](https://www.rfc-editor.org/rfc/rfc791.html#section-3.2)

For the historical explanation, separate the reservation from the vendor default. RFC 1918 documents reuse of the private blocks, including `192.168.0.0/16`. Early Linksys documentation shows the specific `192.168.1.1` default in use. For the modern payoff, pair that vendor documentation with APNIC’s report of leaked traffic and Cloudflare’s resolver address list. [IPv4 address fields](https://www.rfc-editor.org/rfc/rfc791.html#section-3.1) · [Private address reservation](https://www.rfc-editor.org/rfc/rfc1918.html#section-3) · [DHCP subnet mask and router options](https://www.rfc-editor.org/rfc/rfc2132.html#section-3.3) · [Linksys BEFSR41 quick-start guide](https://downloads.linksys.com/downloads/quickinstall/BEFSR41-EU_V4_quick_install_guides_Rev_NC_web.pdf) · [APNIC on historical use of 1.1.1.1](https://blog.apnic.net/2024/08/02/when-routing-breaks-your-open-dns-service/) · [Cloudflare’s public resolver addresses](https://developers.cloudflare.com/1.1.1.1/ip-addresses/)

### 9. The Spare Cable That Broke the LAN

**1980s.** A bridge learns which source addresses sit behind which ports. Someone adds a redundant cable, and a broadcast comes around again. Show how bridges elect a root and agree which links may forward, leaving a spare path available. DEC’s LANBridge gives Perlman’s algorithm a real setting and product. Today, a redundant office link can save the network after a cut and cause a loop if the switches forward through it at the wrong time. [Perlman’s original algorithm](https://prl.khoury.northeastern.edu/img/p-sigcomm-1985.pdf) · [DEC team’s prototype and deployment account](https://spectrum.ieee.org/how-dec-engineers-saved-ethernet)

**Design rationale.** Why keep a spare cable connected but block forwarding on it? The active tree gives bridges a single path between connected segments while retaining equipment for recovery. **Reader puzzle.** Follow a broadcast before and after a port is blocked. Predict which path could return if an active link fails.

### 10. Both Radios Heard Silence

**1990–1997.** Place two transmitters on opposite sides of an access point. Both hear silence because neither can hear the other, then both transmit. Revisit Chapter 2 from the receiver’s position. Random deferral, acknowledgments, and optional reservation change the odds and consume airtime. Distinguish WaveLAN field measurements, the hidden-terminal explanation, and the later Wi-Fi standard. The modern payoff is a call sharing one room’s airtime with other devices. [Karn’s radio diagrams](https://www.ka9q.net/papers/maca.html) · [WaveLAN measurements](https://www.ieee802.org/11/Documents/DocumentArchives/1991_docs/1191125_scan.pdf) · [Original IEEE 802.11 standard](https://standards.ieee.org/ieee/802.11/1163/)

**Design rationale.** Why acknowledge a frame at the receiver? An idle channel at the sender is incomplete evidence about what the receiver heard. **Reader puzzle.** Place two devices that cannot hear each other beside one access point. Predict where the frames collide and what a missing acknowledgment leaves uncertain.

### 11. Can the Caller Keep Moving?

**1978–2009.** Open in the Chicago cellular trial. Smaller cells allow more calls by reusing frequencies across space. A moving handset eventually leaves the cell serving it. Show the switch from the perspective of the handset and the two cells. Jump explicitly to the commercial LTE packet-data launch and use the handover specification for the mechanism. On a train today, changing the serving cell and preserving an application session are two separate jobs. [Bell engineers’ Chicago trial](https://vtda.org/pubs/BSTJ/vol58-1979/articles/bstj58-1-249.pdf) · [LTE deployment account](https://www.ericsson.com/en/about-us/history/company/timeline-placeholder/timeline-2010-4g-arrives) · [3GPP handover procedure, §10.1.2](https://www.etsi.org/deliver/etsi_ts/136300_136399/136300/14.07.00_60/ts_136300v140700p.pdf)

**Design rationale.** Why divide coverage into cells? The same frequency can carry separate calls far enough apart. The moving caller needs a new serving cell before the old link fades. **Reader puzzle.** On a coverage map, choose where the serving cell might change. Trace where downlink packets go after that switch.

### 12. The File That Had to Know Every Name

**1982–1988.** A new machine has a name, yet anyone using an old copy of the host table still cannot find it. Let the reader try to keep one master file current before showing DNS delegation, referrals, and caching. In the designers’ field account, supplying useful address information alongside replies cut query traffic in an experiment. Give the reader a present-day prediction. The same cache that saves a lookup can briefly send someone to a site’s previous address. [Mockapetris and Dunlap’s field report](https://courses.cs.duke.edu/fall18/compsci514/readings/mockapetris88development.pdf) · [DNS design](https://www.rfc-editor.org/rfc/rfc1034.html)

**Design rationale.** Why delegate names and give cached answers a lifetime? Delegation distributes control over the records. A time to live lets resolvers reuse answers and eventually learn about changes. **Reader puzzle.** Compare lookups before and after a cached answer expires. Predict which can reuse the old address and which needs a fresh answer.

**Reuse the resolver from Chapter 8.** Give a DNS query to `1.1.1.1` and ask the reader to point to three different things: the local gateway, the resolver receiving the query, and the IPv4 address in the answer for the name they looked up. [DNS design](https://www.rfc-editor.org/rfc/rfc1034.html) · [Cloudflare’s public resolver addresses](https://developers.cloudflare.com/1.1.1.1/ip-addresses/)

### 13. What Can Silence Tell You?

**1981–1983.** The name resolves. Nothing answers. The destination, the forward path, and the return path are all suspects. Show how ICMP echo and time-exceeded messages let an engineer ask narrower questions. Mills’s real path measurements include occasional long delays. Let the reader interpret a present-day ping or traceroute and name what a missing reply leaves unresolved. Next, give silence a cause that gets worse when senders retry. [Original ICMP specification](https://www.rfc-editor.org/rfc/rfc792.html) · [Measured Internet paths](https://www.rfc-editor.org/rfc/rfc889.html)

**Design rationale.** Why give IP packets a limited lifetime? Routers must eventually discard packets that loop. The time-exceeded reply can tell a sender where a probe stopped. **Reader puzzle.** In a trace with a time-exceeded reply and a timeout, point to the hop that answered and explain why a silent hop could still forward traffic.

## Part III · How do strangers carry one another’s traffic?

### 14. When Sending Less Delivered More

**1984–1988.** Useful throughput on the Lawrence Berkeley Laboratory–Berkeley path fell from about 32 kilobits per second to 40 bits per second. Ask what happens if senders retry harder. In a separate controlled experiment, show acknowledgment pacing, slow start, and congestion avoidance. Compare the traces for wasted transmissions. Then return to a present-day upload and show how pacing changes the load offered to a crowded link. [Nagle’s early warning](https://www.rfc-editor.org/rfc/rfc896.html) · [Jacobson’s incident account and experimental traces](https://people.ucsc.edu/~warner/Bufs/Jac88.pdf)

**Design rationale.** Why does TCP need congestion control and a receive window? The receive window protects space at the destination. Congestion control limits how much data the path has to carry. **Reader puzzle.** Put spare buffer space at the receiver and a full queue at a router. Explain why the sender should slow down even though the receiver could accept more. [TCP congestion control](https://www.rfc-editor.org/rfc/rfc5681.html)

### 15. The Routers Redraw the Map

**1989–1991.** One link fails. Each router starts with knowledge of its own neighbors. Show how flooding news of local links lets routers assemble a topology database and compute least-cost paths. The NASA Science Internet deployment and compatibility among independent implementations give the design an observed result. In a campus network today, which way would the traffic go after a link fails? End by asking whose rules apply beyond the campus. [OSPF design](https://www.rfc-editor.org/rfc/rfc1131.html) · [Deployment and interoperability report](https://datatracker.ietf.org/doc/html/rfc1246)

**Design rationale.** Why flood link information to other routers? Each router needs enough shared topology to compute its own new path after a link fails. **Reader puzzle.** Remove a link on a weighted map. Use the link costs to find the new path and explain why it might cross more routers.

### 16. Whose Road Will You Take?

**1989–1991, with a 2008 return.** Two operators disagree about whose traffic they will carry. BGP lets networks advertise reachable destinations, include the path of networks, and select routes under local policy. Early operating reports show multiple implementations exchanging routes. RIPE’s 2008 observations show a more-specific YouTube route drawing traffic away from its destination. Tell that episode from the perspective of operators and viewers. Carry the exception that changes a route into the next chapter. [Early BGP operating experience](https://datatracker.ietf.org/doc/html/rfc1266) · [RIPE’s observed timeline](https://www.ripe.net/about-us/news/youtube-hijacking-a-ripe-ncc-ris-case-study/)

**Design rationale.** Why use routing policy between networks? Operators have different neighbors, costs, and agreements. The advertised path provides information each operator can use to prefer or reject a route. **Reader puzzle.** Give two paths to the same prefix and one stated policy. Predict the selected path, then carry the lookup between different prefixes into Chapter 17.

### 17. How Many Roads Fit in a Router?

**1992–1994.** Every route takes memory and update bandwidth. Give the reader neighboring address blocks and ask which can travel together as one announcement. CIDR aggregation makes that possible, and longest-prefix matching keeps exceptions possible. The routing-table drop recorded during 1994 deployment supplies the payoff. A provider today can advertise a large block and still distinguish a smaller one where traffic takes a different path. [Original CIDR plan](https://www.rfc-editor.org/rfc/rfc1519.html) · [Routing-table history, §9](https://datatracker.ietf.org/doc/html/rfc4632/#section-9)

**Design rationale.** Why trade fixed address classes for flexible prefixes? Network sizes rarely fit a few fixed allocations, and a separate announcement for every small block grows the routing table. **Reader puzzle.** Combine neighboring blocks, then use the example below to explain why a more-specific match can still send part of the traffic another way.

**Extend the subnet exercise from Chapter 8.** Put two overlapping prefixes in a routing table. For destination `192.168.1.42`, the first 16 bits match `192.168.0.0/16` and the first 24 bits match `192.168.1.0/24`. Have the reader choose the route with the longer matching prefix. Use an internal routing table for these private ranges. [CIDR and longest matching prefixes](https://datatracker.ietf.org/doc/html/rfc4632#section-5)

### 18. Why Did a Local Packet Go Abroad?

**1994–2012.** Two nearby networks may exchange traffic through a distant international route because that is where their providers meet. Draw the detour before giving the networks a local exchange point. Use the NSFNET transition as earlier context. A Kenyan field study reported latency on affected domestic traffic falling from 200–600 milliseconds to 2–10 milliseconds. Ask why two people in the same city can have a quicker call once their networks connect locally. [NSFNET transition account](https://nap.nationalacademies.org/resource/wpni3/ch-11.html) · [Kenya and Nigeria exchange study](https://www.internetsociety.org/resources/doc/ixpimpact/)

**Design rationale.** Why can local traffic need distant transit? Nearby operators may only exchange traffic at a distant interconnection point. **Reader puzzle.** Draw both paths, then predict where latency falls after local peering. Check the prediction against the Kenya measurements.

### 19. There Really Is a Cable Under the Ocean

**1980s, anchored in 1988.** Rewind to the physical equipment behind a line on the map. How can a light signal carry data across an ocean with the repeaters out of reach? Follow digital signals through optical fiber and powered undersea repeaters. TAT-8’s entry into telecommunications service gives the story its documented crossing. Relate that physical constraint to a modern call. Every route has a propagation delay, even when queues are empty. [Contemporary Bell Labs design paper](https://opg.optica.org/abstract.cfm?uri=OFC-1988-TuD1) · [IEEE installation milestone](https://ethw.org/Milestones%3ATrans-Atlantic_Telephone_Fiber-Optic_Submarine_Cable_%28TAT-8%29%2C_1988)

**Design rationale.** Why put powered repeaters under the ocean? An optical signal weakens as it travels. A digital repeater can recover and regenerate the bits before each new span. **Reader puzzle.** On a cable diagram, mark where regeneration happens. Explain why empty queues still leave a measurable propagation delay.

### 20. One Public Address, a Houseful of Devices

**1994–2001.** An organization wants to connect machines without acquiring a public address for each one. Start with address and checksum rewriting at the boundary. Then add port translation and show how it keeps two conversations distinct. The early prototype passed Telnet and FTP traffic, and FTP required extra handling. Finish at a home router by trying to start a new conversation from outside when there is no matching state. Chapter 30 picks up that failure. [Original NAT prototype](https://www.rfc-editor.org/rfc/rfc1631.html) · [NAT and port translation](https://www.rfc-editor.org/rfc/rfc3022.html)

**Design rationale.** Why translate ports as well as addresses? Several simultaneous conversations share one public address, so the translator needs enough information to direct replies to the right host. **Reader puzzle.** Trace two hosts using the same source port to contact the same remote service. Predict which external field can distinguish their replies.

**Return to the home gateway.** In a before-and-after capture, show the host at `192.168.1.42` sending to `1.1.1.1`. Track the change to the source address and, where needed, its port. Keep the remote destination visible, then use the mapping to follow the reply back to the private host. [NAT and port translation](https://www.rfc-editor.org/rfc/rfc3022.html)

### 21. A Bigger Address and Two Internets to Run

**1995–2012.** IPv6 makes room for many more addresses. What happens when a visitor speaks the new protocol and some servers still speak the old one? Follow one site offering both IPv4 and IPv6. Use the measured change in IPv6 DNS records during the 24-hour 2011 World IPv6 Day test and the 2012 permanent launch commitments as separate moments. Today, two visitors can reach the same service over different IP versions. [Original IPv6 design](https://www.rfc-editor.org/rfc/rfc1883.html) · [World IPv6 Day measurements](https://datatracker.ietf.org/doc/html/rfc6948) · [2012 launch record](https://www.internetsociety.org/news/press-releases/2012/world-ipv6-launch-unites-industry-leaders-to-redefine-the-global-internet/)

**Design rationale.** Why does a larger address require a compatibility plan? An IPv4 parser expects four-byte address fields. IPv6 defines sixteen-byte addresses in a different header, so both sides need a compatible path. **Reader puzzle.** Read an A record and an AAAA record for one service. Predict which connection a host with IPv4 support alone can make. [IPv6 specification](https://www.rfc-editor.org/rfc/rfc8200.html)

## Part IV · What happens when everyone wants the same thing?

### 22. The Document on Somebody Else’s Computer

**1989–1991.** Rewind to CERN. People leave, machines change, and knowledge of how one record relates to another disappears. A URL identifies a resource, HTTP retrieves it, and a link gives the reader somewhere to go next. At SLAC, physicists could use the early Web to access SPIRES records they already needed. Show the same moment today by following a link to a resource hosted by another institution. [Berners-Lee’s original proposal](https://www.w3.org/History/1989/proposal.html) · [SLAC’s account of its first server](https://ahro.slac.stanford.edu/history-bits/slac-and-www)

**Design rationale.** Why does HTTP need a method and a target after transport reaches the server? The application still needs to know which resource the client wants and what action it intends. **Reader puzzle.** Read the method, path, headers, and response status of a simple exchange. Then pair a Set-Cookie response with a later Cookie request to explain how a site can associate separate requests. [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html) · [HTTP state management](https://www.rfc-editor.org/rfc/rfc6265.html)

### 23. Who Answered the Browser?

**1990s–2018.** TCP delivers the bytes in order. How can the browser tell who sent them and keep an intermediary from reading the request? Walk through server authentication, key establishment, and protected application data. Let’s Encrypt’s rollout gives the certificate renewal problem a human scale. A small publisher today can use automated issuance and renewal to keep a site’s HTTPS certificate current. [Netscape’s SSL 3.0 design](https://www.rfc-editor.org/rfc/rfc6101.html) · [Let’s Encrypt deployment study](https://www.isrg.org/documents/letsencryptCCS2019.pdf) · [TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)

**Design rationale.** Why authenticate a server as well as encrypt the exchange? The client needs evidence of whom the channel connects to. **Reader puzzle.** In an annotated HTTPS exchange, find the expected hostname and the presented certificate. Explain why the browser can reject the connection before sending its HTTP request.

### 24. When the Whole Crowd Clicks at Once

**Late 1990s onward.** Thousands want the same sports content. Follow the first cache miss back to the origin and let the reader predict where the next request will be answered. A delivery network maps requests to a suitable edge and reuses stored objects. Akamai’s work for ESPN’s March Madness coverage grounds the opening. End at a modern event where the provider can serve the same object close to many different audiences. [Akamai’s deployment history](https://www.akamai.com/company/company-history) · [Engineers’ account of CDN mapping and delivery](https://www.akamai.com/site/en/documents/technical-publication/algorithmic-nuggets-in-content-delivery-technical-publication.pdf)

**Design rationale.** Why does a cache need a key and a freshness rule? It must decide whether it has the requested response and whether that stored copy is still usable. **Reader puzzle.** Compare one ordinary response with a freshness lifetime and one marked no-store. Predict which second request can be served from a fresh stored copy. [HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html)

### 25. The Network Inside the Building

**2008–2015.** Reaching a data center still leaves a physical problem. Many racks can compete for a few uplinks. Show how a multistage switching fabric supplies several equal-cost paths and follow simultaneous transfers through it. Google’s Jupiter deployment demonstrates the engineering at production scale. Give the reader a modern request that needs data from several racks before the first response can leave the building. [Original fat-tree design and evaluation](https://doi.org/10.1145/1402958.1402967) · [Google’s Jupiter deployment paper](https://research.google/pubs/jupiter-rising-a-decade-of-clos-topologies-and-centralized-control-in-googles-datacenter-network-2/)

**Design rationale.** Why build parallel paths between racks? A narrow shared uplink can delay independent transfers. A switching fabric lets flows use more of the links already installed. **Reader puzzle.** Trace two simultaneous transfers across separate equal-cost paths. Point to where they would have queued in the earlier design.

### 26. The Small Reply Stuck Behind the Big One

**1997–2015.** A browser needs several objects. A reused connection saves work, yet an early slow response can hold later pipelined responses in line. Compare HTTP/1.1 measurements with SPDY’s experiment using labeled frames from multiple streams. Show HTTP/2 interleaving responses from a page the reader can picture. Then lose one TCP segment, stop the animation, and ask what bytes the browser can receive from TCP while it waits. [W3C pipeline experiments](https://www.w3.org/Protocols/HTTP/Performance/Pipeline.html) · [SPDY prototype results](https://www.chromium.org/spdy/spdy-whitepaper/) · [HTTP/2](https://www.rfc-editor.org/rfc/rfc7540.html)

**Design rationale.** Why label HTTP/2 frames by stream? Interleaving works only if each receiver can tell which response a frame belongs to. TCP still delivers its byte stream in order. **Reader puzzle.** Compare pipelined HTTP/1.1 responses with interleaved HTTP/2 responses. Then mark where a gap in the TCP byte stream holds up both.

### 27. One Missing Piece, One Waiting Stream

**2012–2022.** Replay that loss. QUIC tracks offsets within streams, so complete data on an unaffected stream can advance. Work through secure setup and the congestion budget the streams still share. Google’s early QUIC deployment shows how the original design performed at scale. Separate those results from the standards for QUIC in 2021 and HTTP/3 in 2022. Return to the browser and show what one missing image fragment can hold up. [Internet-scale QUIC deployment paper](https://research.google/pubs/the-quic-transport-protocol-design-and-internet-scale-deployment/) · [QUIC version 1](https://www.rfc-editor.org/rfc/rfc9000.html) · [HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)

**Design rationale.** Why keep loss recovery at stream level? A complete stream can advance while another waits for a missing piece. The connection still controls shared congestion. **Reader puzzle.** Lose a packet carrying bytes for the image alone. Predict whether a complete, independent text stream can advance.

### 28. Why the Picture Goes Soft Before It Freezes

**2009–2017.** A connection slows halfway through a film. A higher-quality segment could arrive too late, while a smaller segment might arrive in time. Put the playback buffer on screen and let the reader choose. HLS supplies the playlist and segment example. A separate Netflix experiment shows how buffer-aware choices can reduce stalls. End by asking how much future conversation a live caller can buffer. [HLS design](https://datatracker.ietf.org/doc/html/rfc8216) · [Netflix buffer-based adaptation experiment](https://yuba.stanford.edu/~huangty/bba_report.pdf)

**Design rationale.** Why fetch a smaller video segment? It can arrive before the current playback buffer empties. **Reader puzzle.** Given two download times and one amount of buffered video, choose which segment will arrive before playback stalls.

## Part V · Can you hear me?

### 29. Twenty Rooms Heard the Same Meeting

**1992–1996.** People at remote sites could ask questions back during the 1992 IETF audiocast. Later audio traces showed evenly sent packets arriving in bursts. Play a trace in arrival order and timing, then again on a sampling-time schedule with a small playout buffer. Let the reader hear what the buffer buys and how long they had to wait. Use the early audiocast and measured traces as historical evidence, then explain what the 1996 RTP specification standardized. [Casner and Deering’s audiocast report](https://citeseerx.ist.psu.edu/document?doi=650661791d3f0d43cf36c64fdde685a11fa01abd&repid=rep1&type=pdf) · [Measured playout experiments](https://www.cs.columbia.edu/~hgs/papers/Ramj94_Adaptive.pdf) · [Original RTP](https://www.rfc-editor.org/rfc/rfc1889.html)

**Design rationale.** Why carry a sequence number and a timestamp? Sequence numbers reveal packet order and gaps. Sampling timestamps tell the receiver the intended rhythm. **Reader puzzle.** Find the packet that arrived after its playout deadline. Predict what a larger buffer might recover and how it would change the conversation.

### 30. Both Browsers Can Call Out. Who Can Call In?

**2010–2021.** Two people load the same calling app. Neither browser knows which address pair will carry media. Exchange candidate addresses, check pairs with STUN, and show how a TURN relay gives both ends a reachable path when a direct one fails. Use the 2013 Firefox–Chrome call as evidence of browser interoperability. Demonstrate relay use in a separate labeled example. Leave the reader able to predict why their page can load while a call still fails to connect. [Mozilla’s cross-browser call](https://hacks.mozilla.org/2013/02/hello-chrome-its-firefox-calling/) · [ICE connectivity checks](https://www.rfc-editor.org/rfc/rfc8445.html) · [TURN relay operation](https://www.rfc-editor.org/rfc/rfc8656.html)

**Design rationale.** Why test address pairs after exchanging them? A usable address at one endpoint may be unreachable from the other network. A connectivity check gives both ends evidence about a pair. **Reader puzzle.** Read a sample list with a local address, a public mapping, and a relay. Identify which pair passed its checks and explain what using the relay changes.

### 31. The Answer From Across the Ocean

**Contemporary capstone.** One person asks a short question. Hold the answer while following two journeys. HTTPS loads the app. Signaling and ICE choose a reachable media path, DTLS establishes media keys, and protected, timestamped audio eventually plays from a buffer. Film or record a consented call between two countries during chapter production. Use browser statistics to show the selected candidate types, packet loss, and time in the playout buffer. Label the inferred or reconstructed segments of the journey and keep the app-loading transport separate from the media path. End when the other person answers. [WebRTC architecture](https://www.rfc-editor.org/rfc/rfc8825.html) · [Media transport](https://www.rfc-editor.org/rfc/rfc8834.html) · [Media key establishment](https://www.rfc-editor.org/rfc/rfc5764.html) · [Browser statistics](https://www.w3.org/TR/webrtc-stats/)

**Design rationale.** Why do a working page and a working call have different success conditions? App loading, reaching the other endpoint, and playing its speech solve distinct problems. **Reader puzzle.** Use the consented call trace to point to successful HTTPS, the selected media path, and a late audio packet. Explain where the delay mattered and why the sentence could still play.

## Chapter 3 storyboard brief

Open on the question *The van and the destination were both in California. So why was London on the route?* Expand the storyboard wherever readers need an additional scene to follow the link, IP, and transport responsibilities.

| Page | Beat |
| --- | --- |
| 1 | Pick up Chapter 2’s final question. Freeze an Ethernet frame at its local boundary. The destination exists, but the next network has different framing. |
| 2 | Map the Bay Area packet-radio van, ARPANET, SATNET, London, and the USC Information Sciences Institute host in Marina del Rey. Let readers see the detour before explaining it. |
| 3 | Try extending the first network’s rules everywhere. Show what that would demand of a radio network and a satellite network with different link constraints. |
| 4 | Introduce the gateway and give the reader two destinations to track. One is for this local transmission. The other is for the full journey. |
| 5 | Follow the experimental packet across a boundary. Remove its local envelope, build the outgoing one, and have the reader predict what must survive the next crossing. |
| 6 | Reveal the November 1977 result using SRI’s route diagram. The packet crossed three networks, went via London, and reached the host in California. The experiment ran an earlier design before the final TCP/IP specifications. |
| 7 | In a labeled reconstruction, let a packet disappear. The gateways knew where to send it. Who would notice that it never arrived? |

Use the Codex for France’s CYCLADES and its host-based recovery and for PARC’s independently deployed PUP architecture. The script review should ask a newcomer to point to what changes at the gateway and what survives. [SRI’s demonstration account and route diagram](https://www.sri.com/wp-content/uploads/2022/08/A-heritage-of-innovation-Advances-in-Communications.pdf) · [Pouzin’s CYCLADES paper](https://walden-family.com/am254/vol1-9e-pouzin-cyclades.pdf) · [PARC’s PUP design and operating experience](https://bitsavers.trailing-edge.com/pdf/xerox/parc/techReports/CSL-79-10_Pup_An_Internetwork_Architecture_Jul79.pdf)

## Editorial checks

- **Length.** Keep the cartridge target of 60–95 words per page. Give each distinct step, prediction, failed attempt, or reveal the space it needs. Keep a present-day example in the main story and move secondary protocols, field layouts, and derivations to the Codex. A chapter earns its own place when it poses a distinct problem with an observable result.
- **Evidence.** Use a specification for the design and a log, trace, trial, deployment report, or participant account for what someone observed. Label simulations and reconstructions where readers see them. Show suspense through actions and consequences the record supports. Dates may overlap, so orient the reader when the narrative rewinds.
- **Payoff.** At script review, ask whether the reader can now predict something they could not predict at the start. In the capstone, the reader should be able to explain why the web app can load while a listener still hears nothing. Use the [cartridge authoring guide](../README.md) for the chapter bundle and validation checks.

## Published chapter maintenance

- **Chapter 1.** When revising the cartridge, give the inventors’ distinct motivations room and move the modern home-uplink example into the main story. Give the idle circuit and the packet queue their own scenes when readers need to see them in action.
- **Chapter 2.** When revising the cartridge, label ALOHA’s 18.4% and 36.8% as idealized peak throughputs. Correct the frame-padding sentence. The 64-byte minimum counts the complete untagged MAC frame from the destination address through the frame check sequence. The minimum data-and-pad field is 46 bytes. Stage the switched Ethernet and Wi-Fi comparison ahead of the internetworking cliffhanger. [ALOHA analysis](https://people.eecs.berkeley.edu/~pister/290Q/Papers/MAC%20protocols/ALOHA%20abramson%201970.pdf) · [IEEE frame-format reference](https://www.ieee802.org/3/10SPE/public/adhoc/brandt_082216_10SPE_02_adhoc.pdf)
