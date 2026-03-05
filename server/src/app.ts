import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { Config } from './config';
import { apiKeyAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import ingestRouter from './routes/ingest';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';

export function createApp(config: Config): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Public auth routes (no API key or JWT required).
  app.use('/api/auth', authRouter);

  // Dashboard routes (JWT auth — used by the web UI).
  app.use('/api/teams', teamsRouter);

  // Extension routes (API key auth — used by the VS Code extension).
  app.use('/api/events', apiKeyAuth(config), ingestRouter);
  app.use('/api/analytics', apiKeyAuth(config), analyticsRouter);

  app.use(errorHandler);

  return app;
}
