import * as vscode from "vscode";

export interface CCNotifierConfig {
	enableToast: boolean;
	enableInApp: boolean;
	notifyOnIdle: boolean;
	notifyOnPermission: boolean;
	enableSound: boolean;
	verboseLogging: boolean;
	reminderIntervals: number[];
}

export function getConfig(): CCNotifierConfig {
	const cfg = vscode.workspace.getConfiguration("ccNotifier");
	return {
		enableToast: cfg.get("enableToast", true),
		enableInApp: cfg.get("enableInApp", true),
		notifyOnIdle: cfg.get("notifyOnIdle", true),
		notifyOnPermission: cfg.get("notifyOnPermission", true),
		enableSound: cfg.get("enableSound", true),
		verboseLogging: cfg.get("verboseLogging", true),
		reminderIntervals: [300_000, 900_000],
	};
}
