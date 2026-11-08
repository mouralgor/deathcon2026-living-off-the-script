---
title: Lab guide (no spoilers)
---

# Lab guide: Operation Late Alert

[← Back to the workshop page](./)

This guide explains how to approach every question in the [lab room](https://tryhackme.com/jr/deathcon2026challenge): which events to look at, which fields matter, and a query to start from. It doesn't give the answers: run the queries and read the results yourself.

Each step has an **ES\|QL** query (switch Discover's query bar to ES\|QL and paste it) and a **KQL** query for Discover's default search bar. They return the same documents. With KQL, add the fields from the ES\|QL `KEEP` list as columns, and click a field in the sidebar to see its top values.

## Before you start

- **Scope to the host.** Nine hosts share the `challenge_logs` index. Unless a question says otherwise, it's about the CEO's laptop: filter on `host.name == "sgc-ceo-lt01"` (ES\|QL) or `host.name : "sgc-ceo-lt01"` (KQL). The name is lowercase, and KQL matches it exactly.
- **Check the time picker.** Discover filters every query by it, ES\|QL included. The data covers 26 October 2026, 07:30 to 10:05 UTC.
- **Process creation means Sysmon event 1.** Security 4688 records the same processes, so filter on `event.code` before you count.
- **Field names follow Winlogbeat and ECS.** `process.name`, `process.parent.name`, `process.command_line`, `process.entity_id` (the Sysmon ProcessGuid), `dll.name`, `file.path`, `registry.path`, `destination.ip`. Anything else Sysmon recorded is under `winlog.event_data.*`.
- **KQL wildcards are case-sensitive and can't contain spaces.** ES\|QL's `TO_LOWER()` and EQL's `:` operator ignore case.

## Task 2: Triage the 09:47 alert

**The parent of the alerting PowerShell.** List every PowerShell launch on the CEO's laptop and find the one at 09:47. Another host also ran PowerShell that minute, which is why the host filter matters.

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "1" AND process.name == "powershell.exe" | KEEP @timestamp, process.parent.name, process.command_line | SORT @timestamp
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "1" and process.name : "powershell.exe"
```

Most launches share one parent and repeat on a schedule. Look for the one that doesn't fit, and read its command line carefully, character by character.

**What the alerting command downloads.** `-ec` is short for `-EncodedCommand`, which takes Base64 of **UTF-16LE** text. Decode it in CyberChef with *From Base64*, then *Decode text (UTF-16LE 1200)*. Or let PowerShell do it for you: script block logging (event 4104) records the command after decoding.

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "4104" AND @timestamp >= "2026-10-26T09:47:00Z" | KEEP @timestamp, log.level, powershell.file.script_block_text | SORT @timestamp
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "4104" and @timestamp >= "2026-10-26T09:47:00Z"
```

Give the URL exactly as logged, not defanged.

## Task 3: Hunt back: how the attacker stayed

**The file the script host runs.** List every Windows Script Host launch on the laptop. Several are routine IT scripts that run at every logon. One isn't.

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "1" AND process.name IN ("wscript.exe", "cscript.exe") | KEEP @timestamp, process.parent.name, process.command_line | SORT @timestamp
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "1" and process.name : ("wscript.exe" or "cscript.exe")
```

Check the parent (which service starts processes for scheduled tasks?) and the `//E:` switch: it tells the Script Host which engine to use, whatever the file extension says.

**The scheduled task.** Security event 4698 records every task created, with its full XML. Compare the actions: which task runs a script host?

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "4698" | KEEP @timestamp, user.name, winlog.event_data.TaskName, winlog.event_data.TaskContent
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "4698"
```

The answer is the task name without the leading backslash.

**Who created the task.** Find the `schtasks /create` commands and read their parent process.

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "1" AND process.name == "schtasks.exe" | KEEP @timestamp, process.parent.name, process.command_line
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "1" and process.name : "schtasks.exe"
```

**The HTA URL.** mshta can run an HTA straight from a URL on its command line. One mshta launch on the laptop is IT's provisioning tool; the other isn't.

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "1" AND process.name == "mshta.exe" | KEEP @timestamp, process.parent.name, process.command_line
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "1" and process.name : "mshta.exe"
```

## Task 4: Patient zero

**mshta's parent.** The same query shows it. Ask yourself which Windows process starts programs on behalf of a WMI call, and why a macro would use WMI instead of starting the process itself.

**The document.** When the process tree breaks, pivot on time. List every process start and DLL load in the minute or two before the malicious mshta (adjust the window to the time you found):

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code IN ("1", "7") AND @timestamp >= "2026-10-26T08:42:50Z" AND @timestamp < "2026-10-26T08:44:10Z" | KEEP @timestamp, event.code, process.parent.name, process.name, dll.name, process.command_line | SORT @timestamp
```

```kql
host.name : "sgc-ceo-lt01" and event.code : ("1" or "7") and @timestamp >= "2026-10-26T08:42:50Z" and @timestamp < "2026-10-26T08:44:10Z"
```

`VBE7.DLL` is the VBA engine: when an Office process loads it, a macro is running. `process.entity_id` ties the DLL load to the process that opened the document. Word also writes a TrustRecords registry value when someone clicks *Enable Content*:

```kql
host.name : "sgc-ceo-lt01" and event.code : "13" and registry.path : *TrustRecords*
```

**Where the archive came from.** Windows marks downloaded files with a `Zone.Identifier` stream (Mark-of-the-Web), and Sysmon event 15 records its contents. Notice which file has one and which doesn't.

```esql
FROM challenge_logs | WHERE host.name == "sgc-ceo-lt01" AND event.code == "15" | KEEP @timestamp, file.path, winlog.event_data.Contents
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "15"
```

The answer is the `HostUrl` value, not the `ReferrerUrl`.

## Task 5: Rule autopsy and tuning

**Rebuild the encoded-command rule and test it on every host.** PowerShell accepts any unique prefix of `-EncodedCommand` (`-e`, `-ec`, `-en`, `-enc`, `-enco` and longer) after any of five prefix characters: `-`, `/`, `–` (en dash), `—` (em dash) and `―` (horizontal bar). Drop the host filter: false positives live on the other hosts.

```esql
FROM challenge_logs | WHERE event.code == "1" AND process.name == "powershell.exe" AND TO_LOWER(process.command_line) RLIKE ".* [-/–—―](e |ec |en |enc |enco).*" | STATS hits = COUNT(*), hosts = COUNT_DISTINCT(host.name) BY process.parent.name | SORT hits DESC
```

In KQL, search the `process.command_line.text` subfield. It holds the command line split into lowercase words with the dashes and slashes removed, so `ec` matches `-ec`, `/EC` and `–ec`:

```kql
event.code : "1" and process.name : "powershell.exe" and process.command_line.text : (e or ec or en or enc or enco or encod or encode or encoded or encodedc or encodedco or encodedcom or encodedcomm or encodedcomma or encodedcommand)
```

Count the hits by parent. A launch that repeats on every host, on a schedule, as SYSTEM, with the same command line each time, is a heartbeat rather than an attacker. Then exclude that parent and count again.

Two traps:

- A loose KQL wildcard such as `*-e*` also matches `-ExecutionPolicy`, which isn't a prefix of `-EncodedCommand`. Match the switch, not the letter.
- Make sure your rule catches the en dash (U+2013).

**The legitimate macro.** "Office loaded the VBA engine" isn't malicious on its own. List every VBE7.DLL load on the laptop, then match each `process.entity_id` to the Office process and the document it opened:

```kql
host.name : "sgc-ceo-lt01" and event.code : "7" and dll.name : "VBE7.DLL"
```

```kql
host.name : "sgc-ceo-lt01" and event.code : "1" and process.name : ("WINWORD.EXE" or "EXCEL.EXE")
```

Then ask what started in the two minutes after each load. A macro followed by nothing is usually benign. The finance workstations are a useful baseline. The same logic as an EQL sequence, in Dev Tools:

```text
GET challenge_logs/_eql/search
{
  "query": """sequence by host.name with maxspan=2m
    [any where event.code == "7" and dll.name : "VBE7.DLL"]
    [process where event.code == "1" and process.name : ("mshta.exe", "wscript.exe", "cscript.exe", "powershell.exe", "cmd.exe")]"""
}
```

## Task 6: Bonus: the second stage

AMSI stopped the second stage, but script block logging kept a copy. Look at the 09:47 script blocks for a Base64 string being decoded. This time the text is UTF-8, not UTF-16LE.

```kql
host.name : "sgc-ceo-lt01" and event.code : "4104" and powershell.file.script_block_text : *FromBase64String*
```

## After the lab

- Run the [rebuilt detection rules](rules/) against the whole morning and note what else they catch.
- Look beyond the CEO's laptop: did anyone else receive the same lure? Did the attacker's discovery reach the domain controller, and is it the only enumeration there?
