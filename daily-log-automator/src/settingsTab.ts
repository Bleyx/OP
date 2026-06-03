/**
 * SettingsTab — Obsidian settings pane for the Daily Log Automator plugin.
 *
 * Exposes:
 * - Daily Log Folder path
 * - Toggle: Automatic Carry Over
 * - Toggle: Task Origin Tracking
 * - Toggle: Auto Statistics
 */

import { App, PluginSettingTab, Setting } from "obsidian";
import type DailyLogAutomatorPlugin from "./main";

export class DailyLogSettingsTab extends PluginSettingTab {
	constructor(app: App, private plugin: DailyLogAutomatorPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Daily Log Automator Settings" });

		// --- Folder path ---
		new Setting(containerEl)
			.setName("Daily Log Folder")
			.setDesc("Folder inside your vault where daily notes are stored.")
			.addText((text) =>
				text
					.setPlaceholder("Daily Log")
					.setValue(this.plugin.settings.dailyLogFolder)
					.onChange(async (value) => {
						this.plugin.settings.dailyLogFolder = value.trim() || "Daily Log";
						await this.plugin.saveSettings();
					})
			);

		// --- Auto carry-over toggle ---
		new Setting(containerEl)
			.setName("Enable Automatic Carry Over")
			.setDesc(
				"Automatically transfer unchecked tasks from the previous daily note into new notes."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAutoCarryOver)
					.onChange(async (value) => {
						this.plugin.settings.enableAutoCarryOver = value;
						await this.plugin.saveSettings();
					})
			);

		// --- Origin tracking toggle ---
		new Setting(containerEl)
			.setName("Enable Task Origin Tracking")
			.setDesc(
				'Append "\u{1F504} From YYYY-MM-DD" to carried-over tasks so you know when they were first created.'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTaskOriginTracking)
					.onChange(async (value) => {
						this.plugin.settings.enableTaskOriginTracking = value;
						await this.plugin.saveSettings();
					})
			);

		// --- Auto statistics toggle ---
		new Setting(containerEl)
			.setName("Enable Auto Statistics")
			.setDesc(
				"Automatically update task counters whenever a daily note is modified."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAutoStatistics)
					.onChange(async (value) => {
						this.plugin.settings.enableAutoStatistics = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
