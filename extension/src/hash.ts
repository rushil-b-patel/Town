import { createHash } from 'node:crypto';

/**
 * Produces a deterministic SHA-256 hex digest.
 * Used to anonymize file paths, repo roots, and user IDs
 * so that no plaintext PII is ever stored or transmitted.
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
