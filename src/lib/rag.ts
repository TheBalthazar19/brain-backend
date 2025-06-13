import { EmbeddingService } from './embedding';
import { prisma } from './database';
import { Mistral} from '@mistralai/mistralai';
import { Memory, SearchResponse } from '../types';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});

export class RAGService {
  static async searchMemories(query: string, userId: string, limit: number = 5): Promise<SearchResponse> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      
      // Search for similar memories
      const matches = await EmbeddingService.searchSimilar(queryEmbedding, limit, userId);
      
      // Get memory details from database
      const memoryIds = matches.map(match => match.id);
      const memories: Memory[] = await prisma.memory.findMany({
        where: {
          id: { in: memoryIds },
          userId,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Create context from relevant memories
      const context = memories.map(memory => 
        `Title: ${memory.title || 'Untitled'}\nContent: ${memory.content}\nTags: ${memory.tags.join(', ')}`
      ).join('\n\n---\n\n');
      
      // Generate AI response using Mistral
      const prompt = `Based on the following memories, answer the user's question: "${query}"

Memories:
${context}

Please provide a comprehensive answer based on the available information. If the memories don't contain enough information to answer the question, mention that.`;

      const response = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const answer = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0]?.message?.content
        : 'Sorry, I could not generate a response.';

      return {
        answer,
        references: memories,
      };
    } catch (error) {
      console.error('Error in RAG search:', error);
      throw new Error('Failed to search memories');
    }
  }
}
