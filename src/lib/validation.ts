import { z } from 'zod';

// Common validation schemas
export const schemas = {
  email: z.string().email('Invalid email format').toLowerCase(),
  
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),
  
  uuid: z.string().uuid('Invalid ID format'),
  
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(10000, 'Content too long')
    .trim(),
  
  title: z.string()
    .max(200, 'Title too long')
    .trim()
    .optional(),
  
  tags: z.array(z.string().trim().min(1))
    .max(10, 'Too many tags')
    .default([]),
  
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query too long')
    .trim(),
  
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  
  page: z.number()
    .int()
    .min(1)
    .default(1),
};

// Sanitization helpers
export class Sanitizer {
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static sanitizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, 10); // Max 10 tags
  }

  static truncateContent(content: string, maxLength: number = 1000): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }
}