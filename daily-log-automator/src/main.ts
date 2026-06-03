/**
 * Daily Log Automator — Obsidian plugin entry point.
 *
 * Registers commands, hooks into file-modify events for auto-statistics,
 * and wires up the settings tab.
 */

import {
	App,
	Modal,
	Notice,
	Plugin,
	TFile,
	TFolder,
	TextComponent,
} from "obsidian";

import { DailyLogSettings, DEFAULT_SETTINGS } from "./types";
import { DailyLogSettingsTab } from "./settingsTab";
import { TaskCarryOver } from "./services/taskCarryOver";
import { NoteGenerator } from "./services/noteGenerator";
import { StatisticsUpdater } from "./services/statisticsUpdater";

export default class DailyLogAutomatorPlugin extends Plugin {
	settings: DailyLogSettings = DEFAULT_SETTINGS;

	private carryOver!: TaskCarryOver;
	private generator: NoteGenerator = new NoteGenerator();
	private stats: StatisticsUpdater = new StatisticsUpdater();

	/** Debounce handle to avoid rapid successive stat updates */
	private statsDebounce: ReturnType<typeof setTimeout> | null = null;

	/** Track files we are currently populating to avoid re-triggering */
	private populatingFiles: Set<string> = new Set();

	/* ------------------------------------------------------------------ */
	/*  Lifecycle                                                          */
	/* ------------------------------------------------------------------ */

	async onload(): Promise<void> {
		await this.loadSettings();

		this.carryOver = new TaskCarryOver(this.app, this.settings);

		// --- Commands ---
		this.addCommand({
			id: "create-daily-log",
			name: "Create Daily Log",
			callback: () => this.createDailyLog(),
		});

		this.addCommand({
			id: "add-new-task",
			name: "Add New Task",
			callback: () => this.promptAddTask(),
		});

		// --- Settings tab ---
		this.addSettingTab(new DailyLogSettingsTab(this.app, this));

		// --- Auto-populate new daily notes on creation ---
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile) this.onFileCreated(file);
			})
		);

		// --- Auto-statistics on file modify ---
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile) this.onFileModified(file);
			})
		);
	}

	/* ------------------------------------------------------------------ */
	/*  Settings persistence                                               */
	/* ------------------------------------------------------------------ */

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// Re-create carry-over service so it picks up new settings
		this.carryOver = new TaskCarryOver(this.app, this.settings);
	}

	/* ------------------------------------------------------------------ */
	/*  Command: Create Daily Log                                          */
	/* ------------------------------------------------------------------ */

	private async createDailyLog(): Promise<void> {
		const today = this.todayDateString();
		const folderPath = this.settings.dailyLogFolder;
		const filePath = `${folderPath}/${today}.md`;

		// Check if the note already exists
		const existing = this.app.vault.getAbstractFileByPath(filePath);
		if (existing instanceof TFile) {
			new Notice(`Daily log for ${today} already exists.`);
			await this.app.workspace.getLeaf().openFile(existing);
			return;
		}

		// Ensure the target folder exists
		await this.ensureFolder(folderPath);

		// Gather carry-over tasks
		const carriedTasks = await this.carryOver.getCarryOverTasks(today);

		// Generate note content
		const content = this.generator.generate(carriedTasks);

		// Create and open the file
		const file = await this.app.vault.create(filePath, content);
		await this.app.workspace.getLeaf().openFile(file);

		new Notice(
			`Daily log created for ${today} with ${carriedTasks.length} carried-over task(s).`
		);
	}

	/* ------------------------------------------------------------------ */
	/*  Command: Add New Task                                              */
	/* ------------------------------------------------------------------ */

	private promptAddTask(): void {
		new AddTaskModal(this.app, async (taskText: string) => {
			await this.addTaskToToday(taskText);
		}).open();
	}

	private async addTaskToToday(taskText: string): Promise<void> {
		const today = this.todayDateString();
		const filePath = `${this.settings.dailyLogFolder}/${today}.md`;
		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (!(file instanceof TFile)) {
			new Notice("Today's daily log does not exist yet. Create it first.");
			return;
		}

		let content = await this.app.vault.read(file);
		const taskLine = `- [ ] ${taskText}`;

		// Insert the task at the end of the "## New Tasks" section
		content = this.insertInSection(content, "New Tasks", taskLine);

		await this.app.vault.modify(file, content);
		new Notice(`Task added: ${taskText}`);
	}

	/**
	 * Insert a line at the end of a given ## section, before the next ## heading
	 * or end of file.
	 */
	private insertInSection(
		content: string,
		sectionHeading: string,
		line: string
	): string {
		const lines = content.split("\n");
		const result: string[] = [];
		let inserted = false;
		let inSection = false;

		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i].trim();

			if (trimmed === `## ${sectionHeading}`) {
				inSection = true;
				result.push(lines[i]);
				continue;
			}

			// If we hit a new heading while inside our section, insert before it
			if (inSection && trimmed.startsWith("## ")) {
				// Add the task line before this heading
				result.push(line);
				result.push("");
				inSection = false;
				inserted = true;
			}

			result.push(lines[i]);
		}

		// If we reached EOF while still in section, append there
		if (inSection && !inserted) {
			result.push(line);
			inserted = true;
		}

		// Fallback: if section was not found, append at end
		if (!inserted) {
			result.push(line);
		}

		return result.join("\n");
	}

	/* ------------------------------------------------------------------ */
	/*  Auto-populate new daily notes on creation                          */
	/* ------------------------------------------------------------------ */

	/**
	 * Triggered whenever a file is created in the vault.
	 * If it's a new daily note (YYYY-MM-DD.md in the Daily Log folder),
	 * automatically populate it with the template + carried-over tasks.
	 */
	private async onFileCreated(file: TFile): Promise<void> {
		if (!this.isDailyNote(file)) return;
		if (this.populatingFiles.has(file.path)) return;

		// Small delay to let Obsidian finish creating the file
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Only populate if the file is empty or nearly empty
		const content = await this.app.vault.read(file);
		if (content.trim().length > 0) return;

		const dateStr = file.name.replace(".md", "");

		try {
			this.populatingFiles.add(file.path);

			const carriedTasks = await this.carryOver.getCarryOverTasks(dateStr);
			const generated = this.generator.generate(carriedTasks);

			await this.app.vault.modify(file, generated);

			new Notice(
				`Daily log auto-populated for ${dateStr} with ${carriedTasks.length} carried-over task(s).`
			);
		} finally {
			this.populatingFiles.delete(file.path);
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Auto-statistics on file modify                                     */
	/* ------------------------------------------------------------------ */

	private onFileModified(file: TFile): void {
		if (!this.settings.enableAutoStatistics) return;
		if (!this.isDailyNote(file)) return;

		// Debounce: wait 500ms after last keystroke
		if (this.statsDebounce) clearTimeout(this.statsDebounce);
		this.statsDebounce = setTimeout(() => this.updateStats(file), 500);
	}

	private async updateStats(file: TFile): Promise<void> {
		const content = await this.app.vault.read(file);
		const updated = this.stats.update(content);
		if (updated !== null) {
			await this.app.vault.modify(file, updated);
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                            */
	/* ------------------------------------------------------------------ */

	/** Check whether a file lives inside the configured daily-log folder. */
	private isDailyNote(file: TFile): boolean {
		const folder = this.settings.dailyLogFolder;
		return (
			file.path.startsWith(folder + "/") &&
			/^\d{4}-\d{2}-\d{2}\.md$/.test(file.name)
		);
	}

	/** Returns today's date as YYYY-MM-DD. */
	private todayDateString(): string {
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	}

	/** Recursively ensure a vault folder exists. */
	private async ensureFolder(path: string): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFolder) return;
		await this.app.vault.createFolder(path);
	}
}

/* ------------------------------------------------------------------ */
/*  Add Task Modal                                                     */
/* ------------------------------------------------------------------ */

class AddTaskModal extends Modal {
	private input: TextComponent | null = null;

	constructor(
		app: App,
		private onSubmit: (text: string) => Promise<void>
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: "Add New Task" });

		const inputContainer = contentEl.createDiv();
		this.input = new TextComponent(inputContainer);
		this.input.setPlaceholder("Enter task description...");
		this.input.inputEl.style.width = "100%";

		// Submit on Enter
		this.input.inputEl.addEventListener("keydown", async (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				await this.submit();
			}
		});

		// Submit button
		const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
		const btn = btnContainer.createEl("button", { text: "Add Task" });
		btn.addEventListener("click", async () => {
			await this.submit();
		});

		// Focus the input
		setTimeout(() => this.input?.inputEl.focus(), 50);
	}

	private async submit(): Promise<void> {
		const value = this.input?.getValue().trim();
		if (!value) {
			new Notice("Task description cannot be empty.");
			return;
		}
		await this.onSubmit(value);
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
