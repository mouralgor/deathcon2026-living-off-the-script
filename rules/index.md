---
title: Detection rules
icon: shield
description: "The rules rebuilt in the workshop, written in Sigma. They detect relationships and behavior, not the attacker's spelling: who started what, what connected where, and what happened right after a macro ran."
chips:
  - text: Sigma
    kind: lime
  - text: 8 rules
  - text: Status experimental
actions:
  - text: Browse the YAML on GitHub
    url: https://github.com/mouralgor/deathcon2026-living-off-the-script/tree/main/rules
    style: outline
    icon: code
---

<p class="note">All the rules are <code>experimental</code>: test them against your own environment and baseline the false positives before you deploy them.</p>

## The rebuilt rules

| Rule | What it catches | Log source | ATT&CK | Level |
| --- | --- | --- | --- | --- |
| [R1](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r1_wmiprvse_spawns_interpreter.yml) | WmiPrvSE.exe starting an interpreter or proxy binary: the WMI trick that breaks the macro's process tree | Process creation | T1047, T1218.005 | high |
| [R2](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r2_script_host_external_connection.yml) | mshta, wscript or cscript opening a connection to a non-internal address | Network connection | T1218.005, T1059.005, T1059.007 | high |
| [R3](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r3_wsh_engine_switch.yml) | Windows Script Host forced to an engine with `/e:`, which runs any file as JScript or VBScript whatever its extension | Process creation | T1059.005, T1059.007 | high |
| [R4](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r4_powershell_encoded_command_windash.yml) | PowerShell encoded commands with any accepted prefix (`-e`, `-ec`, `-en`, `-enc`, `-enco`…) and any dash, using `windash` and `OriginalFileName` | Process creation | T1059.001, T1027 | medium |
| [R5](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r5_script_host_spawns_shell.yml) | A script host or mshta starting PowerShell or cmd | Process creation | T1059.001, T1218.005 | high |
| [R6a](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r6a_schtasks_created_by_script_host.yml) | `schtasks /create` run by a script host, mshta or PowerShell | Process creation | T1053.005 | medium |
| [R6b](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r6b_task_action_runs_script_host.yml) | A new scheduled task whose action runs wscript, cscript or mshta | Security 4698 | T1053.005 | medium |
| [R7](https://github.com/mouralgor/deathcon2026-living-off-the-script/blob/main/rules/r7_macro_then_interpreter_correlation.yml) | Correlation: an Office app loads the VBA engine (VBE7.DLL) and an interpreter starts on the same host within 2 minutes, whoever the parent is | Image load + process creation | T1204.002, T1059 | high |

Notes:

- **R4** uses Sigma's `windash` modifier, which expands `-` into `-`, `/`, `–`, `—` and `―`. Expect management agents that use `-EncodedCommand` on a schedule; baseline them by parent path, user and command line rather than by process name alone.
- **R7** is a Sigma [correlation rule](https://sigmahq.io/docs/meta/correlations.html). If your backend doesn't support correlations, run it as a hunt: list VBE7.DLL loads, then every process started on that host in the next two minutes.
- **R6a and R6b** will catch IT provisioning tools that create tasks. Allow-list them by task name and action.

### Testing without a SIEM

[Chainsaw](https://github.com/WithSecureLabs/chainsaw) and [Hayabusa](https://github.com/Yamato-Security/hayabusa) both run Sigma rules directly against `.evtx` files.

## Related public rules (SigmaHQ)

Community rules in the [SigmaHQ repository](https://github.com/SigmaHQ/sigma) that cover the same behaviors. Compare their logic and false-positive notes with the rules above.

| Stage | SigmaHQ rule |
| --- | --- |
| Macro runs | [VBA DLL Loaded Via Office Application](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/image_load/image_load_office_vbadll_load.yml) |
| Office spawns a child | [Suspicious Microsoft Office Child Process](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_office_susp_child_processes.yml) |
| WMI breaks the tree | [Suspicious WmiPrvSE Child Process](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_wmiprvse_susp_child_processes.yml) · [WmiPrvSE Spawned PowerShell](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_wmiprvse_spawns_powershell.yml) |
| Remote HTA | [Remotely Hosted HTA File Executed Via Mshta.EXE](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_mshta_http.yml) · [Suspicious MSHTA Child Process](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_mshta_susp_child_processes.yml) |
| Script host | [Cscript/Wscript Uncommon Script Extension Execution](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_wscript_cscript_uncommon_extension_exec.yml) · [Cscript/Wscript Potentially Suspicious Child Process](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_wscript_cscript_susp_child_processes.yml) · [Outbound Network Connection Initiated By Script Interpreter](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/network_connection/net_connection_win_wscript_cscript_outbound_connection.yml) |
| Encoded PowerShell | [Suspicious Execution of Powershell with Base64](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_powershell_encode.yml) · [Suspicious Encoded PowerShell Command Line](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_powershell_base64_encoded_cmd.yml) |
| Persistence | [Suspicious Command Patterns In Scheduled Task Creation](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_schtasks_susp_pattern.yml) · [Suspicious Scheduled Task Creation](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/builtin/security/win_security_susp_scheduled_task_creation.yml) |
| Same primitives, other wrappers | [OneNote.EXE Execution of Malicious Embedded Scripts](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_office_onenote_embedded_script_execution.yml) · [Suspicious ClickFix/FileFix Execution Pattern](https://github.com/SigmaHQ/sigma/blob/master/rules/windows/process_creation/proc_creation_win_susp_clickfix_filefix_execution.yml) |
