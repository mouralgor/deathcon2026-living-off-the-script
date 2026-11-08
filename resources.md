---
title: Resources
---

# Resources

[← Back to the workshop page](./)

## MITRE ATT&CK techniques in the chain

In the order they happen in the lab intrusion:

| Stage | Technique |
| --- | --- |
| Delivery | [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) |
| Delivery | [T1553.005 Subvert Trust Controls: Mark-of-the-Web Bypass](https://attack.mitre.org/techniques/T1553/005/) |
| Macro | [T1204.002 User Execution: Malicious File](https://attack.mitre.org/techniques/T1204/002/) |
| Macro | [T1059.005 Command and Scripting Interpreter: Visual Basic](https://attack.mitre.org/techniques/T1059/005/) |
| Macro | [T1047 Windows Management Instrumentation](https://attack.mitre.org/techniques/T1047/) |
| Second stage | [T1218.005 System Binary Proxy Execution: Mshta](https://attack.mitre.org/techniques/T1218/005/) |
| Persistence | [T1059.007 Command and Scripting Interpreter: JavaScript](https://attack.mitre.org/techniques/T1059/007/) |
| Persistence | [T1053.005 Scheduled Task/Job: Scheduled Task](https://attack.mitre.org/techniques/T1053/005/) |
| PowerShell | [T1059.001 Command and Scripting Interpreter: PowerShell](https://attack.mitre.org/techniques/T1059/001/) |
| PowerShell | [T1027 Obfuscated Files or Information](https://attack.mitre.org/techniques/T1027/) |
| Discovery | [T1059.003 Command and Scripting Interpreter: Windows Command Shell](https://attack.mitre.org/techniques/T1059/003/) |
| Discovery | [T1087.002 Account Discovery: Domain Account](https://attack.mitre.org/techniques/T1087/002/) |

The parent technique: [T1059 Command and Scripting Interpreter](https://attack.mitre.org/techniques/T1059/).

## Threat reports: the same primitives in the wild

The lab intrusion is fictional, but every link in its chain comes from real campaigns. These reports show the same primitives, in different wrappers.

### Emotet: macro → WMI → PowerShell

The closest real-world match for the lab's macro: Office spawns nothing, WMI does.

- [Detecting and Preventing Emotet 2019 Campaign (Security Advisory 2019-021)](https://cert.europa.eu/publications/security-advisories/2019-021/), CERT-EU, Sep 2019. The macro spawns obfuscated PowerShell through a WMI call; the advisory includes a `WmiPrvSE.exe → powershell.exe` hunting query.
- [Emotet Malware Distributed in the form of Document File](https://asec.ahnlab.com/en/15959/), AhnLab ASEC, Oct 2019. The macro uses `winmgmts:Win32_Process` to run PowerShell, which then runs under WmiPrvSE.
- [Emotet vs. Windows Attack Surface Reduction](https://isc.sans.edu/diary/27036), SANS Internet Storm Center, Jan 2021. Why the "block Office child processes" ASR rule never fires on WMI-spawned processes, and which rule does.
- [Emotet Malware (AA20-280A)](https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-280a), CISA and MS-ISAC, Oct 2020. Macro documents and PowerShell payload retrieval.
- MITRE ATT&CK: [Emotet (S0367)](https://attack.mitre.org/software/S0367/)

### QakBot: OneNote with an embedded HTA

- [QakBot eCrime Campaign Leverages Microsoft OneNote Attachments](https://www.crowdstrike.com/en-us/blog/qakbot-ecrime-campaign-leverages-microsoft-onenote-for-distribution/), CrowdStrike, Mar 2023. OneNote spawns mshta to run the embedded HTA, which downloads and runs the payload.
- [OneNote Documents Increasingly Used to Deliver Malware](https://www.proofpoint.com/us/blog/threat-insight/onenote-documents-increasingly-used-to-deliver-malware), Proofpoint, Feb 2023. The shift from macros to OneNote attachments with embedded HTA files.
- MITRE ATT&CK: [QakBot (S0650)](https://attack.mitre.org/software/S0650/)

### SocGholish: fake browser updates run by wscript

- [Part 1: SocGholish, a very real threat from a very fake update](https://www.proofpoint.com/us/blog/threat-insight/part-1-socgholish-very-real-threat-very-fake-update), Proofpoint, Nov 2022. Injected fake updates deliver a ZIP with a JavaScript file run by wscript.
- [SocGholish](https://redcanary.com/threat-detection-report/threats/socgholish/), Red Canary Threat Detection Report. Includes a detection for a browser launching a `.js` file through Windows Script Host.
- MITRE ATT&CK: [SocGholish (S1124)](https://attack.mitre.org/software/S1124/)

### Gootloader: JavaScript in a ZIP, wscript and a scheduled task

The same persistence pattern as the lab: a script host relaunched by a logon task.

- [Welcome to Goot Camp: Tracking the Evolution of GOOTLOADER Operations](https://cloud.google.com/blog/topics/threat-intelligence/tracking-evolution-gootloader-operations/), Mandiant, Jan 2023. The ZIP, the JavaScript run by wscript, and a scheduled task at logon.
- [SEO Poisoning to Domain Control: The Gootloader Saga Continues](https://thedfirreport.com/2024/02/26/seo-poisoning-to-domain-control-the-gootloader-saga-continues/), The DFIR Report, Feb 2024. A full intrusion: logon-triggered task, then `svchost → wscript → cscript → powershell`.
- [Gootloader](https://redcanary.com/threat-detection-report/threats/gootloader/), Red Canary Threat Detection Report.
- MITRE ATT&CK: [Gootloader (S1138)](https://attack.mitre.org/software/S1138/)

### ClickFix: the user pastes the command

- [Think before you Click(Fix): Analyzing the ClickFix social engineering technique](https://www.microsoft.com/en-us/security/blog/2025/08/21/think-before-you-clickfix-analyzing-the-clickfix-social-engineering-technique/), Microsoft Threat Intelligence, Aug 2025. Commands pasted into the Run dialog, mshta and PowerShell, and RunMRU forensics.
- [ClickFix Social Engineering Technique Floods Threat Landscape](https://www.proofpoint.com/us/blog/threat-insight/security-brief-clickfix-social-engineering-technique-floods-threat-landscape), Proofpoint, Nov 2024. Fake "Verify you are human" CAPTCHAs that make the user run PowerShell.

### Mark-of-the-Web bypass through archives

The lab's delivery depends on the extracted document losing its Mark-of-the-Web.

- [CVE-2025-0411: Ukrainian Organizations Targeted in Zero-Day Campaign and Homoglyph Attacks](https://www.trendmicro.com/en_us/research/25/a/cve-2025-0411-ukrainian-organizations-targeted.html), Trend Micro, Feb 2025. A 7-Zip MotW bypass exploited in the wild.
- [ZDI-25-045: 7-Zip Mark-of-the-Web Bypass Vulnerability](https://www.zerodayinitiative.com/advisories/ZDI-25-045/), Zero Day Initiative, Jan 2025. The advisory: extracted files don't inherit MotW; fixed in 7-Zip 24.09.

### Technique deep dives

Red Canary's Threat Detection Report pages on the interpreters in the chain, with detection ideas and the noise to expect:

- [PowerShell](https://redcanary.com/threat-detection-report/techniques/powershell/), including the `-EncodedCommand` abbreviations
- [Windows Command Shell](https://redcanary.com/threat-detection-report/techniques/windows-command-shell/)
- [Mshta](https://redcanary.com/threat-detection-report/techniques/mshta/)

## Detection rules

- [The rebuilt workshop rules (R1–R7)](rules/), in Sigma
- [Related public rules in SigmaHQ](rules/#related-public-rules-sigmahq), matched to each stage of the chain
- [SigmaHQ rule repository](https://github.com/SigmaHQ/sigma) and the [Sigma documentation](https://sigmahq.io)

## Tools

| Tool | What it's for |
| --- | --- |
| [Sigma](https://sigmahq.io) | Writing detection rules once and converting them to your SIEM's query language |
| [Chainsaw](https://github.com/WithSecureLabs/chainsaw) | Running Sigma rules and hunting directly against `.evtx` files |
| [Hayabusa](https://github.com/Yamato-Security/hayabusa) | Fast Windows event log timelines and Sigma-based detection on `.evtx` files |
| [oletools](https://github.com/decalage2/oletools) | Analyzing Office documents and extracting VBA macros |
| [CyberChef](https://gchq.github.io/CyberChef/) | Decoding Base64 and UTF-16LE PowerShell commands |
| [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) | The endpoint telemetry most of the hunts rely on |

## Keep learning

- The lab room: [tryhackme.com/jr/deathcon2026challenge](https://tryhackme.com/jr/deathcon2026challenge)
- [DEATHCon](https://deathcon.io), the Detection Engineering and Threat Hunting Conference
