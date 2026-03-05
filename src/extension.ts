import * as vscode from "vscode";
import { createLogger, log, refreshVerbosity, showLog } from "./logger.js";
import { createTerminalManager } from "./terminal-manager.js";
import { createNotificationManager } from "./notifications.js";
import { startHookListener } from "./hook-listener.js";
import { checkHooksConfigured, installHooks } from "./hook-installer.js";

let notificationManager: ReturnType<typeof createNotificationManager> | undefined;
let terminalMgr: ReturnType<typeof createTerminalManager> | undefined;

export function activate(context: vscode.ExtensionContext): void {
	createLogger(context);
	log("CC-Notifier activating...");

	terminalMgr = createTerminalManager(context);
	notificationManager = createNotificationManager(terminalMgr, context.extensionPath);

	// URI handler: vscode://cc-notifier.cc-notifier/focus?session=X&cwd=Y
	context.subscriptions.push(
		vscode.window.registerUriHandler({
			handleUri(uri: vscode.Uri) {
				if (uri.path === "/focus") {
					const params = new URLSearchParams(uri.query);
					const sessionId = params.get("session") || "";
					const cwd = params.get("cwd") || "";
					log(`URI handler: focusing session ${sessionId}`);
					terminalMgr?.focusTerminal(sessionId, cwd);
					notificationManager?.clearSession(sessionId);
				}
			},
		}),
	);

	// Cancel all reminders when VS Code regains focus
	context.subscriptions.push(
		vscode.window.onDidChangeWindowState((state) => {
			if (state.focused) {
				log("Window focused — clearing all notification sessions");
				notificationManager?.clearAllSessions();
			}
		}),
	);

	const hookListener = startHookListener((event) => {
		notificationManager?.notify(event);
	});
	context.subscriptions.push(hookListener);

	context.subscriptions.push(
		vscode.commands.registerCommand("ccNotifier.configureHooks", async () => {
			const success = await installHooks(context.extensionPath);
			if (success) {
				vscode.window.showInformationMessage("CC-Notifier: Claude Code hooks configured successfully.");
			} else {
				vscode.window.showErrorMessage("CC-Notifier: Failed to configure hooks. Check the log for details.");
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ccNotifier.showLog", () => {
			showLog();
		}),
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("ccNotifier.verboseLogging")) {
				refreshVerbosity();
			}
		}),
	);

	// First-run hook check
	if (!checkHooksConfigured()) {
		vscode.window
			.showInformationMessage(
				"CC-Notifier: Claude Code hooks not configured. Set up now?",
				"Yes",
				"No",
			)
			.then((choice) => {
				if (choice === "Yes") {
					installHooks(context.extensionPath);
				}
			});
	}

	log("CC-Notifier activated");
}

export function deactivate(): void {
	notificationManager?.dispose();
}
