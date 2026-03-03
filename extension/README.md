# CodeTown Tracker

Privacy-respecting developer coding activity tracker for VS Code.

Tracks active time, language usage, sessions, streaks, and sprints — without ever logging file contents, file names, or code.

## What Is Collected

| Data Point | How It's Stored |
|---|---|
| Active/idle time | Timestamp only |
| Language (e.g. TypeScript) | Plaintext language ID |
| File identity | SHA-256 hash of full path |
| Repository identity | SHA-256 hash of workspace root |
| User identity | SHA-256 hash of a locally generated UUID |
| Session & sprint info | Computed from event timestamps |

**Never collected:** file contents, file names, code text, git commit messages, or any other PII.

## Architecture

```
src/
  extension.ts       — Activation, consent, orchestration
  tracker.ts         — VS Code event listeners, hashing
  sessionManager.ts  — Session lifecycle & sprint detection
  idleManager.ts     — Idle state machine
  eventQueue.ts      — In-memory event buffer
  storage.ts         — SQLite persistence via sql.js (WASM)
  uploader.ts        — Batched upload with gzip & retry
  config.ts          — VS Code settings reader
  types.ts           — TypeScript interfaces
  logger.ts          — Debug-only logger
  hash.ts            — SHA-256 utility
```

## Prerequisites

- Node.js 18+
- npm 9+

## Installation & Development

```bash
# Clone and install
cd town
npm install

# Compile (also copies sql-wasm.wasm to dist/)
npm run compile

# Watch mode (auto-recompile on save)
npm run watch
```

## Testing Locally

1. Open this folder in VS Code.
2. Press **F5** to launch an Extension Development Host.
3. Open a file and start editing — the extension activates on startup.
4. Open the developer console (`Help → Toggle Developer Tools`) to see debug output.
5. Enable debug logging: set `codetown.debug` to `true` in settings.
6. Run **CodeTown: Show Tracking Status** from the command palette.

## Building a VSIX

```bash
# Compile + package
npm run compile
npx @vscode/vsce package --no-dependencies

# The .vsix file will appear in the project root
```

Install the VSIX:
```bash
code --install-extension codetown-tracker-1.0.0.vsix
```

## Configuration

All settings live under `codetown.*` in VS Code settings:

| Setting | Type | Default | Description |
|---|---|---|---|
| `codetown.enabled` | boolean | `true` | Master switch for tracking |
| `codetown.serverUrl` | string | `""` | Backend API URL (HTTPS required in production) |
| `codetown.teamId` | string | `""` | Team identifier for grouping |
| `codetown.idleThreshold` | number | `120` | Seconds before user is idle |
| `codetown.uploadInterval` | number | `30` | Seconds between upload attempts |
| `codetown.debug` | boolean | `false` | Enable debug console logging |

## Commands

| Command | Description |
|---|---|
| `CodeTown: Show Tracking Status` | Display current session, queue size, sprint count |
| `CodeTown: Toggle Tracking` | Enable/disable tracking (requires reload) |
| `CodeTown: Reset Consent` | Clear consent decision; re-prompts on next activation |

## Backend API Contract

The extension POSTs to `{serverUrl}/api/events/batch`:

```json
{
  "events": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "user_id_hash": "sha256-hex",
      "team_id": "optional-string",
      "ts": 1709500000000,
      "type": "edit|save|focus|blur|active_editor_change",
      "language": "typescript",
      "repo_hash": "sha256-hex",
      "file_hash": "sha256-hex",
      "idle": false
    }
  ]
}
```

- Payload is gzip-compressed (`Content-Encoding: gzip`).
- Expects HTTP 2xx for success.
- On failure, retries with exponential backoff (1s → 5min cap).

## Suggested Improvements for v2

- **Status bar item** showing live session time and sprint indicator.
- **Weekly summary notification** with hours coded, top languages, longest sprint.
- **Team dashboard integration** — push sprint/session summaries, not raw events.
- **Workspace trust API** — only track in trusted workspaces.
- **Telemetry opt-in levels** — basic (time only) vs. detailed (language + repo).
- **Event deduplication** across multiple VS Code windows sharing the same SQLite DB.
- **Server-side sprint aggregation** for cross-device sprint continuity.
- **Extension test suite** with mocked VS Code API and in-memory SQLite.
- **Rate limiting** on the upload path to protect the backend.
- **Encryption at rest** for the local SQLite database.
