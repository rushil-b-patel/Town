import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { signToken, jwtAuth, JwtPayload } from '../middleware/jwt';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
  trigram: z.string().length(3).toUpperCase().optional(),
  role: z.enum(['developer', 'manager']),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName, trigram, role } = RegisterSchema.parse(req.body);

  const existing = await getPool().query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const tri = trigram || displayName.slice(0, 3).toUpperCase();

  const { rows } = await getPool().query(
    `INSERT INTO users (email, password_hash, display_name, trigram, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, display_name, trigram, role`,
    [email, hash, displayName, tri, role],
  );

  const user = rows[0];
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.display_name, trigram: user.trigram, role: user.role } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = LoginSchema.parse(req.body);

  const { rows } = await getPool().query(
    'SELECT id, email, password_hash, display_name, trigram, role, avatar_config FROM users WHERE email = $1',
    [email],
  );

  if (rows.length === 0) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name, trigram: user.trigram, role: user.role, avatarConfig: user.avatar_config } });
});

router.get('/me', jwtAuth, async (req: Request, res: Response) => {
  const { userId } = res.locals.user as JwtPayload;

  const { rows } = await getPool().query(
    'SELECT id, email, display_name, trigram, role, avatar_config, user_id_hash FROM users WHERE id = $1',
    [userId],
  );

  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

  const u = rows[0];
  res.json({ id: u.id, email: u.email, displayName: u.display_name, trigram: u.trigram, role: u.role, avatarConfig: u.avatar_config, userIdHash: u.user_id_hash });
});

export default router;
