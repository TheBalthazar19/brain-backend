import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService } from '../lib/auth';
import { authMiddleware } from '../middleware/auth';

const authRoutes = new Hono();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  try {
    const { email, password, name } = c.req.valid('json');
    
    const user = await AuthService.createUser(email, password, name);
    const token = AuthService.generateToken(user.id);

    return c.json({
      user,
      token,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    
    const result = await AuthService.authenticateUser(email, password);

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

authRoutes.get('/session', authMiddleware, async (c) => {
    const a = new Map() as Map<string, unknown>; 

    const user = a.get("user") as { id: string; email: string; name: string };
    
  return c.json({ user });
});

export { authRoutes };
