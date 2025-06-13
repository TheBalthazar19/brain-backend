export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  }
  
  export interface Memory {
    id: string;
    userId: string;
    content: string;
    title?: string;
    tags: string[];
    embeddingId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateMemoryRequest {
    content: string;
    title?: string;
    tags?: string[];
  }
  
  export interface UpdateMemoryRequest {
    content?: string;
    title?: string;
    tags?: string[];
  }
  
  export interface SearchRequest {
    query: string;
    limit?: number;
  }
  
  export interface SearchResponse {
    answer: string;
    references: Memory[];
  }
  
  export interface AuthRequest {
    email: string;
    password: string;
    name?: string;
  }