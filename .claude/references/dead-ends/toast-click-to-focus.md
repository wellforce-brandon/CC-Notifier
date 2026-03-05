# Dead End: Toast Click-to-Focus VS Code

**Bug/Feature:** Clicking a Windows toast notification should bring VS Code to the foreground
**Status:** resolved
**Last updated:** 2026-03-05
**Sessions:** 2

## Problem Statement
When CC-Notifier fires a Windows toast notification, clicking that toast should focus the VS Code window (or the specific terminal running Claude Code). None of the attempted approaches successfully handled the click event or launched a URI from the toast.

## Resolution
**PowerShell WinRT toast with `activationType="protocol"` and `Microsoft.Windows.Explorer` AppID.**

Replaced node-notifier entirely with a PowerShell script (`hook/toast.ps1`) that uses the Windows Runtime `Windows.UI.Notifications` API. The toast XML uses `activationType="protocol"` with a `vscode://cc-notifier.cc-notifier/focus?...` URI as the `launch` attribute. Windows handles protocol activation natively on click — no callback or pipe needed. The extension's existing URI handler (`extension.ts`) catches the URI and calls `terminalManager.focusTerminal()`.

Key details:
- AppID: `Microsoft.Windows.Explorer` (registered system AppID, avoids invisible toast issue from approach #6)
- URI query params are XML-escaped (`&` → `&amp;`) in the PowerShell script
- Extension spawns `powershell -NoProfile -ExecutionPolicy Bypass -File toast.ps1` via `child_process.execFile`
- node-notifier dependency is no longer used for toast display

## Failed Approaches

### 1. node-notifier `wait: true` + `.on("click")` -- FAILED
- **What:** Set `wait: true` on the notification options and attached a `.on("click", callback)` handler.
- **Why it failed:** The click callback never fires. No log output observed when clicking the toast. The underlying SnoreToast process likely exits before the click can be captured, or the pipe communication for click events is broken in node-notifier's implementation.
- **Evidence:** Added logging inside the click callback -- no output appeared in any scenario.

### 2. `exec('start "" "vscode://..."')` from click callback -- FAILED
- **What:** Attempted to open a `vscode://` URI using `exec('start "" "vscode://..."')` to focus VS Code.
- **Why it failed:** The `&` character in the URI query string breaks `cmd.exe` parsing. `cmd.exe` interprets `&` as a command separator, so the URI gets truncated.
- **Evidence:** Command fails silently or executes partial command.

### 3. PowerShell `Start-Process` from click callback -- FAILED
- **What:** Used `exec('powershell -Command "Start-Process ..."')` inside the click callback to avoid cmd.exe parsing issues.
- **Why it failed:** Same root cause as approach #1 -- the click callback never fires, so the PowerShell command is never executed.
- **Evidence:** No PowerShell process spawned, no log output from callback.

### 4. SnoreToast `-install` parameter -- FAILED
- **What:** Tried using SnoreToast's `-install` flag, hoping it would enable click handling or register a protocol handler.
- **Why it failed:** `-install` is for creating a Start Menu shortcut to register an AppID, not for click handling. Misread the SnoreToast API.
- **Evidence:** No change in click behavior after running install.

### 5. Direct SnoreToast spawn with `-launch` flag -- FAILED
- **What:** Spawned SnoreToast directly (bypassing node-notifier) with the `-launch "vscode://..."` flag, which should open a URI when the toast is clicked.
- **Why it failed:** The bundled SnoreToast version (v0.7.0) in node-notifier does not support the `-launch` flag. It exits immediately with code -1.
- **Evidence:** Exit code -1 from SnoreToast process. The `-launch` flag was added in a later SnoreToast version.

### 6. PowerShell WinRT toast API (wrong AppID) -- FAILED
- **What:** Used PowerShell to construct a toast notification via the Windows Runtime `Windows.UI.Notifications` API, with a launch URI baked into the toast XML.
- **Why it failed:** Two different failure modes observed: (a) `AccessViolationException` when calling WinRT methods, likely a COM threading issue in the PowerShell host; (b) toast XML accepted without error but toast never appears, likely because the AppID used is not registered with the notification platform.
- **Evidence:** `System.AccessViolationException` on first attempt. Silent success but invisible toast on second attempt.

## Environment Notes
- Windows 11 Pro (10.0.26200)
- node-notifier 10.x (bundles SnoreToast v0.7.0) -- no longer used for toasts
- Node.js (VS Code extension host)
- VS Code ^1.93.0
