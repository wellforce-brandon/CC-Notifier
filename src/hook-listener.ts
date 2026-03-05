import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type * as vscode from "vscode";
import { log, logVerbose } from "./logger.js";

export interface HookEvent {
	event: "idle_prompt" | "permission_prompt";
	session_id: string;
	timestamp: number;
	cwd: string;
	message?: string;
}

const TEMP_DIR = path.join(os.tmpdir(), "cc-notifier");
const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const READ_DELAY_MS = 50;

function ensureTempDir(): void {
	try {
		fs.mkdirSync(TEMP_DIR, { recursive: true });
	} catch (err) {
		log(`Failed to create temp dir: ${err}`);
	}
}

function parseEventFile(filePath: string): HookEvent | undefined {
	try {
		const content = fs.readFileSync(filePath, "utf-8");
		const data = JSON.parse(content);
		if (!data.event || !data.session_id || !data.timestamp) {
			log(`Invalid event file (missing fields): ${filePath}`);
			return undefined;
		}
		return data as HookEvent;
	} catch (err) {
		log(`Failed to parse event file ${filePath}: ${err}`);
		return undefined;
	}
}

function deleteFile(filePath: string): void {
	try {
		fs.unlinkSync(filePath);
	} catch {}
}

function processExistingFiles(onEvent: (event: HookEvent) => void): void {
	let files: string[];
	try {
		files = fs.readdirSync(TEMP_DIR).filter((f) => f.endsWith(".json"));
	} catch {
		return;
	}

	const now = Date.now();
	for (const file of files) {
		const filePath = path.join(TEMP_DIR, file);
		const event = parseEventFile(filePath);
		deleteFile(filePath);
		if (event && now - event.timestamp < STALE_THRESHOLD_MS) {
			logVerbose(`Processing existing event: ${event.event} for session ${event.session_id}`);
			onEvent(event);
		} else if (event) {
			logVerbose(`Skipping stale event from session ${event.session_id}`);
		}
	}
}

export function startHookListener(
	onEvent: (event: HookEvent) => void,
): vscode.Disposable {
	ensureTempDir();
	processExistingFiles(onEvent);

	const processedFiles = new Set<string>();

	const watcher = fs.watch(TEMP_DIR, (eventType, filename) => {
		if (!filename || !filename.endsWith(".json")) return;
		if (processedFiles.has(filename)) return;
		processedFiles.add(filename);

		// Clean up set to prevent unbounded growth
		if (processedFiles.size > 1000) {
			processedFiles.clear();
		}

		setTimeout(() => {
			const filePath = path.join(TEMP_DIR, filename);
			const event = parseEventFile(filePath);
			deleteFile(filePath);
			if (event) {
				logVerbose(`Hook event: ${event.event} for session ${event.session_id}`);
				onEvent(event);
			}
		}, READ_DELAY_MS);
	});

	log(`Watching for hook events in ${TEMP_DIR}`);

	return {
		dispose() {
			watcher.close();
			log("Hook listener stopped");
		},
	};
}
