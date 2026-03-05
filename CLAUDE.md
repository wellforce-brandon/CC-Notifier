# Project Rules

This repository is a Claude Code starter template. It provides a ready-to-use `.claude/` configuration folder that can be cloned for new projects or copied into existing ones.

## Workflow: Plan First, Then Init

1. Say **"plan repo"** to choose stack, generate README, create design guardrails.
2. Say **"initialize repo"** to configure Claude Code using the plan.
3. Say **"update practices"** periodically to stay current.

For features: say **"spec developer"** to generate a detailed plan, then start a fresh session to implement it.

## Coding Standards

- Write clear, concise code. Prefer readability over cleverness.
- Use descriptive names for variables, functions, and files.
- Keep functions small and focused on a single responsibility.
- Handle errors explicitly -- never swallow exceptions silently.
- Validate inputs at system boundaries (user input, API responses, file I/O).
- Avoid premature abstraction. Three similar lines are better than a forced helper.
- Do not add comments for self-explanatory code. Add comments only when the "why" is non-obvious.
- Files over 500 lines should be split. Large files consume excessive context.

## Hierarchical CLAUDE.md Architecture

CLAUDE.md files load top-down: root user level, then project level, then subfolder level. Only relevant files load -- a frontend task never loads the backend CLAUDE.md.

- Root `CLAUDE.md` — Project-wide rules, stack, global conventions (this file).
- Subfolder `CLAUDE.md` — Only when subfolder has distinct conventions (e.g., `frontend/CLAUDE.md` for UI rules, `backend/CLAUDE.md` for API rules).
- `.claude/rules/*.md` — Conditional instructions with `paths:` frontmatter. Only load when working with matching file paths.
- Keep each file focused. Prune after every model update -- remove what the model handles natively.
- Do NOT bloat CLAUDE.md with generic advice the model already knows.

## Subagent Usage

Always and aggressively offload to subagents: online research, doc fetching, log analysis, codebase exploration. This keeps the main context narrow.

- **Always include a "why"** in every subagent prompt. Not just what to find, but why you need it. "How auth works for rate limiting because we're improving rate limiting" beats "how auth works."
- **Parallel exploration:** When torn between approaches, spin up parallel Explore subagents for each, pass results back, let the main session decide.
- **Subagents are resumable.** You can resume a specific subagent to continue its research.

## Skill Frontmatter

Skills support these optional fields:

- `disable_model_invocation: true` — Prevents auto-loading; invoke manually with /skillname.
- `model: haiku|sonnet|opus` — Which model runs the skill. Step-by-step skills use haiku. Analysis skills use sonnet. Orchestration/planning skills use opus.
- `context: fork` — Run skill in isolated subagent context (prevents context contamination).
- `${CLAUDE_SKILL_DIR}` — Variable to reference the skill's own directory for relative file access.

## Fixed Infrastructure

All projects use this hosting stack (see `.claude/references/infrastructure.md`):
- **Cloudflare Pages** (frontend) + **Northflank** (backend containers, Postgres, Redis, cron)
- **Cloudflare R2** (object storage) + **Better Auth** (auth within API) + **Resend/SES** (email)

Plan-repo only recommends language, frameworks, UI library, ORM, and tooling. Infrastructure is locked.

## File Organization

- Keep the `.claude/` folder self-contained. No absolute paths, no references outside the repo except CLAUDE.md, agents.md, and README.md.
- Skills live in `.claude/skills/<skill-name>/SKILL.md`.
- Agents live in `.claude/agents/<agent-name>.md`.
- Source URLs for fetching best practices live in `.claude/references/source-urls.md`.
- Infrastructure definition lives in `.claude/references/infrastructure.md` (locked, do not modify per-project).
- CLI tools reference lives in `.claude/references/tools.md`.
- Design guardrails (UI projects) live in `.claude/references/design-guardrails.md`.
- Project settings go in `.claude/settings.json` (version-controlled). Personal overrides go in `.claude/settings.local.json` (git-ignored).

## Planning

- Planning is **phase-based**, not timeline-based. Phases: Foundation, Core, Polish, Ship.
- Always plan in one session, execute in another. Clear context between planning and implementation.
- Save every plan to a `/tasks` folder. This lets you selectively undo a feature later.
- For big features, use the **spec-developer** skill to generate a thorough plan.

## Context Management

- Keep this file under 150 lines for reliable adherence.
- Break tasks small enough to complete in under 50% context usage.
- Use `/compact` proactively around 50% context.
- Start fresh conversations for unrelated topics.
- Begin complex tasks in plan mode before implementation.
- **Code bias fix:** If stuck in bad patterns, build the feature in isolation in a fresh folder, then port it in.
- **Document failed attempts:** For stubborn bugs, have Claude write a document of all attempted fixes before starting a new session. New session loads the document, avoids repeating dead ends.
- **Handoff docs:** Use `/handoff` to create a summary before ending a session. Load in fresh session as sole context.

## Date Awareness

Best practices must reflect the current date. Always check the current date -- do not assume. When fetching best practices, verify versions and recommendations are current as of today.

## Available Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| plan-repo | "plan repo" | Research and recommend best tech stack, generate README, design guardrails |
| init-repo | "initialize repo" | Build or rebuild .claude/ folder with best practices |
| update-practices | "update practices" | Fetch latest best practices and update config |
| spec-developer | "spec developer" | Interview-driven feature spec saved to /tasks |
| code-review | "code review" | Full codebase review with severity levels |
| security-scan | "security scan" | OWASP-style security audit |
| performance-review | "performance review" | Performance analysis with fix recommendations |
| dependency-audit | "dependency audit" | Check dependencies for updates and vulnerabilities |
| test-scaffold | "scaffold tests" | Generate test files for untested modules |
| doc-sync | "sync docs" | Align documentation with current code |
| mermaid-diagram | "mermaid diagram" | Generate data flow / architecture diagrams |

## Available Agents

See `agents.md` in the repo root for the full agent registry. Key agents:

- **architect** -- phase-based planning, tech stack decisions, file structure design
- **reviewer** -- code review focused on correctness and maintainability
- **security** -- security-focused analysis and vulnerability detection
- **performance** -- performance-focused analysis and optimization
- **explorer** -- codebase exploration, research, and context gathering

## Workflow

1. Read existing code before proposing changes.
2. Prefer editing existing files over creating new ones.
3. Do not over-engineer. Only make changes that are directly requested or clearly necessary.
4. Use the source URL registry at `.claude/references/source-urls.md` when fetching best practices -- never hardcode URLs in skills.
5. Check `.claude/references/tools.md` for available CLI tools before running commands. Offer to install missing tools.
