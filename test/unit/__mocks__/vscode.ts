import { vi } from "vitest";

const outputChannel = {
	appendLine: vi.fn(),
	show: vi.fn(),
	dispose: vi.fn(),
};

const terminals: any[] = [];
const onDidOpenTerminalCallbacks: Function[] = [];
const onDidCloseTerminalCallbacks: Function[] = [];

const onDidChangeWindowStateCallbacks: Function[] = [];

export const window = {
	createOutputChannel: vi.fn(() => outputChannel),
	showInformationMessage: vi.fn(() => Promise.resolve(undefined)),
	showWarningMessage: vi.fn(() => Promise.resolve(undefined)),
	showErrorMessage: vi.fn(() => Promise.resolve(undefined)),
	state: { focused: false },
	terminals,
	onDidOpenTerminal: vi.fn((cb: Function) => {
		onDidOpenTerminalCallbacks.push(cb);
		return { dispose: vi.fn() };
	}),
	onDidCloseTerminal: vi.fn((cb: Function) => {
		onDidCloseTerminalCallbacks.push(cb);
		return { dispose: vi.fn() };
	}),
	onDidChangeWindowState: vi.fn((cb: Function) => {
		onDidChangeWindowStateCallbacks.push(cb);
		return { dispose: vi.fn() };
	}),
	registerUriHandler: vi.fn(() => ({ dispose: vi.fn() })),
	__outputChannel: outputChannel,
	__onDidOpenTerminalCallbacks: onDidOpenTerminalCallbacks,
	__onDidCloseTerminalCallbacks: onDidCloseTerminalCallbacks,
	__onDidChangeWindowStateCallbacks: onDidChangeWindowStateCallbacks,
};

export const workspace = {
	getConfiguration: vi.fn(() => ({
		get: vi.fn((key: string, defaultValue: any) => defaultValue),
	})),
	onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
};

export const commands = {
	registerCommand: vi.fn((_cmd: string, _cb: Function) => ({
		dispose: vi.fn(),
	})),
	executeCommand: vi.fn(),
};

export const Uri = {
	file: (p: string) => ({ fsPath: p, scheme: "file" }),
};
