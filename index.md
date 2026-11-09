---
title: "Living Off the Script: Hunting T1059 in the Wild"
nav_title: Workshop
description: "A DEATHCon 2026 workshop by Igor Moura: an EDR alert, three detection rules that stayed silent, and a chain of scripts to trace back to patient zero."
---

<p class="links"><a href="https://tryhackme.com/jr/deathcon2026challenge">[ start the lab ↗ ]</a> <a href="#watch-the-workshop">[ watch the workshop ]</a> <a href="lab-guide.html">[ lab guide ]</a></p>

On Monday at 09:47, an EDR flagged PowerShell on a CEO's laptop and isolated it. By then the attacker had run a macro, a remote HTA, a scheduled task, discovery commands and a reboot-surviving JScript, and the SOC's three detection rules had stayed silent. This workshop walks through that intrusion, shows why each rule missed it, and rebuilds detections and hunts that survive a broken process tree. Then you hunt it yourself in the lab.


## Watch the workshop

<div class="video">
  <iframe src="https://www.youtube-nocookie.com/embed/KvTerx2QEtI" title="Living Off the Script: Hunting T1059 in the Wild" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
</div>

| Where | Link |
| --- | --- |
| YouTube | [youtube.com/watch?v=KvTerx2QEtI](https://www.youtube.com/watch?v=KvTerx2QEtI) |
| Download (Sync.com) | [Download the video](https://ln5.sync.com/dl/46453c680#wi68r9vz-kwzvrcrp-q6r7zy2w-3uxpn3y9) |

The video runs about an hour. The lab comes after it.

## What you'll learn

1. How attackers chain scripting engines (VBA, HTA, JScript, VBScript, PowerShell, cmd) in real intrusions
2. What each link leaves in the logs, and where the telemetry gaps are
3. Why three common detection rules failed against this chain
4. How to hunt when the process tree breaks: pivot on host, user and time
5. How to build and test detections that survive syntax changes

## The lab: Operation Late Alert

The lab is a TryHackMe challenge room with an Elastic (Kibana) machine. It holds one morning of Windows logs from **Sierra Grande Capital**, a fictional investment firm. Your job is to trace the 09:47 alert back to patient zero, explain why each SOC rule stayed silent, and build the detections that would have caught it.

### Getting in

1. Sign in to TryHackMe and open the room: **[tryhackme.com/jr/deathcon2026challenge](https://tryhackme.com/jr/deathcon2026challenge)**.
2. Start the machine attached to Task 1 and give it about five minutes to boot.
3. From the AttackBox, or over the TryHackMe VPN, open `http://MACHINE_IP` in a browser. Kibana opens in Discover, already signed in.
4. Answer the questions in the room. There are 12 answer flags and one hidden `DEATHCON{...}` flag.

The lab is available until **31 December 2026**.

### The data

| | |
| --- | --- |
| Index and data view | `challenge_logs` |
| Time window | Monday 26 October 2026, 07:30 to 10:05 UTC. Kibana shows every time in UTC and opens on this window |
| Hosts | Nine: the CEO's laptop (`SGC-CEO-LT01`), the CFO's laptop, two finance workstations, an IT admin's and a developer's workstations, the domain controller, the file server and an IT management server |
| Sysmon | 1 (process creation), 3 (network), 7 (image load), 11 (file creation), 13 (registry), 15 (file stream), 22 (DNS) |
| Security | 4688 (process creation with command line), 4698 (scheduled task created), logons, and on the servers Kerberos (4768, 4769) and share access (5140, 5145) |
| PowerShell | 4104 (script block logging) |

Every name, IP address and domain in the scenario is fictional. Don't try to reach them.

### Tools

Use whichever query language you know best:

- **KQL** in Discover's default search bar
- **ES\|QL** in Discover (switch the query bar to ES\|QL)
- **EQL** in Dev Tools, for sequences

CyberChef or a shell helps with decoding.

### Tips before you start

- **Most questions are about `SGC-CEO-LT01`.** In the logs, `host.name` is the short name in lowercase, so filter on `host.name : "sgc-ceo-lt01"`. The other eight hosts are there on purpose: they hold the noise your rules have to survive.
- **"Process creation" means Sysmon event ID 1.** Security event 4688 records the same processes, so filter on `event.code` before you count anything.
- **KQL wildcards are case-sensitive** and can't contain spaces: `*-ec*` and `*-EC*` are different searches. In ES\|QL, lowercase the field first with `TO_LOWER()`. In EQL, the `:` operator ignores case.
- **No results?** Check that the time picker covers 26 October 2026, 07:30 to 10:10 UTC.
- **Stuck?** Every question has a hint in the room, and the [lab guide](lab-guide.html) explains the approach for each one without giving the answers.

## Resources

- [Lab guide](lab-guide.html): how to approach every question, with ES\|QL and KQL queries, no answers
- [Detection rules](rules/): the rebuilt Sigma rules R1–R7 from the workshop, plus related public SigmaHQ rules
- [Resources](resources.html): the MITRE ATT&CK techniques in the chain, threat reports on the families that use them, and tools

## About

Workshop, lab and dataset by **Igor Moura** ([GitHub](https://github.com/mouralgor)) for [DEATHCon 2026](https://deathcon.io). The lab data is synthetic: it was generated for this workshop and contains no real organization's logs.
