/**
 * NoteGenerator — builds the markdown content for a new daily note.
 *
 * Produces the canonical structure:
 *   #dailynotes
 *   - Carried Over Tasks: X
 *   - New Tasks: 0
 *   ## Carried Over Tasks
 *   ...tasks...
 *   ## New Tasks
 *   ## Journal
 */

export class NoteGenerator {
	/**
	 * Generate a complete new daily note with carried-over tasks inserted.
	 * @param carriedTasks Formatted task lines to place under "Carried Over Tasks".
	 */
	generate(carriedTasks: string[]): string {
		const carriedCount = carriedTasks.length;
		const lines: string[] = [
			"#dailynotes",
			"",
			`- Carried Over Tasks: ${carriedCount}`,
			"- New Tasks: 0",
			"",
			"## Carried Over Tasks",
			"",
		];

		if (carriedTasks.length > 0) {
			lines.push(...carriedTasks);
			lines.push("");
		}

		lines.push("## New Tasks", "", "## Journal", "");

		return lines.join("\n");
	}
}
