import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("vscode", () => import("./__mocks__/vscode.js"));

import { workspace } from "vscode";
import { getConfig } from "../../src/config.js";

describe("config", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns all defaults when no settings configured", () => {
		const config = getConfig();
		expect(config.enableToast).toBe(true);
		expect(config.enableInApp).toBe(true);
		expect(config.notifyOnIdle).toBe(true);
		expect(config.notifyOnPermission).toBe(true);
		expect(config.enableSound).toBe(true);
		expect(config.verboseLogging).toBe(true);
		expect(config.reminderIntervals).toEqual([300_000, 900_000]);
	});

	it("reads overridden setting values", () => {
		vi.mocked(workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, defaultValue: any) => {
				if (key === "enableToast") return false;
				if (key === "enableSound") return false;
				return defaultValue;
			}),
		} as any);

		const config = getConfig();
		expect(config.enableToast).toBe(false);
		expect(config.enableSound).toBe(false);
		expect(config.enableInApp).toBe(true);
	});

	it("returns fresh config on each call (not cached)", () => {
		let callCount = 0;
		vi.mocked(workspace.getConfiguration).mockImplementation(() => {
			callCount++;
			return {
				get: vi.fn((_key: string, defaultValue: any) => defaultValue),
			} as any;
		});

		getConfig();
		getConfig();
		expect(callCount).toBe(2);
	});
});
