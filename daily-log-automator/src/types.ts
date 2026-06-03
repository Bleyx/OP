/**
 * Shared type definitions for the Daily Log Automator plugin.
 * Designed to be extended as the personal OS grows (habits, metrics, goals, etc.).
 */

/** A single parsed task extracted from a daily note. */
export interface Task {
	/** The raw markdown line, e.g. "- [ ] Contact M. Sari" */
	raw: string;
	/** The task description without the checkbox prefix */
	text: string;
	/** Whether the task is completed */
	completed: boolean;
	/** Original source date if this task was carried over (YYYY-MM-DD) */
	originDate: string | null;
}

/** The logical sections of a daily note. */
export interface DailyNoteStructure {
	/** The tag line, e.g. "#dailynotes" */
	tag: string;
	/** Count of carried-over tasks */
	carriedOverCount: number;
	/** Count of new tasks */
	newTaskCount: number;
	/** Tasks in the "Carried Over Tasks" section */
	carriedOverTasks: Task[];
	/** Tasks in the "New Tasks" section */
	newTasks: Task[];
	/** Free-form journal content */
	journalContent: string;
}

/** Plugin settings persisted to data.json. */
export interface DailyLogSettings {
	/** Folder path within the vault for daily notes */
	dailyLogFolder: string;
	/** Whether to auto-carry unchecked tasks from the previous note */
	enableAutoCarryOver: boolean;
	/** Whether to append "From YYYY-MM-DD" origin tracking */
	enableTaskOriginTracking: boolean;
	/** Whether to auto-update task counters on modification */
	enableAutoStatistics: boolean;
}

/** Default settings applied on first install. */
export const DEFAULT_SETTINGS: DailyLogSettings = {
	dailyLogFolder: "Daily Log",
	enableAutoCarryOver: true,
	enableTaskOriginTracking: true,
	enableAutoStatistics: true,
};
