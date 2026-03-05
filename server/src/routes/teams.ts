import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getPool } from '../db/pool';
import { jwtAuth, JwtPayload } from '../middleware/jwt';

const router = Router();
router.use(jwtAuth);

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['manager', 'lead', 'developer']).default('developer'),
  subTeam: z.string().max(100).optional(),
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.post('/', async (req: Request, res: Response) => {
  const { userId, role } = res.locals.user as JwtPayload;
  if (role !== 'manager') { res.status(403).json({ error: 'Only managers can create teams' }); return; }

  const { name, color } = CreateTeamSchema.parse(req.body);
  const slug = slugify(name) + '-' + randomUUID().slice(0, 6);
  const apiKey = `ct_${randomUUID().replace(/-/g, '')}`;

  const { rows } = await getPool().query(
    `INSERT INTO teams (name, slug, owner_id, api_key, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, slug, api_key, color`,
    [name, slug, userId, apiKey, color ?? '#4A90D9'],
  );

  const team = rows[0];

  await getPool().query(
    'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
    [team.id, userId, 'manager'],
  );

  res.status(201).json(team);
});

router.get('/', async (req: Request, res: Response) => {
  const { userId } = res.locals.user as JwtPayload;

  const { rows } = await getPool().query(
    `SELECT t.id, t.name, t.slug, t.color, t.api_key, tm.role AS my_role,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
     ORDER BY t.name`,
    [userId],
  );

  res.json({ teams: rows });
});

router.get('/:slug', async (req: Request, res: Response) => {
  const { userId } = res.locals.user as JwtPayload;
  const { slug } = req.params;

  const { rows: teams } = await getPool().query(
    `SELECT t.*, tm.role AS my_role
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
     WHERE t.slug = $2`,
    [userId, slug],
  );

  if (teams.length === 0) { res.status(404).json({ error: 'Team not found' }); return; }

  const team = teams[0];

  const { rows: members } = await getPool().query(
    `SELECT u.id, u.display_name, u.trigram, u.avatar_config, u.user_id_hash, tm.role, tm.sub_team
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.role, u.display_name`,
    [team.id],
  );

  res.json({ ...team, members });
});

router.post('/:slug/members', async (req: Request, res: Response) => {
  const { userId } = res.locals.user as JwtPayload;
  const { slug } = req.params;
  const { email, role, subTeam } = AddMemberSchema.parse(req.body);

  const { rows: teams } = await getPool().query(
    `SELECT t.id FROM teams t
     JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
     WHERE t.slug = $2 AND tm.role IN ('manager', 'lead')`,
    [userId, slug],
  );

  if (teams.length === 0) { res.status(403).json({ error: 'Not authorized to manage this team' }); return; }

  const { rows: users } = await getPool().query('SELECT id FROM users WHERE email = $1', [email]);
  if (users.length === 0) { res.status(404).json({ error: 'User not found — they must register first' }); return; }

  await getPool().query(
    `INSERT INTO team_members (team_id, user_id, role, sub_team)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3, sub_team = $4`,
    [teams[0].id, users[0].id, role, subTeam ?? null],
  );

  res.json({ ok: true });
});

export default router;
