# CLI Tools Reference

Claude Code reads this file to know which CLI tools are available and how to use them. When a command fails because a tool is missing, check this file for the install command and offer to install it.

## How This File Works

- **init-repo** and **plan-repo** populate this file based on the detected/chosen stack.
- Each tool entry includes: install command, version check, and common usage.
- Claude Code should check `<tool> --version` before assuming a tool is available.
- If a tool is missing and needed, ask the user before installing.

## Important: No Backend Infrastructure

This is a VS Code extension project. There is no backend, no database, no hosting. All tools are local development tools.

## Core Tools

### Node.js / npm
- **Check:** `node --version && npm --version`
- **Install:** https://nodejs.org or `nvm install --lts`
- **Min version:** Node 18.x, npm 9.x
- **Usage:** `npm install`, `npm run <script>`, `npx <command>`

### Git
- **Check:** `git --version`
- **Usage:** Version control. Always available.

### TypeScript
- **Check:** `npx tsc --version`
- **Install:** `npm i -D typescript`
- **Usage:** `npx tsc --noEmit` (type checking only -- esbuild handles compilation)

## Build Tools

### esbuild
- **Check:** `npx esbuild --version`
- **Install:** `npm i -D esbuild`
- **Usage:**
  - `npm run build` -- production bundle
  - `npm run watch` -- watch mode for development
  - Config in `esbuild.mjs`

## Linter & Formatter

### Biome
- **Check:** `npx biome --version`
- **Install:** `npm i -D @biomejs/biome`
- **Usage:**
  - `npx biome check .` -- lint + format check
  - `npx biome check --write .` -- auto-fix
  - `npx biome format --write .` -- format only

## Test Tools

### Vitest (unit tests)
- **Check:** `npx vitest --version`
- **Install:** `npm i -D vitest`
- **Usage:**
  - `npx vitest` -- run in watch mode
  - `npx vitest run` -- single run
  - `npx vitest run --coverage` -- with coverage

### @vscode/test-electron (integration tests)
- **Check:** Listed in package.json devDependencies
- **Install:** `npm i -D @vscode/test-electron`
- **Usage:** `npm run test:integration` -- runs tests in a real VS Code instance

## Packaging

### vsce (VS Code Extension Manager)
- **Check:** `npx vsce --version`
- **Install:** `npm i -D @vscode/vsce`
- **Usage:**
  - `npx vsce package` -- create .vsix file
  - `npx vsce publish` -- publish to Marketplace (requires PAT)

## VS Code Extension Development

### yo generator-code (scaffolding only)
- **Check:** `npx yo --version`
- **Install:** `npm i -g yo generator-code`
- **Usage:** `yo code` -- scaffold a new extension (one-time use)
- **Note:** Only needed for initial scaffolding. Not needed after project is set up.

### Extension Development Host
- **Usage:** Press F5 in VS Code to launch a new VS Code window with the extension loaded
- **Debug:** Set breakpoints in TypeScript source, they work in the Extension Development Host
- **Reload:** Ctrl+Shift+F5 to reload the extension after changes

## Available MCP Servers

Claude Code has access to the following MCP (Model Context Protocol) servers. These provide direct integration with external services without needing CLI tools.

### Cloudflare MCPs

| MCP Server | Purpose |
|------------|---------|
| **cloudflare-observability** | Query Worker logs, inspect structured log payloads, list Workers |
| **cloudflare-workers-builds** | View and debug Workers Builds CI/CD (list builds, get build logs) |
| **cloudflare-workers-bindings** | Manage KV, R2, D1, Hyperdrive bindings; read Worker code |
| **cloudflare-containers** | Sandboxed Ubuntu container for running commands, reading/writing files |
| **cloudflare-radar** | Global internet insights: traffic, attacks, rankings, BGP, URL scanning |
| **cloudflare-docs** | Search Cloudflare documentation, Pages-to-Workers migration guides |
| **cloudflare-api** | Execute and search raw Cloudflare API endpoints |
| **cloudflare-graphql** | Query Cloudflare's GraphQL analytics API, explore schema |
| **cloudflare-dns-analytics** | DNS analytics reports, zone and account DNS settings |
| **cloudflare-audit-logs** | Query account audit logs |
| **cloudflare-logpush** | Manage Logpush jobs by account |
| **cloudflare-browser** | Fetch URL content as HTML, Markdown, or screenshot |
| **cloudflare-ai-gateway** | Inspect AI Gateway logs (request/response bodies) |
| **cloudflare-ai-search** | Search using Cloudflare AI Search / RAG |
| **cloudflare-casb** | Query CASB integrations, assets, and categories |
| **cloudflare-dex** | Digital Experience monitoring: fleet status, HTTP/traceroute tests, WARP diagnostics |
| **cloudflare-agents-sdk-docs** | Search Cloudflare Agents SDK documentation |

### GitHub MCP

| MCP Server | Purpose |
|------------|---------|
| **github** | Full GitHub integration: repos, issues, PRs, branches, commits, code search, releases, reviews |

### Communication & Productivity MCPs

| MCP Server | Purpose |
|------------|---------|
| **claude_ai_Slack** | Read/search channels, send messages, create canvases, search users |
| **claude_ai_Gmail** | Search/read emails, create drafts, get profile |
| **claude_ai_Google_Calendar** | List/create/update events, find free time, RSVP |
| **claude_ai_Notion** | Search/create/update pages and databases, query views, manage comments |

### Notion MCP (Direct)

| MCP Server | Purpose |
|------------|---------|
| **notion** | Direct Notion API: search, create/update pages, query databases, manage comments |

### Infrastructure MCPs

| MCP Server | Purpose |
|------------|---------|
| **northflank** | Full Northflank management: projects, services, addons (Postgres, Redis), jobs, secrets, volumes, domains, templates, builds, metrics |
| **railway** | Railway platform: projects, services, deployments, variables, logs, domains |
| **doppler** | Secrets management: projects, configs, secrets, environments, integrations, service accounts |

### Browser Automation MCP

| MCP Server | Purpose |
|------------|---------|
| **claude-in-chrome** | Chrome browser automation: navigate, click, type, read pages, take screenshots, record GIFs, execute JS |

### IT Management MCPs

| MCP Server | Purpose |
|------------|---------|
| **ninjaone** | RMM/endpoint management: devices, organizations, tickets, patches, scripts, alerts |
| **zendesk** | Help desk: tickets, users, organizations, triggers, automations, macros, views |
