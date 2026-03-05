import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "./logger.js";

function getSettingsPath(): string {
	return path.join(os.homedir(), ".claude", "settings.json");
}

export function checkHooksConfigured(): boolean {
	const settingsPath = getSettingsPath();
	try {
		const content = fs.readFileSync(settingsPath, "utf-8");
		const settings = JSON.parse(content);
		const notifications = settings?.hooks?.Notification;
		if (!Array.isArray(notifications)) return false;

		let hasIdle = false;
		let hasPermission = false;
		for (const entry of notifications) {
			if (entry.matcher === "idle_prompt") hasIdle = true;
			if (entry.matcher === "permission_prompt") hasPermission = true;
		}
		return hasIdle && hasPermission;
	} catch {
		return false;
	}
}

export async function installHooks(extensionPath: string): Promise<boolean> {
	const settingsPath = getSettingsPath();
	const hookScriptPath = path
		.join(extensionPath, "hook", "hook-script.js")
		.replace(/\\/g, "/");

	try {
		// Ensure ~/.claude/ directory exists
		const claudeDir = path.dirname(settingsPath);
		fs.mkdirSync(claudeDir, { recursive: true });

		// Read existing settings or start fresh
		let settings: any = {};
		try {
			const content = fs.readFileSync(settingsPath, "utf-8");
			settings = JSON.parse(content);
		} catch {
			// File doesn't exist or is invalid -- start fresh
		}

		if (!settings.hooks) {
			settings.hooks = {};
		}
		if (!Array.isArray(settings.hooks.Notification)) {
			settings.hooks.Notification = [];
		}

		const notifications: any[] = settings.hooks.Notification;

		// Remove existing CC-Notifier entries (to handle path updates)
		settings.hooks.Notification = notifications.filter(
			(entry: any) =>
				!(
					entry.matcher === "idle_prompt" &&
					Array.isArray(entry.hooks) &&
					entry.hooks.some((h: any) =>
						h.command?.includes("hook-script.js"),
					)
				) &&
				!(
					entry.matcher === "permission_prompt" &&
					Array.isArray(entry.hooks) &&
					entry.hooks.some((h: any) =>
						h.command?.includes("hook-script.js"),
					)
				),
		);

		// Add new entries
		settings.hooks.Notification.push({
			matcher: "idle_prompt",
			hooks: [
				{
					type: "command",
					command: `node "${hookScriptPath}" idle`,
				},
			],
		});

		settings.hooks.Notification.push({
			matcher: "permission_prompt",
			hooks: [
				{
					type: "command",
					command: `node "${hookScriptPath}" permission`,
				},
			],
		});

		fs.writeFileSync(
			settingsPath,
			JSON.stringify(settings, null, 2),
			"utf-8",
		);
		log("Claude Code hooks configured successfully");
		return true;
	} catch (err) {
		log(`Failed to install hooks: ${err}`);
		return false;
	}
}
