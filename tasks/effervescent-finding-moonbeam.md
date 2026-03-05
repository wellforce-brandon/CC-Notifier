# Plan: Dead-End Documentation System

## Context

During this session, we spent 6+ rounds trying to make Windows toast click-to-focus work. Each approach failed for different technical reasons. If this debugging continues in a new session, that session will have zero knowledge of what was tried and will likely repeat the same dead ends. We need a lightweight convention for documenting failed approaches so future sessions can skip known dead ends.

## Changes

### 1. Create template: `.claude/references/dead-ends/TEMPLATE.md`

```markdown
# Dead End: [Short Title]

**Bug/Feature:** [One-line description]
**Status:** active | resolved
**Last updated:** YYYY-MM-DD
**Sessions:** [count]

## Problem Statement
[2-3 sentences]

## Failed Approaches

### 1. [Approach name] -- FAILED
- **What:** [What was tried]
- **Why it failed:** [Specific technical reason]
- **Evidence:** [Error message or observed behavior]

## Partial Leads
[Near-misses worth revisiting. Optional.]

## Environment Notes
[Versions, OS, config that matters]

## Next Steps to Try
[Untried ideas for the next session]
```

### 2. Create first real doc: `.claude/references/dead-ends/toast-click-to-focus.md`

Document all 6 failed approaches from this session:
1. node-notifier `wait: true` + `.on("click")` -- click events never fire (no log output)
2. `exec('start "" "vscode://..."')` -- `&` in URL breaks cmd.exe parsing
3. PowerShell `Start-Process` from click callback -- callback never reached (same root cause as #1)
4. SnoreToast `-install` parameter -- not for click handling, misread the API
5. Direct SnoreToast spawn with `-launch` flag -- exit code -1, flag not supported in bundled v0.7.0
6. PowerShell WinRT toast API -- AccessViolationException on one attempt, invisible toast on another (likely AppID issue)

Include partial leads (PowerShell WinRT with correct AppID, or replacing node-notifier with direct SnoreToast calls using proper pipe setup) and environment notes (Windows 11, node-notifier 10.x, SnoreToast 0.7.0).

### 3. Edit `CLAUDE.md` -- add 2 lines to Workflow section (line 80)

Add after existing item 5:
```
6. Before debugging a stubborn issue, check `.claude/references/dead-ends/` for prior failed attempts.
7. Before ending a session with an unresolved bug, write/update a dead-end file using `.claude/references/dead-ends/TEMPLATE.md`.
```

### 4. Edit `tasks/cc-notifier-mvp.md` -- add cross-reference (line ~596, Open Questions item 1)

Add note: "See `.claude/references/dead-ends/toast-click-to-focus.md` for attempted approaches."

## What this intentionally does NOT include

- No skill/hook automation -- CLAUDE.md instruction is sufficient, a hook on every session end would be noisy
- No index file -- `Glob` on the directory is enough with <10 files
- No date-based filenames -- problem description is the lookup key, not the date

## Verification

1. Confirm `.claude/references/dead-ends/TEMPLATE.md` exists and is valid markdown
2. Confirm `toast-click-to-focus.md` documents all 6 approaches with specific failure reasons
3. Confirm CLAUDE.md Workflow section has items 6 and 7
4. Start a fresh session and ask it to fix toast click-to-focus -- verify it reads the dead-end doc before proposing approaches
