import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("vscode", () => import("./__mocks__/vscode.js"));
vi.mock("child_process", () => ({
	execFile: vi.fn((_cmd: any, _args: any, _opts: any, cb: any) => cb?.(null)),
}));

import { execFile } from "child_process";
import { window, workspace } from "vscode";
import { createNotificationManager } from "../../src/notifications.js";
import type { HookEvent } from "../../src/hook-listener.js";
import type { TerminalManager } from "../../src/terminal-manager.js";
import { createLogger } from "../../src/logger.js";

function makeEvent(overrides: Partial<HookEvent> = {}): HookEvent {
	return {
		event: "idle_prompt",
		session_id: "sess1",
		timestamp: Date.now(),
		cwd: "/c/Github/MyProject",
		...overrides,
	};
}

function makeMockTerminalManager(): TerminalManager {
	return {
		findTerminal: vi.fn(() => undefined),
		focusTerminal: vi.fn(() => true),
	};
}

describe("notifications", () => {
	let tm: TerminalManager;

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.useFakeTimers();
		tm = makeMockTerminalManager();
		createLogger({ subscriptions: [] } as any);
		// Restore default config mock (restoreAllMocks clears implementations)
		vi.mocked(workspace.getConfiguration).mockReturnValue({
			get: vi.fn((_key: string, defaultValue: any) => defaultValue),
		} as any);
		vi.mocked(window.showInformationMessage).mockResolvedValue(undefined);
		vi.mocked(window.showWarningMessage).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("fires in-app notification for idle_prompt", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		expect(window.showInformationMessage).toHaveBeenCalledWith(
			"Claude is waiting in MyProject",
			"Open Terminal",
		);
		nm.dispose();
	});

	it("uses showWarningMessage for permission_prompt events", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent({ event: "permission_prompt" }));

		expect(window.showWarningMessage).toHaveBeenCalledWith(
			"Claude needs permission in MyProject",
			"Open Terminal",
		);
		nm.dispose();
	});

	it("skips notification when notifyOnIdle is false", () => {
		vi.mocked(workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, def: any) => {
				if (key === "notifyOnIdle") return false;
				return def;
			}),
		} as any);

		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		expect(window.showInformationMessage).not.toHaveBeenCalled();
		nm.dispose();
	});

	it("skips notification when notifyOnPermission is false", () => {
		vi.mocked(workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, def: any) => {
				if (key === "notifyOnPermission") return false;
				return def;
			}),
		} as any);

		const nm = createNotificationManager(tm);
		nm.notify(makeEvent({ event: "permission_prompt" }));

		expect(window.showWarningMessage).not.toHaveBeenCalled();
		nm.dispose();
	});

	it("fires only in-app when enableToast is false", () => {
		vi.mocked(workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, def: any) => {
				if (key === "enableToast") return false;
				return def;
			}),
		} as any);

		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		expect(window.showInformationMessage).toHaveBeenCalled();
		nm.dispose();
	});

	it("fires only toast when enableInApp is false", () => {
		vi.mocked(workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, def: any) => {
				if (key === "enableInApp") return false;
				return def;
			}),
		} as any);

		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		expect(window.showInformationMessage).not.toHaveBeenCalled();
		nm.dispose();
	});

	it("debounces: second notification within 30s for same session is suppressed", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());
		nm.notify(makeEvent());

		expect(window.showInformationMessage).toHaveBeenCalledTimes(1);
		nm.dispose();
	});

	it("allows notification after 30s debounce window passes", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		vi.advanceTimersByTime(31_000);
		nm.notify(makeEvent());

		expect(window.showInformationMessage).toHaveBeenCalledTimes(2);
		nm.dispose();
	});

	it("schedules 5-minute reminder timer after initial notification", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		vi.advanceTimersByTime(300_000);

		// Initial + reminder
		expect(window.showInformationMessage).toHaveBeenCalledTimes(2);
		expect(vi.mocked(window.showInformationMessage).mock.calls[1][0]).toContain(
			"(Reminder)",
		);
		nm.dispose();
	});

	it("schedules 15-minute reminder timer after initial notification", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		vi.advanceTimersByTime(900_000);

		// Initial + 5min reminder + 15min reminder
		expect(window.showInformationMessage).toHaveBeenCalledTimes(3);
		expect(vi.mocked(window.showInformationMessage).mock.calls[2][0]).toContain(
			"(Final Reminder)",
		);
		nm.dispose();
	});

	it("cancels reminder timers when clearSession is called", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		nm.clearSession("sess1");
		vi.advanceTimersByTime(900_000);

		expect(window.showInformationMessage).toHaveBeenCalledTimes(1);
		nm.dispose();
	});

	it("includes folder name in notification", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent({ cwd: "/home/user/projects/AwesomeApp" }));

		expect(vi.mocked(window.showInformationMessage).mock.calls[0][0]).toContain(
			"AwesomeApp",
		);
		nm.dispose();
	});

	it("calls focusTerminal when Open Terminal is clicked", async () => {
		vi.mocked(window.showInformationMessage).mockResolvedValue(
			"Open Terminal" as any,
		);

		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		// Let promise resolve
		await vi.advanceTimersByTimeAsync(0);

		expect(tm.focusTerminal).toHaveBeenCalledWith("sess1", "/c/Github/MyProject");
		nm.dispose();
	});

	it("spawns PowerShell toast script with vscode:// URI when extensionPath provided", () => {
		const nm = createNotificationManager(tm, "/ext/path");
		nm.notify(makeEvent());

		const mockExecFile = vi.mocked(execFile);
		expect(mockExecFile).toHaveBeenCalledTimes(1);
		const args = mockExecFile.mock.calls[0][1] as string[];
		expect(args).toContain("-File");
		expect(args.some((a) => a.includes("toast.ps1"))).toBe(true);
		expect(args).toContain("-Uri");
		const uriArg = args[args.indexOf("-Uri") + 1];
		expect(uriArg).toContain("vscode://cc-notifier.cc-notifier/focus");
		expect(uriArg).toContain("session=sess1");
		nm.dispose();
	});

	it("does not spawn toast when no extensionPath provided", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent());

		expect(vi.mocked(execFile)).not.toHaveBeenCalled();
		nm.dispose();
	});

	it("suppresses toast when VS Code window is focused", () => {
		window.state.focused = true;
		const nm = createNotificationManager(tm, "/ext/path");
		nm.notify(makeEvent());

		// Toast should NOT fire
		expect(vi.mocked(execFile)).not.toHaveBeenCalled();
		// In-app should still fire
		expect(window.showInformationMessage).toHaveBeenCalled();
		nm.dispose();
		window.state.focused = false;
	});

	it("fires toast when VS Code window is not focused", () => {
		window.state.focused = false;
		const nm = createNotificationManager(tm, "/ext/path");
		nm.notify(makeEvent());

		expect(vi.mocked(execFile)).toHaveBeenCalled();
		nm.dispose();
	});

	it("suppresses reminder toast when VS Code window is focused", () => {
		window.state.focused = false;
		const nm = createNotificationManager(tm, "/ext/path");
		nm.notify(makeEvent());

		// Initial toast fires
		expect(vi.mocked(execFile)).toHaveBeenCalledTimes(1);

		// Window gains focus before reminder
		window.state.focused = true;
		vi.advanceTimersByTime(300_000);

		// Reminder toast should NOT fire (still 1 call total)
		expect(vi.mocked(execFile)).toHaveBeenCalledTimes(1);
		// But in-app reminder should still fire
		expect(window.showInformationMessage).toHaveBeenCalledTimes(2);
		nm.dispose();
		window.state.focused = false;
	});

	it("clearAllSessions cancels all active reminder timers", () => {
		const nm = createNotificationManager(tm);
		nm.notify(makeEvent({ session_id: "sess1" }));
		nm.notify(makeEvent({ session_id: "sess2" }));

		nm.clearAllSessions();
		vi.advanceTimersByTime(900_000);

		// Only the 2 initial notifications, no reminders
		expect(window.showInformationMessage).toHaveBeenCalledTimes(2);
		nm.dispose();
	});
});
