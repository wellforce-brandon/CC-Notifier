#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const eventType = process.argv[2] || "unknown";

let input = "";
try {
	input = fs.readFileSync(0, "utf-8");
} catch {
	process.exit(0);
}

let data;
try {
	data = JSON.parse(input);
} catch {
	process.exit(0);
}

const sessionId = data.session_id || "unknown";
const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || "";
const message = data.message || "";
const event =
	eventType === "idle"
		? "idle_prompt"
		: eventType === "permission"
			? "permission_prompt"
			: data.notification_type || eventType;

const eventPayload = JSON.stringify({
	event,
	session_id: sessionId,
	timestamp: Date.now(),
	cwd,
	message,
});

const dir = path.join(os.tmpdir(), "cc-notifier");
try {
	fs.mkdirSync(dir, { recursive: true });
} catch {
	process.exit(0);
}

const basename = `${sessionId}-${Date.now()}`;
const tmpFile = path.join(dir, `${basename}.tmp`);
const jsonFile = path.join(dir, `${basename}.json`);

try {
	fs.writeFileSync(tmpFile, eventPayload, "utf-8");
	fs.renameSync(tmpFile, jsonFile);
} catch {
	// Clean up tmp file if rename failed
	try {
		fs.unlinkSync(tmpFile);
	} catch {}
}
