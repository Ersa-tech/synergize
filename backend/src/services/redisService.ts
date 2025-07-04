import { Redis } from 'ioredis';

import { CollaborationSession } from '../models/types.js';
import { createLogger } from '../utils/logger.js';
import { config } from '../config.js';

export class RedisService {
  private client: Redis | null = null;
  private static instance: RedisService | null = null;
  private logger = createLogger('RedisService');

  constructor() {
    // Singleton pattern to share Redis connection
    if (RedisService.instance) {
      return RedisService.instance;
    }
    RedisService.instance = this;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || `redis://${config.redis.host}:${config.redis.port}`;
      this.client = new Redis(redisUrl, {
        retryStrategy: (times): number => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
      });

      this.client.on('connect', () => {
        this.logger.info('✅ Connected to Redis');
      });

      // Test connection
      await this.client.ping();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async storeSession(sessionId: string, data: unknown): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    
    const key = `session:${sessionId}`;
    await this.client.setex(key, config.redis.ttl, JSON.stringify(data));
  }

  async getSession(sessionId: string): Promise<unknown | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateSession(sessionId: string, updates: Partial<CollaborationSession>): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    
    const existing = await this.getSession(sessionId);
    if (!existing) {
      throw new Error('Session not found');
    }
    
    const updated = { ...existing, ...updates };
    await this.storeSession(sessionId, updated);
  }

  async storeVector(key: string, vector: number[], metadata: unknown): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    
    // Store vector with metadata for semantic search
    const data = {
      vector,
      metadata,
      timestamp: Date.now(),
    };
    
    await this.client.hset('vectors', key, JSON.stringify(data));
  }

  async searchVectors(queryVector: number[], topK: number = 5): Promise<unknown[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    
    // Simple cosine similarity search
    // In production, use Redis Vector Search module
    const allVectors = await this.client.hgetall('vectors');
    const results: Array<{ key: string; score: number; data: unknown }> = [];
    
    for (const [key, value] of Object.entries(allVectors)) {
      const data = JSON.parse(value);
      const score = this.cosineSimilarity(queryVector, data.vector);
      results.push({ key, score, data });
    }
    
    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => ({ ...(r.data as { metadata: Record<string, unknown> }).metadata, score: r.score }));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async clearAll(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    await this.client.flushdb();
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }
}