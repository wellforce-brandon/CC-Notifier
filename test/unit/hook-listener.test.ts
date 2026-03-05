import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("vscode", () => import("./__mocks__/vscode.js"));

import { startHookListener, type HookEvent } from "../../src/hook-listener.js";
import { createLogger } from "../../src/logger.js";

const TEMP_DIR = path.join(os.tmpdir(), "cc-notifier");

function writeEventFile(event: Partial<HookEvent> & { session_id: string }): string {
	const full = {
		event: "idle_prompt",
		timestamp: Date.now(),
		cwd: "/test/project",
		...event,
	};
	const filename = `${full.session_id}-${full.timestamp}.json`;
	const filePath = path.join(TEMP_DIR, filename);
	fs.writeFileSync(filePath, JSON.stringify(full), "utf-8");
	return filePath;
}

describe("hook-listener", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Create a fresh temp dir
		fs.mkdirSync(TEMP_DIR, { recursive: true });
		// Clean any existing files
		for (const f of fs.readdirSync(TEMP_DIR)) {
			fs.unlinkSync(path.join(TEMP_DIR, f));
		}
		// Initialize logger with mock context
		createLogger({ subscriptions: [] } as any);
	});

	afterEach(() => {
		// Clean up
		try {
			for (const f of fs.readdirSync(TEMP_DIR)) {
				fs.unlinkSync(path.join(TEMP_DIR, f));
			}
		} catch {}
	});

	it("parses valid idle_prompt event file on startup", () => {
		const events: HookEvent[] = [];
		writeEventFile({ session_id: "test1", event: "idle_prompt" as any });

		const disposable = startHookListener((e) => events.push(e));
		disposable.dispose();

		expect(events).toHaveLength(1);
		expect(events[0].event).toBe("idle_prompt");
		expect(events[0].session_id).toBe("test1");
	});

	it("parses valid permission_prompt event file on startup", () => {
		const events: HookEvent[] = [];
		writeEventFile({ session_id: "test2", event: "permission_prompt" as any });

		const disposable = startHookListener((e) => events.push(e));
		disposable.dispose();

		expect(events).toHaveLength(1);
		expect(events[0].event).toBe("permission_prompt");
	});

	it("rejects event file missing session_id", () => {
		const events: HookEvent[] = [];
		const filePath = path.join(TEMP_DIR, "bad-missing-sid.json");
		fs.writeFileSync(filePath, JSON.stringify({ event: "idle_prompt", timestamp: Date.now() }));

		const disposable = startHookListener((e) => events.push(e));
		disposable.dispose();

		expect(events).toHaveLength(0);
	});

	it("rejects event file with invalid JSON", () => {
		const events: HookEvent[] = [];
		const filePath = path.join(TEMP_DIR, "bad-json.json");
		fs.writeFileSync(filePath, "not json{{{");

		const disposable = startHookListener((e) => events.push(e));
		disposable.dispose();

		expect(events).toHaveLength(0);
	});

	it("skips event files older than 5 minutes on startup", () => {
		const events: HookEvent[] = [];
		const oldTimestamp = Date.now() - 6 * 60 * 1000;
		const filePath = path.join(TEMP_DIR, `old-session-${oldTimestamp}.json`);
		fs.writeFileSync(
			filePath,
			JSON.stringify({
				event: "idle_prompt",
				session_id: "old-session",
				timestamp: oldTimestamp,
				cwd: "/test",
			}),
		);

		const disposable = startHookListener((e) => events.push(e));
		disposable.dispose();

		expect(events).toHaveLength(0);
	});

	it("processes event files newer than 5 minutes on startup", () => {
		const events: HookEvent[] = [];
		const recentTimestamp = Date.now() - 2 * 60 * 1000;
		const filePath = path.join(TEMP_DIR, `recent-${recentTimestamp}.json`);
		fs.writeFileSync(
			filePath,
			JSON.stringify({
				event: "idle_prompt",
				session_id: "recent",
				timestamp: recentTimestamp,
				cwd: "/test",
			}),
		);

		const disposable = startHookListener((e) => events.push(e));
		disposable.dispose();

		expect(events).toHaveLength(1);
		expect(events[0].session_id).toBe("recent");
	});

	it("picks up new event files via fs.watch", async () => {
		const events: HookEvent[] = [];
		const disposable = startHookListener((e) => events.push(e));

		// Write a new event file after the listener is started
		await new Promise((resolve) => setTimeout(resolve, 100));
		writeEventFile({ session_id: "watch-test" });

		// Wait for the watch + delay
		await new Promise((resolve) => setTimeout(resolve, 200));
		disposable.dispose();

		expect(events).toHaveLength(1);
		expect(events[0].session_id).toBe("watch-test");
	});
});
