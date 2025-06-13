import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { corsMiddleware } from './middleware/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { authRoutes } from './routes/auth';
import { memoriesRoutes } from './routes/memories';
import { aiRoutes } from './routes/ai';

// Load environment variables
import 'dotenv/config';

const app = new Hono();

// Global middleware
app.use(logger());
app.use(prettyJSON());
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Memory Assistant API',
    version: '1.0.0',
    status: 'healthy',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.route('/auth', authRoutes);
app.route('/memories', memoriesRoutes);
app.route('/ai', aiRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Memory Assistant Backend starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});