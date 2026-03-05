import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';
import { sha256 } from './hash';
import { ActivityEvent, DeveloperMode, EventType } from './types';
import { IdleManager } from './idleManager';
import { SessionManager } from './sessionManager';
import { LearningDetector } from './learningDetector';
import { EventQueue } from './eventQueue';
import { Storage } from './storage';
import { getConfig } from './config';
import { logger } from './logger';

const EDIT_DEBOUNCE_MS = 2000;

/**
 * Registers VS Code workspace/window listeners and translates them
 * into normalized, privacy-safe ActivityEvent objects.
 *
 * Privacy contract:
 *  - File paths → SHA-256 hash
 *  - Repo roots → SHA-256 hash
 *  - No file content, names, or git metadata ever captured
 */
export class Tracker {
  private disposables: vscode.Disposable[] = [];
  private editDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly userIdHash: string;
  private readonly learningDetector: LearningDetector;
  private totalEventCount = 0;
  private lastLanguage = 'none';

  constructor(
    private readonly idleManager: IdleManager,
    private readonly sessionManager: SessionManager,
    private readonly eventQueue: EventQueue,
    private readonly storage: Storage,
    userIdHash: string,
  ) {
    this.userIdHash = userIdHash;
    this.learningDetector = new LearningDetector();
  }

  start(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.contentChanges.length === 0) return;
        this.idleManager.recordActivity();
        this.debouncedEdit(e.document);
      }),

      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.idleManager.recordActivity();
        this.emit('save', doc);
      }),

      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.idleManager.setHasActiveEditor(!!editor);
        if (editor) {
          this.idleManager.recordActivity();
          this.emit('active_editor_change', editor.document);
        }
      }),

      vscode.window.onDidChangeWindowState((state) => {
        this.idleManager.setWindowFocused(state.focused);
        this.emit(
          state.focused ? 'focus' : 'blur',
          vscode.window.activeTextEditor?.document,
        );
      }),
    );

    this.idleManager.setHasActiveEditor(!!vscode.window.activeTextEditor);
    this.idleManager.setWindowFocused(vscode.window.state.focused);

    logger.debug('Tracker started');
  }

  getTotalEventCount(): number {
    return this.totalEventCount;
  }

  getLastLanguage(): string {
    return this.lastLanguage;
  }

  getDeveloperMode(): DeveloperMode {
    return this.learningDetector.getMode();
  }

  getLearningDetector(): LearningDetector {
    return this.learningDetector;
  }

  private debouncedEdit(document: vscode.TextDocument): void {
    if (this.editDebounceTimer) {
      clearTimeout(this.editDebounceTimer);
    }
    this.editDebounceTimer = setTimeout(() => {
      this.emit('edit', document);
      this.editDebounceTimer = null;
    }, EDIT_DEBOUNCE_MS);
  }

  private emit(type: EventType, document?: vscode.TextDocument): void {
    if (!getConfig().enabled) return;

    try {
      this.sessionManager.recordEvent();

      const isIdle = this.idleManager.isIdle();
      const fileHash = this.hashFilePath(document);

      this.learningDetector.recordEvent(type, fileHash, isIdle);

      const event: ActivityEvent = {
        id: randomUUID(),
        session_id: this.sessionManager.getSessionId(),
        user_id_hash: this.userIdHash,
        team_id: getConfig().teamId || undefined,
        ts: Date.now(),
        type,
        language: document?.languageId ?? 'unknown',
        repo_hash: this.hashRepoRoot(document),
        file_hash: fileHash,
        idle: isIdle,
        mode: this.learningDetector.getMode(),
      };

      this.eventQueue.push(event);
      this.storage.insertEvent(event);

      this.totalEventCount++;
      this.lastLanguage = event.language;

      logger.debug(`Event: ${type} lang=${event.language} mode=${event.mode}`);
    } catch (err) {
      logger.error('Failed to emit event', err);
    }
  }

  private hashRepoRoot(document?: vscode.TextDocument): string {
    if (!document) return sha256('unknown');
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    return folder ? sha256(folder.uri.fsPath) : sha256('no-workspace');
  }

  private hashFilePath(document?: vscode.TextDocument): string {
    if (!document) return sha256('unknown');
    return sha256(document.uri.fsPath);
  }

  dispose(): void {
    if (this.editDebounceTimer) {
      clearTimeout(this.editDebounceTimer);
      this.editDebounceTimer = null;
    }
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    logger.debug('Tracker disposed');
  }
}
