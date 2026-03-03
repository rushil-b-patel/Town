import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';
import { sha256 } from './hash';
import { ActivityEvent, EventType } from './types';
import { IdleManager } from './idleManager';
import { SessionManager } from './sessionManager';
import { EventQueue } from './eventQueue';
import { Storage } from './storage';
import { getConfig } from './config';
import { logger } from './logger';

/**
 * Minimum interval between persisted edit events for the same editing session.
 * Prevents flooding the queue during rapid typing while still capturing intent.
 */
const EDIT_DEBOUNCE_MS = 2000;

/**
 * Registers all VS Code workspace/window listeners and translates them
 * into normalized ActivityEvent objects.
 *
 * Privacy contract:
 * - File paths are SHA-256 hashed before leaving this module.
 * - No file content, names, or git metadata is ever captured.
 * - Repository roots are hashed identically so the backend can correlate
 *   events within a project without knowing which project it is.
 */
export type EventListener = (event: ActivityEvent) => void;

export class Tracker {
  private disposables: vscode.Disposable[] = [];
  private editDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly userIdHash: string;
  private eventListeners: EventListener[] = [];
  private totalEventCount: number = 0;
  private lastLanguage: string = 'none';

  constructor(
    private readonly idleManager: IdleManager,
    private readonly sessionManager: SessionManager,
    private readonly eventQueue: EventQueue,
    private readonly storage: Storage,
    userIdHash: string,
  ) {
    this.userIdHash = userIdHash;
  }

  /** Subscribe to every event the tracker produces. */
  onEvent(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  getTotalEventCount(): number {
    return this.totalEventCount;
  }

  getLastLanguage(): string {
    return this.lastLanguage;
  }

  /** Wire up all VS Code event subscriptions. */
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

  /**
   * Debounce rapid edit events. Only the trailing edge fires,
   * so we capture that the user *was* editing without recording
   * every keystroke.
   */
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

      const event: ActivityEvent = {
        id: randomUUID(),
        session_id: this.sessionManager.getSessionId(),
        user_id_hash: this.userIdHash,
        team_id: getConfig().teamId || undefined,
        ts: Date.now(),
        type,
        language: document?.languageId ?? 'unknown',
        repo_hash: this.hashRepoRoot(document),
        file_hash: this.hashFilePath(document),
        idle: this.idleManager.isIdle(),
      };

      this.eventQueue.push(event);
      this.storage.insertEvent(event);

      this.totalEventCount++;
      this.lastLanguage = event.language;

      for (const listener of this.eventListeners) {
        try { listener(event); } catch { /* listener must not break the tracker */ }
      }

      logger.debug(
        `Event: type=${type} lang=${event.language} idle=${event.idle}`,
      );
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
