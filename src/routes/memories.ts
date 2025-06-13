import { Hono, Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../middleware/auth';
import { EmbeddingService } from '../lib/embedding';

type CustomEnv = {
  Variables: {
    user: { id: string };
  };
};

const memoriesRoutes = new Hono<CustomEnv>();

const createMemorySchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const updateMemorySchema = z.object({
  content: z.string().min(1).optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const listMemoriesSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  tags: z.string().optional(),
  search: z.string().optional(),
});

// Create memory
memoriesRoutes.post('/', authMiddleware, zValidator('json', createMemorySchema), async (c) => {
  try {
    const user = c.get('user');
    const { content, title, tags } = c.req.valid('json');

    // Create memory in database
    const memory = await prisma.memory.create({
      data: {
        userId: user.id,
        content,
        title,
        tags,
      },
    });

    // Generate and store embedding
    try {
      const embedding = await EmbeddingService.generateEmbedding(content);
      await EmbeddingService.storeEmbedding(memory.id, embedding, {
        userId: user.id,
        title: title || '',
        tags: tags.join(','),
        createdAt: memory.createdAt.toISOString(),
      });

      // Update memory with embedding ID
      await prisma.memory.update({
        where: { id: memory.id },
        data: { embeddingId: memory.id },
      });
    } catch (embeddingError) {
      console.error('Failed to create embedding:', embeddingError);
      // Memory is created but without embedding - could be handled in background
    }

    return c.json(memory, 201);
  } catch (error: any) {
    console.error('Error creating memory:', error);
    return c.json({ error: 'Failed to create memory' }, 500);
  }
});

// List memories
memoriesRoutes.get('/', authMiddleware, zValidator('query', listMemoriesSchema), async (c) => {
  try {
    const user = c.get('user');
    const { page, limit, tags, search } = c.req.valid('query');

    const offset = (page - 1) * limit;
    
    const where: any = { userId: user.id };
    
    if (tags) {
      where.tags = { hasSome: tags.split(',') };
    }
    
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.memory.count({ where }),
    ]);

    return c.json({
      memories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error listing memories:', error);
    return c.json({ error: 'Failed to fetch memories' }, 500);
  }
});

// Get single memory
memoriesRoutes.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const memory = await prisma.memory.findFirst({
      where: { id, userId: user.id },
    });

    if (!memory) {
      return c.json({ error: 'Memory not found' }, 404);
    }

    return c.json(memory);
  } catch (error: any) {
    console.error('Error fetching memory:', error);
    return c.json({ error: 'Failed to fetch memory' }, 500);
  }
});

// Update memory
memoriesRoutes.put('/:id', authMiddleware, zValidator('json', updateMemorySchema), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const updates = c.req.valid('json');

    const existingMemory = await prisma.memory.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingMemory) {
      return c.json({ error: 'Memory not found' }, 404);
    }

    const memory = await prisma.memory.update({
      where: { id },
      data: updates,
    });

    // Update embedding if content changed
    if (updates.content) {
      try {
        const embedding = await EmbeddingService.generateEmbedding(updates.content);
        await EmbeddingService.storeEmbedding(memory.id, embedding, {
          userId: user.id,
          title: memory.title || '',
          tags: memory.tags.join(','),
          createdAt: memory.createdAt.toISOString(),
        });
      } catch (embeddingError) {
        console.error('Failed to update embedding:', embeddingError);
      }
    }

    return c.json(memory);
  } catch (error: any) {
    console.error('Error updating memory:', error);
    return c.json({ error: 'Failed to update memory' }, 500);
  }
});

// Delete memory
memoriesRoutes.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const memory = await prisma.memory.findFirst({
      where: { id, userId: user.id },
    });

    if (!memory) {
      return c.json({ error: 'Memory not found' }, 404);
    }

    await prisma.memory.delete({
      where: { id },
    });

    // Delete embedding
    if (memory.embeddingId) {
      try {
        await EmbeddingService.deleteEmbedding(memory.embeddingId);
      } catch (embeddingError) {
        console.error('Failed to delete embedding:', embeddingError);
      }
    }

    return c.json({ message: 'Memory deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting memory:', error);
    return c.json({ error: 'Failed to delete memory' }, 500);
  }
});

export { memoriesRoutes };
