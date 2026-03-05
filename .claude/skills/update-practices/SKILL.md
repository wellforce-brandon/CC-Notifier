---
name: update-practices
description: Fetch latest Claude Code best practices and update the .claude/ folder configuration. Safe to run repeatedly.
user-invocable: true
argument-hint: (no arguments needed)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - WebSearch
  - Agent
---

# Update Best Practices

You have been asked to update this repository's Claude Code configuration to the latest best practices. Follow these steps exactly.

## Important: Date Awareness

Check the current date FIRST. All best practices must be verified as current as of today's date. Do not rely on cached knowledge -- use WebSearch to confirm that recommended versions, tools, and patterns are still current.

## Step 1: Read Current Configuration

1. Read `.claude/references/source-urls.md` to get the list of URLs to fetch.
2. Read `CLAUDE.md` in the repo root. Note its contents and version references.
3. Read `agents.md` in the repo root. Note registered agents.
4. Scan `.claude/skills/` using Glob. List all existing skills.
5. Scan `.claude/agents/` using Glob. List all existing agents.
6. Read `.claude/settings.json`. Note current settings.
7. Read `.claude/references/tools.md` (if it exists). Note current tools.
8. Read `.claude/references/design-guardrails.md` (if it exists). Note current guardrails.

## Step 2: Fetch Latest Practices

Spin up parallel Explore subagents to fetch and analyze sources:

1. **Official sources subagent:** "Fetch all official Anthropic sources from the source URL registry. Extract: current Claude Code version, new features, deprecated features, new recommended settings/skills/agents/hooks, folder structure changes. WHY: We need to know what changed officially to update the config accurately."

2. **Community sources subagent:** "Fetch all community sources from the source URL registry. Extract: new practical patterns, updated skill examples, agent configurations, workflow improvements. WHY: Community sources capture battle-tested patterns ahead of official docs."

3. **Stack freshness subagent:** "Check the project's detected stack (from CLAUDE.md or dependency manifests) against current versions and best practices as of today's date. WHY: We need to ensure tools.md and design guardrails reflect the latest stable versions."

Wait for all subagents, then proceed.

## Step 3: Compare and Identify Changes

Categorize findings as:

- **NEW:** Features or patterns not yet reflected in the current config.
- **UPDATED:** Patterns that exist but need modification to match current best practices.
- **DEPRECATED:** Patterns in use that are no longer recommended.
- **CURRENT:** Patterns that already match best practices (no action needed).

## Step 4: Implement Changes

For each NEW or UPDATED item:

1. Determine which file(s) need to change.
2. Make the change. Follow the non-destructive merge rules:
   - Never remove custom project-specific content.
   - Append new sections rather than replacing existing ones.
   - For JSON files, deep-merge -- preserve existing keys.
3. For DEPRECATED items: update the pattern to the recommended alternative.

Ensure these skills still exist and are current:
- plan-repo, init-repo, update-practices
- spec-developer, code-review, security-scan
- performance-review, dependency-audit, test-scaffold
- doc-sync, mermaid-diagram

Ensure these agents still exist and are current:
- architect, reviewer, security, performance, explorer

Update `.claude/references/tools.md` if any tools have new versions or new tools should be added.

Update `.claude/references/design-guardrails.md` if UI best practices have changed.

Review skill frontmatter and update `model` and `disable_model_invocation` fields if recommendations have changed.

## Step 5: Prune CLAUDE.md Files

Review all CLAUDE.md files in the hierarchy. Remove:
- Advice the model now handles natively (check against current model capabilities)
- Outdated version references
- Redundant rules that duplicate parent CLAUDE.md content

Keep each CLAUDE.md focused and under 150 lines.

## Step 6: Update Documentation

1. Update `CLAUDE.md` if skill or agent inventory changed.
2. Update `agents.md` if agent inventory changed.
3. Update `instructions.md` if usage patterns changed.

## Step 7: Report

Print a diff-style summary:

```
CHANGES APPLIED:
  [NEW] Added skill: <name> -- <reason>
  [UPDATED] Modified .claude/settings.json -- <what changed>
  [DEPRECATED] Replaced <old pattern> with <new pattern> in <file>
  [CURRENT] No changes needed for: <list>
  [PRUNED] Removed from <file>: <what was removed and why>

CLAUDE CODE VERSION: <version found>
CURRENT DATE: <today's date>
SOURCES CHECKED: <count> of <total> fetched successfully
```

## Idempotency

Running this skill twice in a row must produce no changes the second time. Every change must be conditional -- only apply if the current state differs from the target state.
