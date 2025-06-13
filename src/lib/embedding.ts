import { Pinecone } from '@pinecone-database/pinecone';
import { Mistral} from '@mistralai/mistralai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'memory-index';

export class EmbeddingService {
  private static index = pinecone.index(INDEX_NAME);

  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await mistral.embeddings.create({
        model: 'mistral-embed',
        inputs: [text],
      });
      
      if (!response.data[0]?.embedding) {
        throw new Error('Embedding not found in the response');
      }
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  static async storeEmbedding(
    id: string,
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.index.upsert([
        {
          id,
          values: embedding,
          metadata,
        },
      ]);
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw new Error('Failed to store embedding');
    }
  }

  static async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    userId?: string
  ) {
    try {
      const filter = userId ? { userId } : undefined;
      
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter,
      });

      return queryResponse.matches || [];
    } catch (error) {
      console.error('Error searching embeddings:', error);
      throw new Error('Failed to search embeddings');
    }
  }

  static async deleteEmbedding(id: string): Promise<void> {
    try {
      await this.index.deleteOne(id);
    } catch (error) {
      console.error('Error deleting embedding:', error);
      throw new Error('Failed to delete embedding');
    }
  }
}