/**
 * StatisticsUpdater — keeps the task-count header lines in sync.
 *
 * In the flat note format (no section headers), tasks are distinguished by
 * origin markers: lines containing "🔄 From" are carried-over tasks,
 * task lines without that marker are new tasks.
 */

/** Regex matching the origin-tracking annotation */
const ORIGIN_MARKER_RE = /\u{1F504}\s*From\s+\d{4}-\d{2}-\d{2}/u;

export class StatisticsUpdater {
	/** Regex matching the carried-over counter line */
	private static CARRIED_RE = /^- Carried over tasks:\s*\d+$/i;
	/** Regex matching the new-tasks counter line */
	private static NEW_RE = /^- New Tasks:\s*\d+$/;
	/** Regex matching any task line (checked or unchecked) */
	private static TASK_RE = /^-\s+\[([ x])\]\s+/;

	/**
	 * Recompute statistics and return updated content.
	 * Returns null if no changes were needed (avoids unnecessary writes).
	 */
	update(content: string): string | null {
		const lines = content.split("\n");
		let carriedCount = 0;
		let newCount = 0;

		for (const line of lines) {
			const trimmed = line.trim();
			if (!StatisticsUpdater.TASK_RE.test(trimmed)) continue;

			if (ORIGIN_MARKER_RE.test(trimmed)) {
				carriedCount++;
			} else {
				newCount++;
			}
		}

		let updated = content;
		let changed = false;

		// Replace carried-over counter
		updated = updated.replace(
			StatisticsUpdater.CARRIED_RE,
			(match) => {
				const replacement = `- Carried over tasks: ${carriedCount}`;
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
}
