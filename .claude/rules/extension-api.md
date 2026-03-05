---
paths:
  - "src/**/*.ts"
---

# VS Code Extension API Rules

## Disposables
Every event listener, file watcher, command registration, and status bar item MUST be added to `context.subscriptions` or disposed in `deactivate()`. Leaked disposables cause memory leaks across extension reloads.

## Notification API
- `showInformationMessage` for idle/stop notifications. Returns a Thenable that resolves to the clicked button.
- `showWarningMessage` for permission_prompt notifications (higher visual priority).
- Never use `showErrorMessage` for non-error notifications.

## Status Bar
- Create with `window.createStatusBarItem(StatusBarAlignment.Left, priority)`.
- Set `text`, `tooltip`, `command` properties. Use codicons: `$(bell)`, `$(comment-discussion)`.
- Call `.show()` / `.hide()` based on idle session count.

## File System
- Use `fs.watch` (not `fs.watchFile` polling) for the temp event directory.
- Use `fs.promises` for async file operations.
- Atomic writes in hook script: write to temp file, then `fs.renameSync`.

## Terminal API
- `window.terminals` lists all open terminals.
- `window.onDidOpenTerminal` / `window.onDidCloseTerminal` for lifecycle tracking.
- `terminal.show(preserveFocus?)` to focus a specific terminal.
- Match terminals by `terminal.name` or `terminal.creationOptions.cwd`.

## esbuild Configuration

- Entry point: `src/extension.ts`
- `bundle: true`, `format: 'cjs'`, `platform: 'node'`
- `outfile: 'dist/extension.js'`
- `external: ['vscode']` -- vscode module is provided at runtime, MUST be excluded
- Do NOT add `node-notifier` to external -- it has platform binaries that must ship with the extension
- `sourcemap` in dev, `minify` in production
- Type checking runs separately via `tsc --noEmit` (esbuild strips types without checking)

## Proposed APIs -- DO NOT USE
- `onDidWriteTerminalData` -- proposed, not available in published extensions
- Any API requiring `enabledApiProposals` in package.json
