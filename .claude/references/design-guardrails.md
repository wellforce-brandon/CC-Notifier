# Design Guardrails -- CC-Notifier

## Extension Architecture

- **Single responsibility per module:** Each source file handles one concern (notifications, hook listening, terminal mapping, config).
- **No webviews unless necessary.** This extension uses native VS Code UI elements (notifications, status bar, commands). Do not introduce webview panels.
- **Stateless hook script:** The hook script (`hook/hook-script.js`) must be a fast, zero-dependency Node.js script. It writes an event file and exits. No long-running processes.

## Notification UX

- **Windows toast:** Use `node-notifier` with `WindowsToaster`. Include the terminal/session name in the notification title.
- **In-app notification:** Use `vscode.window.showInformationMessage()` with an "Open Terminal" action button. Never use `showWarningMessage` or `showErrorMessage` for idle notifications.
- **Auto-dismiss:** When the user focuses the idle terminal, dismiss the in-app notification. Toast notifications are OS-managed and dismissed on click.
- **No notification spam:** Debounce notifications per session. If a session is already notified as idle, do not re-notify until the user interacts with it.
- **Permission prompts are higher priority:** Use a distinct notification style (or `showWarningMessage`) for permission_prompt events since they block Claude's work.

## Status Bar

- **Location:** Left side of status bar, low priority (does not compete with language/git indicators).
- **States:**
  - Hidden when no Claude Code sessions are idle.
  - Shows idle count: "CC: 2 waiting" with a click action to list idle sessions.
- **Icon:** Use a built-in VS Code codicon (e.g., `$(bell)` or `$(comment-discussion)`).

## Event File Format

Hook events are written as JSON files to a temp directory (`os.tmpdir()/cc-notifier/`):

```json
{
  "event": "idle_prompt",
  "session_id": "abc123",
  "timestamp": 1709654400000,
  "cwd": "/path/to/project",
  "message": "Claude is waiting for your input",
  "notification_type": "idle_prompt"
}
```

Claude Code hook stdin JSON includes: `session_id`, `cwd`, `hook_event_name`, and for Notification events: `notification_type` and `message`. The `$CLAUDE_PROJECT_DIR` env var is also available in hook commands.

Available notification matchers: `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`.

- One file per event, named `{session_id}-{timestamp}.json`.
- Extension deletes event files after processing.
- Hook script must handle concurrent writes safely (atomic write via temp + rename).

## Configuration Schema

Extension settings in `contributes.configuration`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ccNotifier.enableToast` | boolean | true | Show Windows toast notifications |
| `ccNotifier.enableInApp` | boolean | true | Show VS Code in-app notifications |
| `ccNotifier.enableStatusBar` | boolean | true | Show status bar idle count |
| `ccNotifier.notifyOnStop` | boolean | true | Notify when Claude finishes responding |
| `ccNotifier.notifyOnIdle` | boolean | true | Notify when Claude is idle ~60s |
| `ccNotifier.notifyOnPermission` | boolean | true | Notify when Claude needs permission |

## Code Conventions

- **No classes unless needed.** Prefer plain functions and module-level state for simple extensions.
- **Disposables:** Every event listener, file watcher, and status bar item must be pushed to `context.subscriptions` for cleanup.
- **Error boundaries:** Wrap notification calls in try/catch. A failed toast must never crash the extension.
- **Logging:** Use `vscode.window.createOutputChannel("CC-Notifier")` for debug logging. Never `console.log`.

## Testing

- **Unit tests (Vitest):** Test hook event parsing, debounce logic, config resolution, file watcher filtering. Mock `vscode` API and `node-notifier`.
- **Integration tests (@vscode/test-electron):** Test extension activation, command registration, notification display in a real VS Code instance.
- **No E2E tests with real Claude Code.** Mock the hook events by writing test event files to the temp directory.

## Packaging & Bundling

- **node-notifier must NOT be in esbuild `external`** -- it has platform-specific binaries (WindowsToaster). Either bundle it or keep it in `node_modules` alongside `dist/extension.js`.
- **Windows 10/11 toast appID** -- node-notifier's `WindowsToaster` requires a valid `appID` for toasts to display correctly (Fall Creators Update+). Use VS Code's appID or register a custom one.
- **Reference extension:** [vscode-notify-desktop](https://github.com/ssv445/vscode-notify-desktop) uses the same pattern (external trigger → extension → node-notifier → toast).

## Performance

- **File watcher:** Use `fs.watch` on the temp directory, not polling. Polling wastes CPU.
- **Startup:** Extension should activate lazily (only when a Claude Code terminal exists or when the first hook event arrives). Use `activationEvents` appropriately.
- **Bundle size:** Keep dependencies minimal. Only `node-notifier` as a runtime dependency. Everything else is dev-only.
