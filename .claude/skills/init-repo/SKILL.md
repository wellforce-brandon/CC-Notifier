---
name: init-repo
description: Build or rebuild the .claude/ folder with best practices. Use when setting up Claude Code in a new or existing repository. Run plan-repo first for new projects.
user-invocable: true
argument-hint: (no arguments needed)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebFetch
  - WebSearch
  - Agent
---

# Initialize Repository for Claude Code

You have been asked to initialize or upgrade this repository's Claude Code configuration. Follow these steps exactly.

## Important: Date Awareness

Before fetching any best practices, check the current date. All recommendations must reflect best practices as of today's date -- not cached knowledge. Use WebSearch to verify current versions.

## Step 1: Read Plan (if exists)

1. Check if `tasks/plan-repo.md` exists. If it does, read it and use it as the basis for all decisions below. The plan contains the chosen stack, file structure, design guardrails, and tools.
2. If no plan exists, that is fine -- proceed with auto-detection.

## Step 2: Read Current State

1. Read `CLAUDE.md` in the repo root (if it exists). Note its contents.
2. Read `agents.md` in the repo root (if it exists). Note its contents.
3. Read `README.md` in the repo root (if it exists). Identify the project's tech stack, purpose, and conventions.
4. Scan the `.claude/` folder (if it exists) using Glob. List all existing files.
5. Read `.claude/settings.json` (if it exists). Note current settings.

## Step 3: Fetch Best Practices

1. Read the source URL registry at `.claude/references/source-urls.md`.
2. Spin up parallel Explore subagents to fetch and analyze sources:
   - **Subagent 1:** "Fetch official Anthropic sources and extract current Claude Code version, features, and recommended patterns. WHY: We need the latest official conventions to generate an up-to-date config."
   - **Subagent 2:** "Fetch community sources and extract practical tips, skill patterns, and agent patterns. WHY: Community sources have battle-tested patterns not in official docs."
3. For URLs that fail to fetch, log the failure and continue. Do not halt.

## Step 4: Detect Stack and Generate Design Guardrails

1. Identify the tech stack from dependency manifests, file types, and the plan (if available).
2. Use WebSearch to find current best practices (as of today's date) for the detected stack:
   - Coding conventions and naming patterns
   - Project structure conventions
   - UI/design patterns (if the project has a frontend)
   - Testing patterns
3. If the project has a UI, generate `.claude/references/design-guardrails.md` with stack-specific UI/design SLA guidelines. Include:
   - Component size limits and composition patterns
   - Styling conventions for the chosen approach
   - Accessibility requirements (WCAG level, required ARIA patterns)
   - Performance budgets (bundle size, image optimization, lazy loading)

## Step 5: Analyze Gaps

Compare the current `.claude/` folder against the best practices you fetched. Identify:

- Missing configuration files (settings.json, agents, skills)
- Outdated patterns or deprecated features in use
- Skills that should exist but do not
- Agent definitions that are missing or incomplete
- Settings that should be updated
- Missing tools.md entries for detected stack tools

## Step 6: Build or Update

For each gap identified, create or update the file. Follow these rules:

- **Non-destructive:** Never overwrite custom project-specific settings. Merge with existing config.
- **Skills:** Ensure all template skills exist in `.claude/skills/`. If additional skills are relevant to the detected tech stack, add them.
- **Agents:** Ensure all template agents exist in `.claude/agents/`. Add others if relevant.
- **Settings:** Update `.claude/settings.json` with recommended permissions and hooks. Preserve existing custom entries.
- **Tools reference:** Update `.claude/references/tools.md` with stack-specific CLI tools, install commands, and usage patterns. **Important:** There is no local Docker, no local Postgres, no local Redis -- all infrastructure runs remotely on Northflank and Cloudflare. Do not add local infrastructure tools (docker, docker-compose, psql, redis-cli). Preserve the existing **Available MCP Servers** section that documents all MCP integrations available to Claude Code.
- **CLAUDE.md:** Build a hierarchical CLAUDE.md structure:
  - Update root `CLAUDE.md` with project-specific stack info, conventions, and skill/agent inventory.
  - Plan (but do not create) subfolder CLAUDE.md files where distinct rules will apply.
  - Keep each CLAUDE.md file focused and under 150 lines.
- **agents.md:** Update the root agents.md to register all agents. Preserve project-specific content.
- **README.md:** If a README exists, add or update the "Claude Code" section. Do not alter other sections.

## Step 7: Add Skill Frontmatter Optimizations

For each skill, consider adding:
- `disable_model_invocation: true` for skills that should only be manually invoked
- `model: haiku` for well-defined step-by-step skills that do not require heavy reasoning
- `model: sonnet` for analysis and research skills
- `model: opus` for orchestration and planning skills

## Step 8: Create instructions.md

Create or update `instructions.md` in the repo root with:

- What the `.claude/` folder contains
- How to use each skill (trigger phrase and description)
- Hierarchical CLAUDE.md architecture explanation
- Subagent usage best practices
- Phase-based planning workflow
- Context management tips
- How to customize the setup for this specific project
- How to add new skills or agents

## Step 9: Report

Print a summary listing:

- Files created (with paths)
- Files updated (with what changed)
- Skills available (with model assignments)
- Agents registered
- Hierarchical CLAUDE.md plan
- Tools detected and added to tools.md
- Design guardrails generated (if applicable)
- Any warnings or issues encountered

## Non-Destructive Merge Rules

When merging with existing configuration:

1. For JSON files: deep-merge objects. Existing keys are preserved unless the new value is strictly better.
2. For markdown files: append new sections. Do not remove existing sections.
3. For skills: if a skill already exists with custom content, do not overwrite. Only update if the existing skill references deprecated features.
4. For agents: same rule as skills.
