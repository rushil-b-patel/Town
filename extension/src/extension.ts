import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';
import { sha256 } from './hash';
import { getConfig, onConfigChange } from './config';
import { Storage } from './storage';
import { IdleManager } from './idleManager';
import { SessionManager } from './sessionManager';
import { EventQueue } from './eventQueue';
import { Tracker } from './tracker';
import { Uploader } from './uploader';
import { ActivityEvent } from './types';
import { logger } from './logger';

const CONSENT_KEY = 'codetown.consentGiven';
const USER_ID_KEY = 'codetown.userId';

let tracker: Tracker | undefined;
let uploader: Uploader | undefined;
let storage: Storage | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let statusBarTimer: ReturnType<typeof setInterval> | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger.debug('CodeTown Tracker activating…');

  // --- Consent gate ---
  const consentResult = await ensureConsent(context);
  if (!consentResult) {
    logger.debug('Tracking not enabled — activation aborted');
    registerManagementCommands(context);
    return;
  }

  if (!getConfig().enabled) {
    logger.debug('codetown.enabled is false — activation aborted');
    registerManagementCommands(context);
    return;
  }

  // --- Output Channel (live event log visible in Output panel) ---
  outputChannel = vscode.window.createOutputChannel('CodeTown');
  outputChannel.appendLine('CodeTown Tracker started');
  outputChannel.appendLine('─'.repeat(70));

  // --- Core initialization ---
  const userIdHash = await getOrCreateUserIdHash(context);

  try {
    storage = await Storage.create(context.globalStorageUri.fsPath);
  } catch (err) {
    logger.error('Failed to initialize SQLite storage — aborting', err);
    vscode.window.showErrorMessage(
      'CodeTown: Failed to initialize local database. Tracking is disabled.',
    );
    return;
  }

  const idleManager = new IdleManager();
  const sessionManager = new SessionManager();
  const eventQueue = new EventQueue();

  tracker = new Tracker(idleManager, sessionManager, eventQueue, storage, userIdHash);

  // --- Live event logging to Output Channel ---
  tracker.onEvent((event: ActivityEvent) => {
    const time = new Date(event.ts).toLocaleTimeString();
    const type = event.type.toUpperCase().padEnd(22);
    const lang = event.language.padEnd(14);
    const idle = event.idle ? 'IDLE' : 'ACTIVE';
    outputChannel!.appendLine(
      `[${time}]  ${type} lang=${lang} ${idle}   session=${event.session_id.slice(0, 8)}…`,
    );
  });

  tracker.start();

  uploader = new Uploader(eventQueue, storage);
  uploader.start();

  // --- Status Bar Item ---
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0,
  );
  statusBarItem.command = 'codetown.showOutput';
  statusBarItem.tooltip = 'Click to open CodeTown event log';
  updateStatusBar(tracker, idleManager, sessionManager);
  statusBarItem.show();

  statusBarTimer = setInterval(() => {
    if (tracker) {
      updateStatusBar(tracker, idleManager, sessionManager);
    }
  }, 3000);

  // --- Configuration hot-reload ---
  const configWatcher = onConfigChange(() => {
    logger.debug('Configuration changed');
    if (!getConfig().enabled && tracker) {
      logger.debug('Tracking disabled via settings — tearing down');
      teardown();
    }
  });

  // --- Commands ---
  context.subscriptions.push(
    configWatcher,
    outputChannel,

    vscode.commands.registerCommand('codetown.showOutput', () => {
      outputChannel?.show(true);
    }),

    vscode.commands.registerCommand('codetown.showStatus', () => {
      const queueSize = eventQueue.size();
      const sid = sessionManager.getSessionId().slice(0, 8);
      const sprints = sessionManager.getCompletedSprints().length;
      const total = tracker?.getTotalEventCount() ?? 0;
      const idle = idleManager.isIdle() ? 'idle' : 'active';
      const dbStats = storage?.getStats();

      vscode.window.showInformationMessage(
        `CodeTown: session=${sid}… | state=${idle} | ` +
        `events(session)=${total} | queued=${queueSize} | ` +
        `db(total=${dbStats?.total ?? 0}, pending=${dbStats?.pending ?? 0}) | ` +
        `sprints=${sprints}`,
      );
    }),

    vscode.commands.registerCommand('codetown.showRecentEvents', () => {
      if (!storage || !outputChannel) return;

      const rows = storage.getRecentEvents(50);
      outputChannel.appendLine('');
      outputChannel.appendLine('═'.repeat(70));
      outputChannel.appendLine(`  RECENT EVENTS (last ${rows.length} from database)`);
      outputChannel.appendLine('═'.repeat(70));

      if (rows.length === 0) {
        outputChannel.appendLine('  (no events recorded yet)');
      }

      for (const row of rows.reverse()) {
        const time = new Date(row.ts).toLocaleTimeString();
        const date = new Date(row.ts).toLocaleDateString();
        const type = String(row.type).toUpperCase().padEnd(22);
        const lang = String(row.language).padEnd(14);
        const idle = row.idle === 1 ? 'IDLE' : 'ACTIVE';
        const uploaded = row.uploaded === 1 ? 'uploaded' : 'PENDING';
        outputChannel.appendLine(
          `  [${date} ${time}]  ${type} lang=${lang} ${idle}  ${uploaded}  session=${String(row.session_id).slice(0, 8)}…`,
        );
      }

      outputChannel.appendLine('═'.repeat(70));
      outputChannel.show(true);
    }),

    vscode.commands.registerCommand('codetown.toggleTracking', async () => {
      const current = context.globalState.get<boolean>(CONSENT_KEY, true);
      const next = !current;
      await context.globalState.update(CONSENT_KEY, next);
      vscode.window.showInformationMessage(
        `CodeTown tracking ${next ? 'enabled' : 'disabled'}. Reload to apply.`,
      );
    }),

    vscode.commands.registerCommand('codetown.resetConsent', async () => {
      await context.globalState.update(CONSENT_KEY, undefined);
      vscode.window.showInformationMessage(
        'CodeTown consent reset. You will be prompted on next activation.',
      );
    }),
  );

  context.subscriptions.push({ dispose: () => teardown() });

  logger.debug('CodeTown Tracker activated successfully');
  outputChannel.appendLine('Ready — events will appear here as you code.\n');
}

export async function deactivate(): Promise<void> {
  await shutdown();
}

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------

function updateStatusBar(
  t: Tracker,
  idle: IdleManager,
  session: SessionManager,
): void {
  if (!statusBarItem) return;
  const count = t.getTotalEventCount();
  const lang = t.getLastLanguage();
  const state = idle.isIdle() ? '$(debug-pause) idle' : '$(pulse) active';
  const sprints = session.getCompletedSprints().length;
  statusBarItem.text = `$(telescope) CodeTown: ${count} events | ${lang} | ${state}${sprints > 0 ? ` | ${sprints} sprints` : ''}`;
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

async function ensureConsent(
  context: vscode.ExtensionContext,
): Promise<boolean> {
  const stored = context.globalState.get<boolean>(CONSENT_KEY);
  if (stored !== undefined) return stored;

  const choice = await vscode.window.showInformationMessage(
    'CodeTown Tracker collects anonymized coding activity data:\n\n' +
      '• Active time and idle detection\n' +
      '• Programming language usage\n' +
      '• Session duration and coding streaks\n\n' +
      'NO file contents, file names, or code are ever collected.\n' +
      'All identifiers are SHA-256 hashed.\n\n' +
      'Would you like to enable tracking?',
    { modal: true },
    'Enable',
    'Disable',
  );

  const granted = choice === 'Enable';
  await context.globalState.update(CONSENT_KEY, granted);
  return granted;
}

async function getOrCreateUserIdHash(
  context: vscode.ExtensionContext,
): Promise<string> {
  let raw = context.globalState.get<string>(USER_ID_KEY);
  if (!raw) {
    raw = randomUUID();
    await context.globalState.update(USER_ID_KEY, raw);
  }
  return sha256(raw);
}

function registerManagementCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('codetown.showStatus', () => {
      vscode.window.showInformationMessage('CodeTown: Tracking is currently disabled.');
    }),
    vscode.commands.registerCommand('codetown.showOutput', () => {
      vscode.window.showInformationMessage('CodeTown: Tracking is currently disabled.');
    }),
    vscode.commands.registerCommand('codetown.showRecentEvents', () => {
      vscode.window.showInformationMessage('CodeTown: Tracking is currently disabled.');
    }),
    vscode.commands.registerCommand('codetown.toggleTracking', async () => {
      const current = context.globalState.get<boolean>(CONSENT_KEY, false);
      await context.globalState.update(CONSENT_KEY, !current);
      vscode.window.showInformationMessage(
        `CodeTown tracking ${!current ? 'enabled' : 'disabled'}. Reload to apply.`,
      );
    }),
    vscode.commands.registerCommand('codetown.resetConsent', async () => {
      await context.globalState.update(CONSENT_KEY, undefined);
      vscode.window.showInformationMessage(
        'CodeTown consent reset. You will be prompted on next activation.',
      );
    }),
  );
}

function teardown(): void {
  if (statusBarTimer) {
    clearInterval(statusBarTimer);
    statusBarTimer = undefined;
  }
  statusBarItem?.dispose();
  statusBarItem = undefined;
  tracker?.dispose();
  tracker = undefined;
  uploader?.dispose();
  uploader = undefined;
  storage?.close();
  storage = undefined;
}

async function shutdown(): Promise<void> {
  try {
    if (statusBarTimer) {
      clearInterval(statusBarTimer);
      statusBarTimer = undefined;
    }
    statusBarItem?.dispose();
    statusBarItem = undefined;
    tracker?.dispose();
    tracker = undefined;
    await uploader?.flush();
    uploader?.dispose();
    uploader = undefined;
    storage?.close();
    storage = undefined;
    logger.debug('CodeTown Tracker deactivated');
  } catch (err) {
    logger.error('Error during shutdown', err);
  }
}
