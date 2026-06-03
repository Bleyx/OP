# Daily Log Automator — Obsidian Plugin

Automatically creates and maintains daily log structure, carries forward unfinished tasks, and keeps task statistics updated in real time.

> **v1** of a larger Obsidian-based personal OS.

---

## Features

| Feature | Description |
|---|---|
| **Auto carry-over** | Unchecked tasks from the previous daily note are inserted into the new note under "Carried Over Tasks". |
| **Origin tracking** | Carried tasks are annotated with `🔄 From YYYY-MM-DD` preserving the original date across multiple days. |
| **Live statistics** | `- Carried Over Tasks: X` / `- New Tasks: Y` counters update automatically whenever you edit a note. |
| **Command palette** | *Create Daily Log* — creates today's note with all automation applied. |
| | *Add New Task* — prompts for task text and inserts it under "New Tasks". |
| **Settings** | Configure folder path, toggle carry-over, origin tracking, and auto-statistics independently. |

---

## Daily Note Structure

```markdown
#dailynotes

- Carried Over Tasks: 2
- New Tasks: 0

## Carried Over Tasks

- [ ] Contact M. Sari 🔄 From 2026-06-02
- [ ] Finish thesis topic 🔄 From 2026-06-02

## New Tasks

## Journal
```

---

## Installation

### Manual (recommended for development)

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. Copy these files into your vault's plugin directory:
   ```
   <vault>/.obsidian/plugins/daily-log-automator/
   ├── main.js
   ├── manifest.json
   ```
5. Open Obsidian → Settings → Community Plugins → Enable "Daily Log Automator".

### From a release (when published)

1. Download `main.js` and `manifest.json` from the latest release.
2. Place them in `<vault>/.obsidian/plugins/daily-log-automator/`.
3. Enable the plugin in Obsidian settings.

---

## Build Instructions

```bash
# Install dependencies
npm install

# Development build (watches for changes)
npm run dev

# Production build
npm run build

# Type-check only
npm run lint
```

---

## Usage

### Create Daily Log

1. Open the command palette (`Ctrl/Cmd + P`).
2. Search for **"Daily Log Automator: Create Daily Log"**.
3. The plugin creates `<Daily Log Folder>/YYYY-MM-DD.md` with:
   - Unfinished tasks carried over from the previous note.
   - Empty "New Tasks" and "Journal" sections.
   - Accurate counters.

### Add New Task

1. Open the command palette.
2. Search for **"Daily Log Automator: Add New Task"**.
3. Enter the task description in the modal.
4. The task is inserted under "## New Tasks" and counters update automatically.

### Settings

Navigate to **Settings → Daily Log Automator** to configure:

| Setting | Default | Description |
|---|---|---|
| Daily Log Folder | `Daily Log` | Vault folder for daily notes |
| Enable Automatic Carry Over | ON | Transfer unchecked tasks from previous note |
| Enable Task Origin Tracking | ON | Append `🔄 From YYYY-MM-DD` annotations |
| Enable Auto Statistics | ON | Auto-update task counters on edit |

---

## Task Detection Rules

| Pattern | Meaning |
|---|---|
| `- [ ] Task text` | Unchecked / unfinished task |
| `- [x] Task text` | Completed task (not carried over) |

---

## Architecture

```
src/
├── main.ts                    # Plugin entry point, commands, event hooks
├── types.ts                   # Shared interfaces & default settings
├── settings.ts                # Re-exports for convenience
├── settingsTab.ts             # Obsidian settings pane UI
└── services/
    ├── taskParser.ts          # Extracts tasks from markdown content
    ├── taskCarryOver.ts       # Finds previous note & formats carry-over
    ├── noteGenerator.ts       # Builds new daily note markdown
    └── statisticsUpdater.ts   # Recomputes & rewrites counter lines
```

The service-based architecture makes it straightforward to add future modules (daily metrics, habit tracking, weekly/monthly reviews, goal tracking) without touching the core plugin wiring.

---

## Testing Checklist

### Setup
- [ ] Plugin loads without errors in Obsidian.
- [ ] Settings tab appears and all toggles work.
- [ ] Changing the folder setting persists after restart.

### Create Daily Log
- [ ] Creates note with correct YYYY-MM-DD filename.
- [ ] Note contains `#dailynotes` tag.
- [ ] Counters are accurate on creation.
- [ ] Tasks from the previous note are carried over.
- [ ] Origin dates (`🔄 From`) are appended correctly.
- [ ] Existing origin dates are preserved (not overwritten).
- [ ] Running the command twice opens the existing note (no duplicates).
- [ ] Works correctly when no previous note exists.
- [ ] Works correctly when previous note has no tasks.

### Add New Task
- [ ] Task is inserted under "## New Tasks" section.
- [ ] "New Tasks" counter updates immediately.
- [ ] Shows error if today's note doesn't exist yet.
- [ ] Empty input is rejected.

### Auto-Statistics
- [ ] Manually adding a task under "Carried Over Tasks" updates the counter.
- [ ] Manually adding a task under "New Tasks" updates the counter.
- [ ] Completing a task (checking the box) does not change the counter.
- [ ] Deleting a task updates the counter downward.
- [ ] Journal content is never altered by statistics updates.

### Edge Cases
- [ ] Works with non-consecutive dates (gaps in daily notes).
- [ ] Handles empty Daily Log folder gracefully.
- [ ] Handles missing folder gracefully (creates it).
- [ ] Handles notes that don't follow the template structure.

---

## Future Extensibility

This plugin is v1. Planned modules include:

- Daily metrics & mood tracking
- Habit tracker integration
- Weekly review generation
- Monthly review generation
- Goal tracking & progress dashboards

Each module will be added as a new service under `src/services/` with its own types, keeping the core plugin lean.

---

## License

MIT
