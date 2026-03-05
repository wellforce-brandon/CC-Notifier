import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | undefined;
let verbose = true;

export function createLogger(context: vscode.ExtensionContext): void {
	outputChannel = vscode.window.createOutputChannel("CC-Notifier");
	context.subscriptions.push(outputChannel);
	verbose = vscode.workspace.getConfiguration("ccNotifier").get("verboseLogging", true);
}

export function log(message: string): void {
	outputChannel?.appendLine(`[${new Date().toISOString()}] ${message}`);
}

export function logVerbose(message: string): void {
	if (verbose) {
		log(message);
	}
}

export function showLog(): void {
	outputChannel?.show();
}

export function refreshVerbosity(): void {
	verbose = vscode.workspace.getConfiguration("ccNotifier").get("verboseLogging", true);
}
