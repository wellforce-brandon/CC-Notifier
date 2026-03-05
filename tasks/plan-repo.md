# Plan: CC-Notifier

## Project Requirements

- **What:** VS Code extension that sends Windows toast notifications when Claude Code is idle/waiting for user input
- **Users:** Personal use (developer using Claude Code daily)
- **Scale:** Personal tool, potential Marketplace publishing later
- **UI:** No webview -- uses native VS Code notifications, status bar, and Windows toast notifications
- **Real-time:** Yes -- must detect Claude Code idle state and notify promptly
- **External integrations:** Claude Code hooks system, Windows notification system

## Stack

| Layer | Choice | Version | Why |
|-------|--------|---------|-----|
| Language | TypeScript | 5.x | Required by VS Code Extension API |
| Bundler | esbuild | 0.24+ | Fast, recommended default for VS Code extensions |
| Package manager | npm | 9+ | Standard for VS Code extensions, no monorepo needed |
| Notifications | node-notifier | 10+ | Produces native Windows toasts even when VS Code is unfocused |
| In-app | VS Code Notification API | -- | Built-in, "Open Terminal" button support |
| Detection | Claude Code hooks | -- | Officially supported, stable, no unstable APIs needed |
| Linter + formatter | Biome | 1.9+ | Fast, single tool for lint + format |
| Test runner (unit) | Vitest | 3.x | Fast, TypeScript-native |
| Test runner (integration) | @vscode/test-electron | latest | Official VS Code integration test harness |
| Min VS Code engine | ^1.93.0 | -- | Shell integration APIs available as fallback |

## Architecture

### Detection: Claude Code Hooks (primary approach)

Claude Code hooks fire shell commands on specific events. We configure three hooks:

1. **`Notification` with `idle_prompt` matcher** -- Claude idle ~60s
2. **`Notification` with `permission_prompt` matcher** -- Claude needs permission
3. **`Stop` event** -- Claude finished responding

Each hook invokes a lightweight Node.js script (`hook/hook-script.js`) that:
1. Receives JSON on stdin (session_id, transcript_path, cwd, etc.)
2. Writes a JSON event file to `os.tmpdir()/cc-notifier/{session_id}-{timestamp}.json`
3. Exits immediately

### Extension: File Watcher + Notification

The VS Code extension:
1. Watches `os.tmpdir()/cc-notifier/` with `fs.watch`
2. On new file: reads event JSON, deletes file
3. Maps `session_id` to a VS Code terminal (best-effort matching by cwd or terminal name)
4. Fires Windows toast via `node-notifier` AND in-app notification via VS Code API
5. In-app notification has "Open Terminal" button that focuses the correct terminal
6. Auto-dismisses when user focuses the idle terminal
7. Updates status bar item with idle session count

### Why Not Terminal Output Monitoring?

- `vscode.window.onDidWriteTerminalData` is a **proposed API** -- cannot be used in published extensions
- Shell integration APIs (`onDidEndTerminalShellExecution`) detect command completion but don't expose raw output
- Claude Code hooks are the officially supported integration point

## File Structure

```
CC-Notifier/
  src/
    extension.ts          # activate/deactivate, wire everything together
    notifications.ts      # Windows toast + VS Code notification logic
    hook-listener.ts      # fs.watch on temp dir, parse events
    terminal-manager.ts   # Map session IDs to VS Code terminals
    config.ts             # Read extension settings
  hook/
    hook-script.js        # Plain JS (no build step), invoked by Claude Code hooks
  test/
    unit/
      hook-listener.test.ts
      notifications.test.ts
      terminal-manager.test.ts
    integration/
      extension.test.ts
  .vscode/
    launch.json
    tasks.json
  package.json            # Extension manifest
  tsconfig.json
  esbuild.mjs
  biome.json
  .vscodeignore
  .gitignore
  README.md
  CLAUDE.md
  agents.md
  tasks/
    plan-repo.md          # This file
```

## CLAUDE.md Hierarchy

- **Root `CLAUDE.md`** -- Project-wide rules, VS Code extension conventions, stack summary
- **No subfolder CLAUDE.md files needed** -- project is small enough for a single root file
- **`.claude/rules/`** -- May add extension-api.md with VS Code API patterns if needed during development

## Extension Settings (contributes.configuration)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ccNotifier.enableToast` | boolean | true | Windows toast notifications |
| `ccNotifier.enableInApp` | boolean | true | VS Code in-app notifications |
| `ccNotifier.enableStatusBar` | boolean | true | Status bar idle count |
| `ccNotifier.notifyOnStop` | boolean | true | Notify on Claude finish |
| `ccNotifier.notifyOnIdle` | boolean | true | Notify on Claude idle |
| `ccNotifier.notifyOnPermission` | boolean | true | Notify on permission needed |

## Development Phases

### Phase 1: Foundation
- [ ] Scaffold extension (package.json, tsconfig, esbuild, launch.json)
- [ ] Create hook script (hook/hook-script.js) that writes event files
- [ ] Create file watcher (hook-listener.ts) that reads events
- [ ] Basic Windows toast via node-notifier
- [ ] Basic in-app notification via VS Code API
- [ ] Manual hook configuration instructions

### Phase 2: Core Features
- [ ] Terminal manager: map session_id to VS Code terminal instances
- [ ] "Open Terminal" button on notifications
- [ ] Auto-dismiss when terminal is focused
- [ ] Status bar indicator with idle count
- [ ] Distinct notification for permission_prompt vs idle_prompt vs stop
- [ ] Debounce: don't re-notify for already-notified sessions

### Phase 3: Polish
- [ ] First-run setup: detect if hooks are configured, offer to add them
- [ ] Extension settings UI (contributes.configuration)
- [ ] Output channel for debug logging
- [ ] Error handling: missing temp dir, corrupt event files, node-notifier failures
- [ ] Edge cases: multiple VS Code windows, remote SSH

### Phase 4: Ship
- [ ] Package as .vsix with vsce
- [ ] Test on clean Windows install
- [ ] README with screenshots/GIFs
- [ ] Optional: Marketplace publishing

## Hook Configuration

Added to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [{ "type": "command", "command": "node \"<extension-path>/hook/hook-script.js\" idle" }]
      },
      {
        "matcher": "permission_prompt",
        "hooks": [{ "type": "command", "command": "node \"<extension-path>/hook/hook-script.js\" permission" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node \"<extension-path>/hook/hook-script.js\" stop" }]
      }
    ]
  }
}
```

Hook script receives JSON on stdin:
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/project",
  "hook_event_name": "Notification"
}
```

## Key Research Findings

1. **`onDidWriteTerminalData` is permanently proposed** -- cannot use in published extensions
2. **Claude Code hooks are the official integration point** -- `Notification` event with `idle_prompt` matcher fires after ~60s idle
3. **`node-notifier`** is the proven approach for Windows toasts from VS Code extensions (used by Background Terminal Notifier extension)
4. **Electron Notification API is inaccessible** from extension host process
5. **`yo generator-code` with esbuild** is still the recommended scaffolding approach
6. **Min VS Code ^1.93.0** gives shell integration APIs as fallback
