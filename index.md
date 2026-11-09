---
title: "Living Off the Script: Hunting T1059 in the Wild"
nav_title: Workshop
icon: terminal
hero: true
numbered_tasks: true
description: "An EDR alert at 09:47, three detection rules that stayed silent, and a chain of scripts to trace back to patient zero. Watch the DEATHCon 2026 workshop, then hunt the intrusion yourself in a TryHackMe lab."
chips:
  - text: DEATHCon 2026
    kind: lime
  - text: Threat hunting
  - text: Detection engineering
  - text: Elastic and Kibana
  - text: MITRE ATT&CK T1059
actions:
  - text: Start the lab
    url: https://tryhackme.com/jr/deathcon2026challenge
    style: lime
    icon: flag
  - text: Watch the workshop
    url: "#watch-the-workshop"
    style: outline
    icon: play
---

## Introduction

On Monday at 09:47, an EDR flagged PowerShell on a CEO's laptop and isolated it. By then the attacker had run a macro, a remote HTA, a scheduled task, discovery commands and a reboot-surviving JScript, and the SOC's three detection rules had stayed silent. This workshop walks through that intrusion, shows why each rule missed it, and rebuilds detections and hunts that survive a broken process tree. Then you hunt it yourself in the lab.

### What you'll learn

1. How attackers chain scripting engines (VBA, HTA, JScript, VBScript, PowerShell, cmd) in real intrusions
2. What each link leaves in the logs, and where the telemetry gaps are
3. Why three common detection rules failed against this chain
4. How to hunt when the process tree breaks: pivot on host, user and time
5. How to build and test detections that survive syntax changes

## Watch the workshop

<div class="video">
  <iframe src="https://www.youtube-nocookie.com/embed/KvTerx2QEtI" title="Living Off the Script: Hunting T1059 in the Wild" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
</div>

<div class="link-row">
  <a class="btn btn-outline btn-sm" href="https://www.youtube.com/watch?v=KvTerx2QEtI">{% include icon.html name="play" %}Watch on YouTube</a>
  <a class="btn btn-ghost btn-sm" href="https://ln5.sync.com/dl/46453c680#wi68r9vz-kwzvrcrp-q6r7zy2w-3uxpn3y9">{% include icon.html name="download" %}Download the video (Sync.com)</a>
</div>

The video runs about an hour. The lab comes after it.

## The lab: Operation Late Alert

The lab is a TryHackMe challenge room with an Elastic (Kibana) machine. It holds one morning of Windows logs from **Sierra Grande Capital**, a fictional investment firm. Your job is to trace the 09:47 alert back to patient zero, explain why each SOC rule stayed silent, and build the detections that would have caught it.

<div class="stats">
  <div class="stat"><strong>9</strong><span>hosts, from laptops to the domain controller</span></div>
  <div class="stat"><strong>27,227</strong><span>events in <code>challenge_logs</code></span></div>
  <div class="stat"><strong>2 h 35 min</strong><span>of logs, 07:30 to 10:05 UTC</span></div>
  <div class="stat"><strong>12 + 1</strong><span>answer flags and a hidden bonus</span></div>
</div>

### Getting in

1. Sign in to TryHackMe and open the room: **[tryhackme.com/jr/deathcon2026challenge](https://tryhackme.com/jr/deathcon2026challenge)**.
2. Start the machine attached to Task 1 and give it about five minutes to boot.
3. From the AttackBox, or over the TryHackMe VPN, open `http://MACHINE_IP` in a browser. Kibana opens in Discover, already signed in.
4. Answer the questions in the room.

<div class="callout">
  <div>
    <p class="callout-title">{% include icon.html name="flag" %}Ready to hunt?</p>
    <p>12 answer flags and one hidden <code>DEATHCON{...}</code> flag. The room is open until 31 December 2026.</p>
  </div>
  <a class="btn btn-lime" href="https://tryhackme.com/jr/deathcon2026challenge">Open the room</a>
</div>

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

<div class="cards">
  <a class="card" href="lab-guide.html">
    <span class="card-icon">{% include icon.html name="map" %}</span>
    <strong>Lab guide</strong>
    <span class="card-text">How to approach every question, with ES|QL and KQL queries to start from. No answers.</span>
    <span class="card-cta">Open the guide {% include icon.html name="arrow" %}</span>
  </a>
  <a class="card" href="rules/">
    <span class="card-icon">{% include icon.html name="shield" %}</span>
    <strong>Detection rules</strong>
    <span class="card-text">The rebuilt Sigma rules R1 to R7 from the workshop, and the related public SigmaHQ rules.</span>
    <span class="card-cta">See the rules {% include icon.html name="arrow" %}</span>
  </a>
  <a class="card" href="resources.html">
    <span class="card-icon">{% include icon.html name="book" %}</span>
    <strong>Further reading</strong>
    <span class="card-text">The ATT&amp;CK techniques in the chain, threat reports on the families that use them, and tools.</span>
    <span class="card-cta">Read more {% include icon.html name="arrow" %}</span>
  </a>
</div>
