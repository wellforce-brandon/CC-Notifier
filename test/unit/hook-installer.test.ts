import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("vscode", () => import("./__mocks__/vscode.js"));

const testHome = path.join(os.tmpdir(), "cc-notifier-test-home");
const settingsPath = path.join(testHome, ".claude", "settings.json");
const claudeDir = path.join(testHome, ".claude");

vi.mock("os", async (importOriginal) => {
	const actual = (await importOriginal()) as typeof os;
	return {
		...actual,
		homedir: () => testHome,
	};
});

import { checkHooksConfigured, installHooks } from "../../src/hook-installer.js";
import { createLogger } from "../../src/logger.js";

describe("hook-installer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createLogger({ subscriptions: [] } as any);
		try {
			fs.rmSync(claudeDir, { recursive: true, force: true });
		} catch {}
	});

	afterEach(() => {
		try {
			fs.rmSync(claudeDir, { recursive: true, force: true });
		} catch {}
	});

	it("detects when hooks are already configured", () => {
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(
			settingsPath,
			JSON.stringify({
				hooks: {
					Notification: [
						{
							matcher: "idle_prompt",
							hooks: [{ type: "command", command: "node hook-script.js idle" }],
						},
						{
							matcher: "permission_prompt",
							hooks: [{ type: "command", command: "node hook-script.js permission" }],
						},
					],
				},
			}),
		);

		expect(checkHooksConfigured()).toBe(true);
	});

	it("detects when hooks are missing", () => {
		expect(checkHooksConfigured()).toBe(false);
	});

	it("adds hooks to empty settings file", async () => {
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(settingsPath, "{}");

		const result = await installHooks("/ext/path");
		expect(result).toBe(true);

		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		expect(settings.hooks.Notification).toHaveLength(2);
		expect(settings.hooks.Notification[0].matcher).toBe("idle_prompt");
		expect(settings.hooks.Notification[1].matcher).toBe("permission_prompt");
	});

	it("adds hooks preserving existing settings", async () => {
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(settingsPath, JSON.stringify({ someOtherSetting: true }));

		const result = await installHooks("/ext/path");
		expect(result).toBe(true);

		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		expect(settings.someOtherSetting).toBe(true);
		expect(settings.hooks.Notification).toHaveLength(2);
	});

	it("adds hooks preserving existing hook entries", async () => {
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(
			settingsPath,
			JSON.stringify({
				hooks: {
					Notification: [
						{
							matcher: "auth_success",
							hooks: [{ type: "command", command: "echo auth" }],
						},
					],
				},
			}),
		);

		const result = await installHooks("/ext/path");
		expect(result).toBe(true);

		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		expect(settings.hooks.Notification).toHaveLength(3);
		expect(settings.hooks.Notification[0].matcher).toBe("auth_success");
	});

	it("handles missing ~/.claude/settings.json", async () => {
		const result = await installHooks("/ext/path");
		expect(result).toBe(true);

		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		expect(settings.hooks.Notification).toHaveLength(2);
	});

	it("handles malformed ~/.claude/settings.json", async () => {
		fs.mkdirSync(claudeDir, { recursive: true });
		fs.writeFileSync(settingsPath, "not valid json{{{");

		const result = await installHooks("/ext/path");
		expect(result).toBe(true);

		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		expect(settings.hooks.Notification).toHaveLength(2);
	});

	it("uses forward slashes in hook command path", async () => {
		const result = await installHooks("C:\\Users\\test\\.vscode\\extensions\\cc-notifier");
		expect(result).toBe(true);

		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		const cmd = settings.hooks.Notification[0].hooks[0].command;
		expect(cmd).not.toContain("\\");
		expect(cmd).toContain("hook/hook-script.js");
	});
});
