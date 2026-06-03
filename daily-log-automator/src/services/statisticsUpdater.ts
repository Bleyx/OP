/**
 * StatisticsUpdater — keeps the task-count header lines in sync with actual
 * task counts inside each section.
 *
 * Scans the note for "## Carried Over Tasks" and "## New Tasks" sections,
 * counts all task lines (`- [ ]` and `- [x]`) within each, and rewrites the
 * header counters accordingly.
 */

export class StatisticsUpdater {
	/** Regex matching the carried-over counter line */
	private static CARRIED_RE = /^- Carried Over Tasks:\s*\d+$/;
	/** Regex matching the new-tasks counter line */
	private static NEW_RE = /^- New Tasks:\s*\d+$/;
	/** Regex matching any task line (checked or unchecked) */
	private static TASK_RE = /^-\s+\[([ x])\]\s+/;

	/**
	 * Recompute statistics and return updated content.
	 * Returns null if no changes were needed (avoids unnecessary writes).
	 */
	update(content: string): string | null {
		const carriedCount = this.countTasksInSection(content, "Carried Over Tasks");
		const newCount = this.countTasksInSection(content, "New Tasks");

		let updated = content;
		let changed = false;

		// Replace carried-over counter
		updated = updated.replace(
			StatisticsUpdater.CARRIED_RE,
			(match) => {
				const replacement = `- Carried Over Tasks: ${carriedCount}`;
				if (match !== replacement) changed = true;
				return replacement;
			}
		);

		// Replace new-tasks counter
		updated = updated.replace(
			StatisticsUpdater.NEW_RE,
			(match) => {
				const replacement = `- New Tasks: ${newCount}`;
				if (match !== replacement) changed = true;
				return replacement;
			}
		);

		return changed ? updated : null;
	}

	/** Count task lines inside a specific ## section. */
	private countTasksInSection(content: string, sectionHeading: string): number {
		const lines = content.split("\n");
		let inSection = false;
		let count = 0;

		for (const line of lines) {
			const trimmed = line.trim();

			if (trimmed.startsWith("## ")) {
				inSection = trimmed === `## ${sectionHeading}`;
				continue;
			}

			if (inSection && StatisticsUpdater.TASK_RE.test(trimmed)) {
				count++;
			}
		}
		return count;
	}
}
