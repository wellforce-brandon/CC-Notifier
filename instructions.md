# CC-Notifier -- Instructions

## What This Project Is

A VS Code extension that notifies you when Claude Code is idle and waiting for input. It uses Claude Code's hooks system for detection and fires both Windows toast notifications (via node-notifier) and in-app VS Code notifications.

## Architecture Overview

```
Claude Code Hook Events:
  - Notification (idle_prompt)     → hook-script.js → event.json → fs.watch → notify
  - Notification (permission_prompt) → hook-script.js → event.json → fs.watch → notify
  - Stop                           → hook-script.js → event.json → fs.watch → notify
```

The hook script writes JSON event files to `os.tmpdir()/cc-notifier/`. The VS Code extension watches that directory and fires notifications.

## .claude/ Folder Structure

```
.claude/
  agents/                     # Custom agent definitions
    architect.md              # Phase-based planning and system design
    reviewer.md               # Code review agent
    security.md               # Security analysis agent
    performance.md            # Performance analysis agent
    explorer.md               # Codebase exploration and research
  rules/
    extension-api.md          # VS Code Extension API patterns (loads for src/**/*.ts)
  skills/
    plan-repo/SKILL.md        # Pre-init project planning
    init-repo/SKILL.md        # Repository initialization
    update-practices/SKILL.md # Best practice updates
    spec-developer/SKILL.md   # Interview-driven feature specs
    code-review/SKILL.md      # Code review
    security-scan/SKILL.md    # Security scanning
    performance-review/SKILL.md
    dependency-audit/SKILL.md
    test-scaffold/SKILL.md
    doc-sync/SKILL.md
    mermaid-diagram/SKILL.md
  references/
    source-urls.md            # URL registry for fetching best practices
    tools.md                  # CLI tools reference
    design-guardrails.md      # Notification UX rules and extension conventions
  settings.json               # Project-level Claude Code settings
```

## Skills Reference

| Skill | Trigger | Purpose |
|-------|---------|---------|
| plan-repo | "plan repo" | Research and recommend stack |
| init-repo | "initialize repo" | Build/rebuild .claude/ config |
| update-practices | "update practices" | Fetch latest best practices |
| spec-developer | "spec developer" | Interview-driven feature spec |
| code-review | "code review" | Full codebase review |
| security-scan | "security scan" | Security audit |
| performance-review | "performance review" | Performance analysis |
| dependency-audit | "dependency audit" | Check dependencies |
| test-scaffold | "scaffold tests" | Generate test files |
| doc-sync | "sync docs" | Align docs with code |
| mermaid-diagram | "mermaid diagram" | Generate diagrams |

## Agents Reference

All agents registered in [agents.md](agents.md):

| Agent | Model | Purpose |
|-------|-------|---------|
| architect | opus | Planning, tech stack, file structure |
| reviewer | sonnet | Code review, correctness, maintainability |
| security | opus | Vulnerability detection, secrets scanning |
| performance | sonnet | Bottleneck identification, optimization |
| explorer | sonnet | Codebase exploration, research |

## Development Workflow

1. **Plan in one session, execute in another.** Use `spec developer` for features.
2. **Phase-based planning:** Foundation → Core → Polish → Ship. No timelines.
3. **Save plans to `/tasks`.** Each feature gets a plan file.
4. **Use `/compact` proactively** around 50% context.

## Key Design Decisions

- **Claude Code hooks over terminal monitoring** -- `onDidWriteTerminalData` is a proposed API that can't be used in published extensions. Hooks are the official integration point.
- **node-notifier over Electron Notification** -- Extension host process can't access Electron's Notification API. node-notifier produces native Windows toasts.
- **File-based IPC over HTTP/sockets** -- Simplest reliable approach. Hook script writes a file, extension watches the directory. No server process needed.
- **Plain JS hook script** -- The hook script runs outside VS Code, invoked by Claude Code directly. Must be fast, zero-dependency, no build step.

## Adding New Skills or Agents

### New Skill
1. Create `.claude/skills/<name>/SKILL.md` with YAML frontmatter
2. Update the skill table in CLAUDE.md and this file

### New Agent
1. Create `.claude/agents/<name>.md` with YAML frontmatter
2. Register in [agents.md](agents.md)
3. Update CLAUDE.md
