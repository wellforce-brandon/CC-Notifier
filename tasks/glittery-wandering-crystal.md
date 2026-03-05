# Plan: Toast Focus Suppression & Reminder Cancellation

## Context
After fixing toast click-to-focus, three UX issues remain:
1. Toasts fire even when VS Code is already focused (annoying when you're actively working)
2. Reminder timers (5min, 15min) keep firing after the user clicks the toast or returns to VS Code
3. Possible false notifications while Claude is "thinking" — likely stale reminders from issue #2

Fixing #1 and #2 should resolve #3. If not, we'll investigate further.

## Changes

### 1. Suppress notifications when VS Code is focused
**File: `src/notifications.ts`**

- At the top of `notify()`, check `vscode.window.state.focused`
- If the window is focused, skip the toast (no point toasting when you're looking at VS Code)
- Still fire the in-app notification since it's unobtrusive when you're already in VS Code

### 2. Cancel reminders on toast click (URI handler)
**File: `src/extension.ts`**

- In the URI handler (`handleUri`), after calling `terminalMgr.focusTerminal()`, also call `notificationManager.clearSession(sessionId)`
- This cancels the 5min and 15min reminder timers when the user clicks the toast

### 3. Cancel reminders when VS Code window regains focus
**File: `src/extension.ts`**

- Register `vscode.window.onDidChangeWindowState` listener
- When `windowState.focused` becomes `true`, clear ALL active sessions (since the user is back)
- Push the listener to `context.subscriptions`

### 4. Update design-guardrails.md
**File: `.claude/references/design-guardrails.md`**

- Update line 10 to reference PowerShell WinRT toast instead of node-notifier
- Update line 76 and 84 to remove node-notifier references

## Files to modify
- `src/notifications.ts` — add focus check in `notify()`, export sessions for clearing
- `src/extension.ts` — add `clearSession` call in URI handler, add `onDidChangeWindowState` listener
- `test/unit/notifications.test.ts` — add tests for focus suppression
- `.claude/references/design-guardrails.md` — update stale node-notifier references

## Verification
1. Build: `node esbuild.mjs`
2. Tests: `npx vitest run`
3. Copy to installed extension: `cp dist/extension.js ~/.vscode/extensions/cc-notifier.cc-notifier-0.1.0/dist/extension.js`
4. Reload VS Code window
5. Manual test: fire event while VS Code is focused → should get in-app only, no toast
6. Manual test: fire event while switched away → should get toast, click it → VS Code focuses, reminders cancelled
7. Manual test: fire event while switched away → switch back manually → reminders should cancel
