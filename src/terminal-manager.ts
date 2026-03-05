import * as path from "path";
import * as vscode from "vscode";
import { logVerbose } from "./logger.js";

export interface TerminalManager {
	findTerminal(sessionId: string, cwd: string): vscode.Terminal | undefined;
	focusTerminal(sessionId: string, cwd: string): boolean;
}

function normalizePath(p: string): string {
	return p.replace(/\\/g, "/").toLowerCase();
}

export function createTerminalManager(
	context: vscode.ExtensionContext,
): TerminalManager {
	const terminals = new Set<vscode.Terminal>();

	for (const t of vscode.window.terminals) {
		terminals.add(t);
	}

	context.subscriptions.push(
		vscode.window.onDidOpenTerminal((t) => {
			terminals.add(t);
		}),
	);

	context.subscriptions.push(
		vscode.window.onDidCloseTerminal((t) => {
			terminals.delete(t);
		}),
	);

	function findTerminal(
		_sessionId: string,
		cwd: string,
	): vscode.Terminal | undefined {
		const normalizedCwd = normalizePath(cwd);
		const folderName = path.basename(cwd).toLowerCase();

		// Priority 1: Match by creationOptions.cwd
		for (const t of terminals) {
			const opts = t.creationOptions as vscode.TerminalOptions;
			if (opts?.cwd) {
				const termCwd =
					typeof opts.cwd === "string" ? opts.cwd : opts.cwd.fsPath;
				if (normalizePath(termCwd) === normalizedCwd) {
					return t;
				}
			}
		}

		// Priority 2: Match by terminal name containing folder name
		for (const t of terminals) {
			if (t.name.toLowerCase().includes(folderName)) {
				return t;
			}
		}

		// Priority 3: Fallback to most recently added terminal
		const arr = [...terminals];
		return arr.length > 0 ? arr[arr.length - 1] : undefined;
	}

	function focusTerminal(sessionId: string, cwd: string): boolean {
		const terminal = findTerminal(sessionId, cwd);
		if (terminal) {
			logVerbose(`Focusing terminal: ${terminal.name}`);
			terminal.show(false);
			return true;
		}
		logVerbose("No matching terminal found");
		return false;
	}

	return { findTerminal, focusTerminal };
}
