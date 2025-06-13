import { Context, Next } from 'hono';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

export async function rateLimitMiddleware(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const now = Date.now();

  const userLimit = requestCounts.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    userLimit.count++;
    if (userLimit.count > MAX_REQUESTS) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    requestCounts.set(ip, userLimit);
  }

  await next();
}