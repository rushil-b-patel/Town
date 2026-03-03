import * as vscode from 'vscode';
import { CodetownConfig } from './types';

const SECTION = 'codetown';

/**
 * Reads the current extension configuration from VS Code settings.
 * Every call reflects the latest user changes — no caching.
 */
export function getConfig(): CodetownConfig {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  return {
    enabled: cfg.get<boolean>('enabled', true),
    serverUrl: cfg.get<string>('serverUrl', ''),
    teamId: cfg.get<string>('teamId', ''),
    idleThreshold: cfg.get<number>('idleThreshold', 120),
    uploadInterval: cfg.get<number>('uploadInterval', 30),
    debug: cfg.get<boolean>('debug', false),
  };
}

/**
 * Subscribes to configuration changes affecting the `codetown` section.
 * Returns a disposable that should be added to `context.subscriptions`.
 */
export function onConfigChange(cb: () => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(SECTION)) {
      cb();
    }
  });
}
