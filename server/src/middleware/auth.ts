import { Request, Response, NextFunction } from 'express';
import { Config } from '../config';

/**
 * Validates the X-API-Key header against the configured key→team mapping.
 * On success, attaches teamId to res.locals for downstream handlers.
 */
export function apiKeyAuth(config: Config) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.header('X-API-Key');

    if (!key) {
      res.status(401).json({ error: 'Missing X-API-Key header' });
      return;
    }

    const teamId = config.apiKeys.get(key);
    if (!teamId) {
      res.status(403).json({ error: 'Invalid API key' });
      return;
    }

    res.locals.teamId = teamId;
    next();
  };
}
