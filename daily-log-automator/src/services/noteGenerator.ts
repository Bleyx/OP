/**
 * NoteGenerator — builds the markdown content for a new daily note.
 *
 * Produces the flat format matching the user's existing style:
 *   #dailynotes
 *   - Carried over tasks: X
 *   - New Tasks: 0
 *   - [ ] task 1 🔄 From 2026-06-02
 *   - [ ] task 2 🔄 From 2026-06-01
 *   	Journal text starts here (tab-indented)
 */

export class NoteGenerator {
	/**
	 * Generate a complete new daily note with carried-over tasks inserted.
	 * No section headers — flat format matching existing notes.
	 */
	generate(carriedTasks: string[]): string {
		const carriedCount = carriedTasks.length;
		const lines: string[] = [
			"#dailynotes",
			`- Carried over tasks: ${carriedCount}`,
			"- New Tasks: 0",
		];

		for (const task of carriedTasks) {
			lines.push(task);
		}

		// Trailing newline
		lines.push("");

		return lines.join("\n");
	}
}
