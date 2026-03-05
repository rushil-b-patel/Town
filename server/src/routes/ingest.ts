import { Router, Request, Response } from 'express';
import { getPool } from '../db/pool';
import { BatchPayloadSchema } from '../types';

const router = Router();

/**
 * POST /api/events/batch
 *
 * Accepts a batch of up to 200 activity events from the extension.
 * The extension sends gzip-compressed JSON; Express handles decompression.
 * Events are validated with Zod, then bulk-inserted into raw_events.
 *
 * The team_id on each event is overridden by the authenticated team
 * from the API key — extensions cannot spoof team membership.
 */
router.post('/batch', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const parsed = BatchPayloadSchema.parse(req.body);

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const stmt = `
      INSERT INTO raw_events
        (id, session_id, user_id_hash, team_id, ts, type, language, repo_hash, file_hash, idle, mode)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO NOTHING
    `;

    for (const e of parsed.events) {
      await client.query(stmt, [
        e.id, e.session_id, e.user_id_hash, teamId,
        e.ts, e.type, e.language, e.repo_hash, e.file_hash,
        e.idle, e.mode,
      ]);
    }

    await client.query('COMMIT');
    res.json({ accepted: parsed.events.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
