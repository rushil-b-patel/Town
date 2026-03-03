import { getConfig } from './config';

const PREFIX = '[CodeTown]';

/**
 * Internal debug logger.
 * Outputs only when `codetown.debug` is enabled.
 * Errors always log (without PII) to aid post-mortem diagnosis.
 */
class Logger {
  private get isDebug(): boolean {
    try {
      return getConfig().debug;
    } catch {
      return false;
    }
  }

  debug(msg: string, ...args: unknown[]): void {
    if (this.isDebug) {
      console.log(`${PREFIX} ${msg}`, ...args);
    }
  }

  warn(msg: string, ...args: unknown[]): void {
    if (this.isDebug) {
      console.warn(`${PREFIX} WARN ${msg}`, ...args);
    }
  }

  /**
   * Errors are always logged regardless of debug flag.
   * Callers must ensure no PII reaches this method.
   */
  error(msg: string, err?: unknown): void {
    const detail = err instanceof Error ? err.message : String(err ?? '');
    console.error(`${PREFIX} ERROR ${msg}`, detail);
  }
}

export const logger = new Logger();
