# CC-Notifier

A VS Code extension that sends Windows toast notifications when Claude Code is idle and waiting for user input. Never miss a prompt again.

## How It Works

```
Claude Code finishes a task
        |
        v
Claude Code Hook fires (idle_prompt / Stop / permission_prompt)
        |
        v
Hook script writes event to a temp file or local IPC
        |
        v
VS Code extension detects the event
        |
        v
Windows toast notification + in-app notification with "Open Terminal" button
        |
        v
Clicking notification focuses the correct VS Code terminal
```

CC-Notifier uses Claude Code's built-in **hooks system** rather than unstable terminal-monitoring APIs. This means it works reliably with published VS Code extensions and doesn't depend on proposed/experimental APIs.

### Detected Events

| Event | When It Fires |
|-------|---------------|
| `idle_prompt` | Claude has been idle ~60 seconds waiting for input |
| `Stop` | Claude finishes responding (ready for next prompt) |
| `permission_prompt` | Claude needs permission approval to proceed |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript |
| Bundler | esbuild |
| Package manager | npm |
| Windows notifications | node-notifier |
| In-app notifications | VS Code Notification API |
| Detection | Claude Code hooks |
| Test runner | Vitest (unit) + @vscode/test-electron (integration) |
| Min VS Code version | ^1.93.0 |

## Prerequisites

- [Node.js](https://nodejs.org) >= 18.x
- [VS Code](https://code.visualstudio.com/) >= 1.93.0
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and configured
- Windows 10/11 (for native toast notifications)

## Getting Started

```bash
git clone https://github.com/wellforce-brandon/CC-Notifier.git
cd CC-Notifier
npm install
```

### Development

```bash
# Compile and watch for changes
npm run watch

# Launch Extension Development Host
# Press F5 in VS Code (runs .vscode/launch.json)

# Run tests
npm test

# Package as .vsix
npm run package
```

### Hook Setup

The extension will guide you through configuring Claude Code hooks on first activation. The hooks are added to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [{ "type": "command", "command": "node /path/to/cc-notifier/hook-script.js idle" }]
      },
      {
        "matcher": "permission_prompt",
        "hooks": [{ "type": "command", "command": "node /path/to/cc-notifier/hook-script.js permission" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node /path/to/cc-notifier/hook-script.js stop" }]
      }
    ]
  }
}
```

## Project Structure

```
CC-Notifier/
  src/
    extension.ts          # Extension entry point (activate/deactivate)
    notifications.ts      # Windows toast + VS Code notification logic
    hook-listener.ts      # Watches for hook events (file watcher or IPC)
    terminal-manager.ts   # Maps session IDs to VS Code terminals
    config.ts             # Extension settings and defaults
  hook/
    hook-script.js        # Script invoked by Claude Code hooks (writes events)
  test/
    unit/                 # Vitest unit tests
    integration/          # @vscode/test-electron integration tests
  .vscode/
    launch.json           # Extension debug configuration
    tasks.json            # Build tasks
  package.json            # Extension manifest + dependencies
  tsconfig.json           # TypeScript config
  esbuild.mjs             # Build script
  .vscodeignore           # Files excluded from .vsix package
```

## Features

- **Windows toast notifications** -- appear even when VS Code is in the background
- **In-app notifications** -- VS Code notification with "Open Terminal" button
- **Per-terminal tracking** -- each Claude Code session tracked independently
- **Auto-dismiss** -- notifications clear when you focus the idle terminal
- **Session identification** -- notifications show which terminal/session is waiting

## Development Phases

### Phase 1: Foundation
- Project scaffolding (package.json, tsconfig, esbuild)
- Hook script that writes events to a temp directory
- File watcher in the extension that picks up events
- Basic Windows toast notification via node-notifier

### Phase 2: Core Features
- Per-terminal session tracking (map session_id to VS Code terminal)
- "Open Terminal" button on notifications that focuses the correct terminal
- Auto-dismiss when terminal is focused
- VS Code status bar indicator showing idle session count
- Permission prompt notifications (distinct from idle)

### Phase 3: Polish
- First-run setup wizard for Claude Code hooks configuration
- Extension settings (enable/disable notification types, idle threshold)
- Error handling for missing hooks, permissions issues
- Edge cases: multiple windows, remote SSH sessions

### Phase 4: Ship
- Package as .vsix
- Documentation
- Optional: VS Code Marketplace publishing

## License

MIT
