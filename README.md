# OP — Obsidian Plugins

A monorepo for custom Obsidian plugins powering a personal OS workflow.

## Plugins

| Plugin | Description | Status |
|---|---|---|
| [daily-log-automator](./daily-log-automator/) | Auto-creates daily logs, carries forward unfinished tasks, maintains task statistics | v1.0.0 |

## Structure

Each plugin lives in its own directory with its own `package.json`, build pipeline, and `manifest.json`.

```
OP/
├── daily-log-automator/    # Plugin: Daily Log Automator
│   ├── src/
│   ├── manifest.json
│   └── package.json
└── ...                     # Future plugins
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Bleyx/OP.git
cd OP

# Build a specific plugin
cd daily-log-automator
npm install
npm run build
```

Then copy `main.js` and `manifest.json` into your vault's `.obsidian/plugins/<plugin-id>/` directory.
