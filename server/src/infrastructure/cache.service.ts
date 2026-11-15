import Redis from 'ioredis';
import { ENV } from '../config/env';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
}

export class InMemoryCacheService implements ICacheService {
  private store: Map<string, { value: string; expiresAt: number | null }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value: serialized, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

export class HybridRedisCacheService implements ICacheService {
  private redis: Redis | null = null;
  private fallback: InMemoryCacheService = new InMemoryCacheService();
  private isRedisConnected = false;

  constructor() {
    if (ENV.REDIS_URL && ENV.REDIS_URL.trim() !== '') {
      try {
        let cleanUrl = ENV.REDIS_URL.trim();
        // If user copied the CLI format: redis-cli --tls -u redis://...
        if (cleanUrl.includes('redis-cli')) {
          const match = cleanUrl.match(/(rediss?:\/\/[^\s]+)/);
          if (match) {
            cleanUrl = match[1];
          }
        }
        // If Upstash or TLS provider, ensure rediss:// protocol
        if (cleanUrl.startsWith('redis://') && cleanUrl.includes('upstash.io')) {
          cleanUrl = cleanUrl.replace('redis://', 'rediss://');
        }

        this.redis = new Redis(cleanUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          lazyConnect: true
        });

        this.redis.connect().then(() => {
          this.isRedisConnected = true;
        }).catch(() => {
          this.isRedisConnected = false;
        });

        this.redis.on('error', () => {
          this.isRedisConnected = false;
        });
      } catch {
        this.isRedisConnected = false;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        return this.fallback.get<T>(key);
      }
    }
    return this.fallback.get<T>(key);
  }

  async set(key: string, value: any, ttlSeconds = 60): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
          await this.redis.setex(key, ttlSeconds, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch {
        // Fallback below
      }
    }
    await this.fallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        // Ignore
      }
    }
    await this.fallback.del(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch {
        // Ignore
      }
    }
    await this.fallback.delPrefix(prefix);
  }
}

export const cacheService: ICacheService = new HybridRedisCacheService();
