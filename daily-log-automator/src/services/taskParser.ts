/**
 * TaskParser — extracts tasks from raw markdown note content.
 *
 * Handles both standard checkboxes and the user's existing format which may
 * include Obsidian task-plugin annotations (dates, priorities, etc.).
 */

import { Task } from "../types";

/** Regex that matches a markdown task line: `- [ ] ...` or `- [x] ...` */
const TASK_REGEX = /^-\s+\[([ x])\]\s+(.+)$/;

/** Regex that captures an existing origin-tracking annotation: `From YYYY-MM-DD` */
const ORIGIN_DATE_REGEX = /\u{1F504}\s*From\s+(\d{4}-\d{2}-\d{2})/u;

export class TaskParser {
	/**
	 * Parse all task lines from raw markdown content.
	 * Returns an array of Task objects preserving their order.
	 */
	parseTasks(content: string): Task[] {
		const tasks: Task[] = [];
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			const match = trimmed.match(TASK_REGEX);
			if (!match) continue;

			const completed = match[1] === "x";
			const text = match[2].trim();

			const originMatch = text.match(ORIGIN_DATE_REGEX);
			const originDate = originMatch ? originMatch[1] : null;

			tasks.push({ raw: trimmed, text, completed, originDate });
		}
		return tasks;
	}

	/** Return only unchecked tasks from the given content. */
	parseUnfinishedTasks(content: string): Task[] {
		return this.parseTasks(content).filter((t) => !t.completed);
	}

	/**
	 * Extract tasks that belong to a specific markdown section.
	 * `sectionHeading` should be the heading text, e.g. "Carried Over Tasks".
	 */
	parseTasksInSection(content: string, sectionHeading: string): Task[] {
		const lines = content.split("\n");
		const tasks: Task[] = [];
		let inSection = false;

		for (const line of lines) {
			const trimmed = line.trim();

			// Detect heading boundaries
			if (trimmed.startsWith("## ")) {
				inSection = trimmed === `## ${sectionHeading}`;
				continue;
			}

			if (!inSection) continue;

			const match = trimmed.match(TASK_REGEX);
			if (!match) continue;

			const completed = match[1] === "x";
			const text = match[2].trim();
			const originMatch = text.match(ORIGIN_DATE_REGEX);
			const originDate = originMatch ? originMatch[1] : null;

			tasks.push({ raw: trimmed, text, completed, originDate });
		}
		return tasks;
	}
}
