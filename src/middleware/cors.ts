import { Context, Next } from 'hono';

export async function corsMiddleware(c: Context, next: Next) {
  // Set CORS headers
  c.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  await next();
}