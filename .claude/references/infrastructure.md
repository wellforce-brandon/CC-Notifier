# Infrastructure -- CC-Notifier

This is a VS Code extension. There is no backend, no database, no hosting infrastructure.

## Runtime Environment

- **Extension host:** VS Code's Node.js extension host process
- **Hook script:** Invoked by Claude Code CLI as a standalone Node.js process
- **IPC:** File-based (JSON files in OS temp directory)

## Distribution

- **Development:** F5 in VS Code launches Extension Development Host
- **Packaging:** `npx vsce package` creates a `.vsix` file
- **Installation:** `code --install-extension cc-notifier-x.y.z.vsix`
- **Optional:** VS Code Marketplace via `npx vsce publish`

## External Dependencies

- **Claude Code CLI:** Must be installed and configured with hooks pointing to the hook script
- **Windows 10/11:** Required for native toast notifications via node-notifier
