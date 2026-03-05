import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("vscode", () => import("./__mocks__/vscode.js"));

import { window } from "vscode";
import { createTerminalManager } from "../../src/terminal-manager.js";
import { createLogger } from "../../src/logger.js";

function makeTerminal(name: string, cwd?: string): any {
	return {
		name,
		creationOptions: cwd ? { cwd } : {},
		show: vi.fn(),
		dispose: vi.fn(),
	};
}

function makeContext() {
	return {
		subscriptions: [],
		extensionPath: "/ext",
	} as any;
}

describe("terminal-manager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(window as any).terminals.length = 0;
		(window as any).__onDidOpenTerminalCallbacks.length = 0;
		(window as any).__onDidCloseTerminalCallbacks.length = 0;
		createLogger({ subscriptions: [] } as any);
	});

	it("finds terminal matching cwd exactly", () => {
		const t = makeTerminal("bash", "/c/Github/MyProject");
		(window as any).terminals.push(t);

		const tm = createTerminalManager(makeContext());
		const found = tm.findTerminal("sess1", "/c/Github/MyProject");

		expect(found).toBe(t);
	});

	it("finds terminal matching cwd case-insensitively (Windows)", () => {
		const t = makeTerminal("bash", "C:\\Github\\MyProject");
		(window as any).terminals.push(t);

		const tm = createTerminalManager(makeContext());
		const found = tm.findTerminal("sess1", "c:/github/myproject");

		expect(found).toBe(t);
	});

	it("handles forward-slash vs backslash path comparison", () => {
		const t = makeTerminal("bash", "C:\\Users\\test\\project");
		(window as any).terminals.push(t);

		const tm = createTerminalManager(makeContext());
		const found = tm.findTerminal("sess1", "C:/Users/test/project");

		expect(found).toBe(t);
	});

	it("falls back to terminal with matching folder name", () => {
		const t = makeTerminal("MyProject - bash", undefined);
		(window as any).terminals.push(t);

		const tm = createTerminalManager(makeContext());
		const found = tm.findTerminal("sess1", "/c/Github/MyProject");

		expect(found).toBe(t);
	});

	it("returns undefined when no terminals exist", () => {
		const tm = createTerminalManager(makeContext());
		const found = tm.findTerminal("sess1", "/c/Github/NoMatch");

		expect(found).toBeUndefined();
	});

	it("tracks terminal lifecycle (open/close events)", () => {
		const tm = createTerminalManager(makeContext());

		const t = makeTerminal("new-term", "/test/path");
		const openCallbacks = (window as any).__onDidOpenTerminalCallbacks;
		openCallbacks[openCallbacks.length - 1](t);

		expect(tm.findTerminal("s1", "/test/path")).toBe(t);

		const closeCallbacks = (window as any).__onDidCloseTerminalCallbacks;
		closeCallbacks[closeCallbacks.length - 1](t);

		// After close, should not find by cwd (falls back to undefined if no others)
		const found = tm.findTerminal("s1", "/test/path");
		expect(found).toBeUndefined();
	});

	it("focusTerminal calls terminal.show(false)", () => {
		const t = makeTerminal("bash", "/c/Github/MyProject");
		(window as any).terminals.push(t);

		const tm = createTerminalManager(makeContext());
		const result = tm.focusTerminal("sess1", "/c/Github/MyProject");

		expect(result).toBe(true);
		expect(t.show).toHaveBeenCalledWith(false);
	});
});
