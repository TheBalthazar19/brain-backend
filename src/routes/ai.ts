import { Env, Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { RAGService } from '../lib/rag';

type ContextWithUser = Env & {
  Variables: {
    user: { id: string };
  };
};

const aiRoutes = new Hono<ContextWithUser>();

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20),
}).superRefine((data, ctx) => {
  if (data.limit === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Limit must be defined',
    });
  }
});

    aiRoutes.post('/search', authMiddleware, zValidator('json', searchSchema), async (c) => {
        const user = c.get('user');
  try {
    const user = c.get('user') as { id: string };
    const { query, limit } = c.req.valid('json');

    const result = await RAGService.searchMemories(query, user.id, limit);

    return c.json(result);
  } catch (error: any) {
    console.error('Error in AI search:', error);
    return c.json({ error: 'Failed to search memories' }, 500);
  }
});

export { aiRoutes };
