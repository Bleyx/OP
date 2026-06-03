/**
 * TaskCarryOver — logic for transferring unfinished tasks between daily notes.
 *
 * Responsibilities:
 * - Find the most recent previous daily note in the configured folder.
 * - Extract unchecked tasks from that note.
 * - Format them with origin-date tracking for insertion into a new note.
 */

import { App, TFile, TFolder, Vault } from "obsidian";
import { Task, DailyLogSettings } from "../types";
import { TaskParser } from "./taskParser";

/** Date string format used for filenames: YYYY-MM-DD */
const DATE_REGEX = /^(\d{4}-\d{2}-\d{2})\.md$/;

export class TaskCarryOver {
	private parser: TaskParser;

	constructor(private app: App, private settings: DailyLogSettings) {
		this.parser = new TaskParser();
	}

	/**
	 * List all daily-note files sorted by date descending.
	 * Only files whose names match YYYY-MM-DD.md are considered.
	 */
	getSortedDailyNotes(): TFile[] {
		const folder = this.app.vault.getAbstractFileByPath(
			this.settings.dailyLogFolder
		);
		if (!folder || !(folder instanceof TFolder)) return [];

		return folder.children
			.filter((f): f is TFile => f instanceof TFile && DATE_REGEX.test(f.name))
			.sort((a, b) => b.name.localeCompare(a.name));
	}

	/**
	 * Find the previous daily note relative to the given date string (YYYY-MM-DD).
	 * Returns null if none exists.
	 */
	findPreviousNote(currentDate: string): TFile | null {
		const notes = this.getSortedDailyNotes();
		for (const note of notes) {
			const dateStr = note.name.replace(".md", "");
			if (dateStr < currentDate) return note;
		}
		return null;
	}

	/**
	 * Retrieve unfinished tasks from the previous daily note.
	 * Attaches origin-date annotations when enabled in settings.
	 */
	async getCarryOverTasks(currentDate: string): Promise<string[]> {
		if (!this.settings.enableAutoCarryOver) return [];

		const prevNote = this.findPreviousNote(currentDate);
		if (!prevNote) return [];

		const content = await this.app.vault.read(prevNote);
		const unfinished = this.parser.parseUnfinishedTasks(content);
		const prevDate = prevNote.name.replace(".md", "");

		return unfinished.map((task) => this.formatCarriedTask(task, prevDate));
	}

	/**
	 * Format a single task for carry-over, preserving existing origin dates
	 * or appending a new one.
	 */
	private formatCarriedTask(task: Task, previousNoteDate: string): string {
		if (!this.settings.enableTaskOriginTracking) {
			return task.raw;
		}

		// If the task already has an origin date, preserve it
		if (task.originDate) {
			return task.raw;
		}

		// Strip trailing whitespace from the raw line and append origin
		const base = task.raw.trimEnd();
		return `${base} \u{1F504} From ${previousNoteDate}`;
	}
}
