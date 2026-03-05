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
import { logger } from './logger';

const CONSENT_KEY = 'codetown.consentGiven';
const USER_ID_KEY = 'codetown.userId';
const STATUS_BAR_INTERVAL_MS = 3000;

let tracker: Tracker | undefined;
let uploader: Uploader | undefined;
let storage: Storage | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let statusBarTimer: ReturnType<typeof setInterval> | undefined;

// ── Activation ──────────────────────────────────────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger.debug('Activating');

  const consent = await ensureConsent(context);
  if (!consent || !getConfig().enabled) {
    registerDisabledCommands(context);
    return;
  }

  const userIdHash = await getOrCreateUserIdHash(context);

  try {
    storage = await Storage.create(context.globalStorageUri.fsPath);
  } catch (err) {
    logger.error('Storage init failed', err);
    vscode.window.showErrorMessage('CodeTown: Failed to initialize database.');
    return;
  }

  const idleManager = new IdleManager();
  const sessionManager = new SessionManager();
  const eventQueue = new EventQueue();

  tracker = new Tracker(idleManager, sessionManager, eventQueue, storage, userIdHash);
  tracker.start();

  uploader = new Uploader(eventQueue, storage);
  uploader.start();

  // ── Status bar ──

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.command = 'codetown.showStatus';
  statusBarItem.tooltip = 'CodeTown Tracker — click for details';
  refreshStatusBar(tracker, idleManager);
  statusBarItem.show();

  statusBarTimer = setInterval(() => {
    if (tracker) refreshStatusBar(tracker, idleManager);
  }, STATUS_BAR_INTERVAL_MS);

  // ── Config hot-reload ──

  const configWatcher = onConfigChange(() => {
    if (!getConfig().enabled && tracker) teardown();
  });

  // ── Commands ──

  context.subscriptions.push(
    configWatcher,

    vscode.commands.registerCommand('codetown.showStatus', () => {
      if (!tracker || !storage) return;

      const dbStats = storage.getStats();
      const metrics = tracker.getLearningDetector().getMetrics();
      const sprints = sessionManager.getCompletedSprints();
      const sid = sessionManager.getSessionId().slice(0, 8);

      const lines = [
        `Session: ${sid}…`,
        `Mode: ${metrics.mode}`,
        `Events this session: ${tracker.getTotalEventCount()}`,
        `DB total: ${dbStats.total} | pending upload: ${dbStats.pending}`,
        `Sprints completed: ${sprints.length}`,
        ``,
        `Learning detector (last ${metrics.windowSeconds}s):`,
        `  Tab switch rate: ${metrics.tabSwitchRate}/min`,
        `  Edit rate: ${metrics.editRate}/min`,
        `  Unique files: ${metrics.uniqueFiles}`,
        `  Edit/switch ratio: ${metrics.editToSwitchRatio}`,
      ];

      vscode.window.showInformationMessage(lines.join('\n'), { modal: true });
    }),

    vscode.commands.registerCommand('codetown.showRecentEvents', () => {
      if (!storage) return;

      const channel = vscode.window.createOutputChannel('CodeTown Events');
      const rows = storage.getRecentEvents(50);

      channel.clear();
      channel.appendLine(`Last ${rows.length} events from database`);
      channel.appendLine('─'.repeat(90));

      for (const row of rows.reverse()) {
        const ts = new Date(row.ts).toLocaleString();
        const type = String(row.type).padEnd(22);
        const lang = String(row.language).padEnd(12);
        const mode = String(row.mode ?? 'coding').padEnd(9);
        const idle = row.idle === 1 ? 'idle  ' : 'active';
        const sync = row.uploaded === 1 ? 'synced' : 'pending';
        channel.appendLine(`${ts}  ${type} ${lang} ${mode} ${idle}  ${sync}`);
      }

      channel.appendLine('─'.repeat(90));
      channel.show(true);
    }),

    vscode.commands.registerCommand('codetown.toggleTracking', async () => {
      const current = context.globalState.get<boolean>(CONSENT_KEY, true);
      await context.globalState.update(CONSENT_KEY, !current);
      vscode.window.showInformationMessage(
        `CodeTown tracking ${!current ? 'enabled' : 'disabled'}. Reload to apply.`,
      );
    }),

    vscode.commands.registerCommand('codetown.resetConsent', async () => {
      await context.globalState.update(CONSENT_KEY, undefined);
      vscode.window.showInformationMessage('Consent reset. You will be prompted on next reload.');
    }),
  );

  context.subscriptions.push({ dispose: () => teardown() });
  logger.debug('Activated');
}

export async function deactivate(): Promise<void> {
  await shutdown();
}

// ── Status bar ──────────────────────────────────────────────────────────

const MODE_ICONS: Record<string, string> = {
  coding:   '$(edit)',
  learning: '$(book)',
  idle:     '$(debug-pause)',
};

function refreshStatusBar(t: Tracker, idle: IdleManager): void {
  if (!statusBarItem) return;
  const mode = t.getDeveloperMode();
  const icon = MODE_ICONS[mode] ?? '$(telescope)';
  const count = t.getTotalEventCount();
  const lang = t.getLastLanguage();

  statusBarItem.text = `${icon} CodeTown: ${mode} · ${lang} · ${count} events`;
}

// ── Consent ─────────────────────────────────────────────────────────────

async function ensureConsent(ctx: vscode.ExtensionContext): Promise<boolean> {
  const stored = ctx.globalState.get<boolean>(CONSENT_KEY);
  if (stored !== undefined) return stored;

  const choice = await vscode.window.showInformationMessage(
    'CodeTown Tracker collects anonymized coding activity data:\n\n' +
    '• Active time and idle detection\n' +
    '• Programming language usage\n' +
    '• Session duration, sprints, and learning patterns\n\n' +
    'NO file contents, names, or code are collected.\n' +
    'All identifiers are SHA-256 hashed.\n\n' +
    'Enable tracking?',
    { modal: true },
    'Enable',
    'Disable',
  );

  const granted = choice === 'Enable';
  await ctx.globalState.update(CONSENT_KEY, granted);
  return granted;
}

async function getOrCreateUserIdHash(ctx: vscode.ExtensionContext): Promise<string> {
  let raw = ctx.globalState.get<string>(USER_ID_KEY);
  if (!raw) {
    raw = randomUUID();
    await ctx.globalState.update(USER_ID_KEY, raw);
  }
  return sha256(raw);
}

// ── Disabled-state commands ─────────────────────────────────────────────

function registerDisabledCommands(ctx: vscode.ExtensionContext): void {
  const disabled = () => vscode.window.showInformationMessage('CodeTown tracking is disabled.');
  ctx.subscriptions.push(
    vscode.commands.registerCommand('codetown.showStatus', disabled),
    vscode.commands.registerCommand('codetown.showRecentEvents', disabled),
    vscode.commands.registerCommand('codetown.toggleTracking', async () => {
      const current = ctx.globalState.get<boolean>(CONSENT_KEY, false);
      await ctx.globalState.update(CONSENT_KEY, !current);
      vscode.window.showInformationMessage(
        `Tracking ${!current ? 'enabled' : 'disabled'}. Reload to apply.`,
      );
    }),
    vscode.commands.registerCommand('codetown.resetConsent', async () => {
      await ctx.globalState.update(CONSENT_KEY, undefined);
      vscode.window.showInformationMessage('Consent reset. Reload to be prompted again.');
    }),
  );
}

// ── Lifecycle ───────────────────────────────────────────────────────────

function teardown(): void {
  if (statusBarTimer) { clearInterval(statusBarTimer); statusBarTimer = undefined; }
  statusBarItem?.dispose(); statusBarItem = undefined;
  tracker?.dispose(); tracker = undefined;
  uploader?.dispose(); uploader = undefined;
  storage?.close(); storage = undefined;
}

async function shutdown(): Promise<void> {
  try {
    if (statusBarTimer) { clearInterval(statusBarTimer); statusBarTimer = undefined; }
    statusBarItem?.dispose(); statusBarItem = undefined;
    tracker?.dispose(); tracker = undefined;
    await uploader?.flush();
    uploader?.dispose(); uploader = undefined;
    storage?.close(); storage = undefined;
    logger.debug('Deactivated');
  } catch (err) {
    logger.error('Shutdown error', err);
  }
}
