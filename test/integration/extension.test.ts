import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Integration Tests", () => {
	test("Extension activates successfully", async () => {
		const ext = vscode.extensions.getExtension("cc-notifier.cc-notifier");
		assert.ok(ext, "Extension should be found");
		await ext!.activate();
		assert.ok(ext!.isActive, "Extension should be active");
	});

	test("Commands are registered", async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes("ccNotifier.configureHooks"),
			"configureHooks command should be registered",
		);
		assert.ok(
			commands.includes("ccNotifier.showLog"),
			"showLog command should be registered",
		);
	});
});
