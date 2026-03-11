# CC-Notifier -- Project Rules

VS Code extension that sends Windows toast notifications when Claude Code is idle and waiting for user input. Uses Claude Code's hooks system for detection and node-notifier for native Windows toasts.

## Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5.x |
| Runtime | Node.js (VS Code extension host) |
| Bundler | esbuild |
| Package manager | npm |
| Notifications | node-notifier (Windows toast) + VS Code Notification API (in-app) |
| Detection | Claude Code hooks (idle_prompt, permission_prompt, Stop) |
| Linter + formatter | Biome |
| Test (unit) | Vitest |
| Test (integration) | @vscode/test-electron |
| Min VS Code | ^1.93.0 |

## Architecture

```
Claude Code Hook → hook-script.js → event JSON file in temp dir
    → VS Code extension (fs.watch) → Windows toast + in-app notification
```

- **hook/hook-script.js** -- Plain JS, no build step. Receives JSON on stdin from Claude Code, writes event file to `os.tmpdir()/cc-notifier/`. Must be fast and zero-dependency.
- **src/extension.ts** -- Entry point. Wires hook listener, notification manager, terminal manager, status bar.
- **src/hook-listener.ts** -- Watches temp dir with `fs.watch`. Parses event files, deletes after processing.
- **src/notifications.ts** -- Fires Windows toast via node-notifier AND in-app via VS Code API. Debounces per session.
- **src/terminal-manager.ts** -- Maps session_id to VS Code terminal instances. Provides "Open Terminal" action.
- **src/config.ts** -- Reads extension settings from `contributes.configuration`.

## Coding Conventions

- No classes unless needed. Prefer plain functions and module-level state.
- Every listener, watcher, and status bar item must be pushed to `context.subscriptions`.
- Wrap notification calls in try/catch. Failed toasts must never crash the extension.
- Use `vscode.window.createOutputChannel("CC-Notifier")` for logging, never `console.log`.
- Hook script (`hook/hook-script.js`) stays plain JS -- no TypeScript, no build step, no dependencies.

## Key Constraints

- `onDidWriteTerminalData` is a proposed API -- do NOT use it. Use Claude Code hooks instead.
- `node-notifier` vendor binaries must be accessible outside asar/vsix packaging. Handle extraction if needed.
- Extension activates lazily -- only when first hook event arrives or on explicit command.

## Testing

- Unit tests mock `vscode` API and `node-notifier`. Test event parsing, debounce, config resolution.
- Integration tests use `@vscode/test-electron` in a real VS Code instance.
- No E2E tests with real Claude Code. Mock by writing event files to temp dir.

## Available Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| plan-repo | "plan repo" | Research and recommend best tech stack |
| init-repo | "initialize repo" | Build or rebuild .claude/ folder |
| update-practices | "update practices" | Fetch latest best practices |
| spec-developer | "spec developer" | Interview-driven feature spec |
| code-review | "code review" | Full codebase review |
| security-scan | "security scan" | Security audit |
| performance-review | "performance review" | Performance analysis |
| dependency-audit | "dependency audit" | Check dependencies |
| test-scaffold | "scaffold tests" | Generate test files |
| doc-sync | "sync docs" | Align docs with code |
| mermaid-diagram | "mermaid diagram" | Generate diagrams |

## Available Agents

See `agents.md` for the full registry: architect, reviewer, security, performance, explorer.

## Workflow

1. Read existing code before proposing changes.
2. Prefer editing existing files over creating new ones.
3. Do not over-engineer. Only make changes directly requested or clearly necessary.
4. Check `.claude/references/tools.md` for CLI tools before running commands.
5. Check `.claude/references/design-guardrails.md` for notification UX rules.
6. Before debugging a stubborn issue, check `.claude/references/dead-ends/` for prior failed attempts.
7. Before ending a session with an unresolved bug, write/update a dead-end file using `.claude/references/dead-ends/TEMPLATE.md`.

## RULE 1 -- Check LL-G Before Scripting (MANDATORY)

**At the start of any session involving scripting, API calls, or automation -- before writing a single line -- fetch the LL-G index and load relevant entries.**

```
Step 1: Fetch https://raw.githubusercontent.com/wellforce-brandon/LL-G/main/llms.txt
Step 2: For each technology you will use, fetch its sub-index (e.g., kb/ninjaone/llms.txt)
Step 3: Read ALL HIGH-severity entries for those technologies
Step 4: Read any MEDIUM entry whose title matches your specific task
```

Technologies currently in LL-G: PowerShell, Graph API, NinjaOne, Next.js, Tailwind CSS, TypeScript, Godot/GDScript, Better Auth, Bash.

This applies to every session, every technician, every developer. Not optional.

### Contributing back

Every plan file MUST end with a **Lessons Learned / Gotchas** section. After implementation, route any new discoveries to LL-G -- not to local agent-memory or local pattern files only.

- Preferred: run `/add-lesson` from any session that has `C:\Github\LL-G` in context
- Manual: create `kb/<tech>/<slug>.md`, update `kb/<tech>/llms.txt`, update the master `llms.txt`

Lessons stored locally stay local. Lessons in LL-G benefit every repo and every technician.
