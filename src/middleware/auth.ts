import { Context, Next } from 'hono';
import { AuthService } from '../lib/auth';

export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header('Authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authorization.split(' ')[1];
  const user = await AuthService.getUserFromToken(token);

  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
}