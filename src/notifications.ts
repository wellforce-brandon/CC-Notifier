import { execFile } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { getConfig } from "./config.js";
import type { HookEvent } from "./hook-listener.js";
import { log, logVerbose } from "./logger.js";
import type { TerminalManager } from "./terminal-manager.js";

interface SessionState {
	notifiedAt: number;
	remindersSent: number;
	reminderTimers: ReturnType<typeof setTimeout>[];
}

const DEBOUNCE_MS = 30_000;

export interface NotificationManager {
	notify(event: HookEvent): void;
	clearSession(sessionId: string): void;
	clearAllSessions(): void;
	dispose(): void;
}

export function createNotificationManager(
	terminalManager: TerminalManager,
	extensionPath?: string,
): NotificationManager {
	const sessions = new Map<string, SessionState>();
	const toastScript = extensionPath
		? path.join(extensionPath, "hook", "toast.ps1")
		: "";


	function getFolderName(cwd: string): string {
		return path.basename(cwd) || "Unknown";
	}

	function formatEventType(event: HookEvent): string {
		return event.event === "permission_prompt" ? "Permission Needed" : "Idle";
	}

	function formatTimestamp(): string {
		return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}

	function buildToastMessage(event: HookEvent, suffix: string): string {
		const eventType = formatEventType(event);
		const time = formatTimestamp();
		const lines = [`[${eventType}] ${time}`];
		lines.push(event.cwd);
		if (event.message) {
			lines.push(event.message);
		}
		if (suffix) {
			lines.push(suffix.trim());
		}
		return lines.join("\n");
	}

	function buildFocusUri(event: HookEvent): string {
		const session = encodeURIComponent(event.session_id);
		const cwd = encodeURIComponent(event.cwd);
		return `vscode://cc-notifier.cc-notifier/focus?session=${session}&cwd=${cwd}`;
	}

	function fireToast(
		title: string,
		message: string,
		sound: boolean,
		event: HookEvent,
	): void {
		if (!toastScript) return;
		try {
			const uri = buildFocusUri(event);
			execFile(
				"powershell",
				[
					"-NoProfile",
					"-ExecutionPolicy",
					"Bypass",
					"-File",
					toastScript,
					"-Uri",
					uri,
					"-Title",
					title,
					"-Body",
					message,
					"-Sound",
					sound ? "true" : "false",
				],
				{ timeout: 10_000 },
				(err) => {
					if (err) {
						logVerbose(`Toast script error: ${err}`);
					}
				},
			);
		} catch (err) {
			log(`Toast notification failed: ${err}`);
		}
	}

	function fireInApp(
		event: HookEvent,
		folderName: string,
		suffix: string,
	): void {
		const msgText =
			event.event === "permission_prompt"
				? `Claude needs permission in ${folderName}${suffix}`
				: `Claude is waiting in ${folderName}${suffix}`;

		const showFn =
			event.event === "permission_prompt"
				? vscode.window.showWarningMessage
				: vscode.window.showInformationMessage;

		showFn(msgText, "Open Terminal").then((action) => {
			if (action === "Open Terminal") {
				terminalManager.focusTerminal(event.session_id, event.cwd);
			}
		});
	}

	function scheduleReminders(event: HookEvent): void {
		const config = getConfig();
		const state = sessions.get(event.session_id);
		if (!state) return;

		const folderName = getFolderName(event.cwd);

		for (let i = 0; i < config.reminderIntervals.length; i++) {
			const delay = config.reminderIntervals[i];
			const reminderIndex = i;
			const timer = setTimeout(() => {
				const currentState = sessions.get(event.session_id);
				if (!currentState) return;

				const suffix =
					reminderIndex === 0 ? " (Reminder)" : " (Final Reminder)";
				currentState.remindersSent = reminderIndex + 1;

				logVerbose(
					`Reminder ${reminderIndex + 1} for session ${event.session_id}`,
				);

				const refreshedConfig = getConfig();
				const focused = vscode.window.state.focused;
				if (refreshedConfig.enableToast && !focused) {
					fireToast(
						`Claude Code -- ${folderName}`,
						buildToastMessage(event, suffix),
						refreshedConfig.enableSound,
						event,
					);
				}
				if (refreshedConfig.enableInApp) {
					fireInApp(event, folderName, suffix);
				}
			}, delay);
			state.reminderTimers.push(timer);
		}
	}

	function notify(event: HookEvent): void {
		const config = getConfig();

		if (event.event === "idle_prompt" && !config.notifyOnIdle) return;
		if (event.event === "permission_prompt" && !config.notifyOnPermission)
			return;

		const now = Date.now();
		const existing = sessions.get(event.session_id);
		if (existing && now - existing.notifiedAt < DEBOUNCE_MS) {
			logVerbose(
				`Debounced notification for session ${event.session_id}`,
			);
			return;
		}

		// Clear any previous reminders for this session
		if (existing) {
			for (const timer of existing.reminderTimers) {
				clearTimeout(timer);
			}
		}

		const folderName = getFolderName(event.cwd);
		const windowFocused = vscode.window.state.focused;
		logVerbose(
			`Notifying: ${event.event} for ${folderName} (session ${event.session_id}, focused=${windowFocused})`,
		);

		if (config.enableToast && !windowFocused) {
			fireToast(
				`Claude Code -- ${folderName}`,
				buildToastMessage(event, ""),
				config.enableSound,
				event,
			);
		}

		if (config.enableInApp) {
			fireInApp(event, folderName, "");
		}

		const state: SessionState = {
			notifiedAt: now,
			remindersSent: 0,
			reminderTimers: [],
		};
		sessions.set(event.session_id, state);

		scheduleReminders(event);
	}

	function clearSession(sessionId: string): void {
		const state = sessions.get(sessionId);
		if (state) {
			for (const timer of state.reminderTimers) {
				clearTimeout(timer);
			}
			sessions.delete(sessionId);
			logVerbose(`Cleared session ${sessionId}`);
		}
	}

	function clearAllSessions(): void {
		for (const [sessionId] of sessions) {
			clearSession(sessionId);
		}
	}

	function dispose(): void {
		for (const [, state] of sessions) {
			for (const timer of state.reminderTimers) {
				clearTimeout(timer);
			}
		}
		sessions.clear();
	}

	return { notify, clearSession, clearAllSessions, dispose };
}
