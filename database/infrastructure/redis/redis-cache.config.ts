/**
 * Redis Caching Layer Configuration
 * Production-ready caching with TTL management, clustering, and monitoring
 */

import { createClient, RedisClientType, RedisClusterType } from 'redis';

// TTL Constants (in seconds)
export const TTL = {
  // User-related caching
  USER_SESSION: 3600, // 1 hour
  USER_PROFILE: 1800, // 30 minutes
  USER_PREFERENCES: 3600, // 1 hour

  // Content caching
  CONTENT_CACHE: 300, // 5 minutes
  CONTENT_LIST: 60, // 1 minute
  SEARCH_RESULTS: 120, // 2 minutes

  // API response caching
  API_RESPONSE: 60, // 1 minute
  RATE_LIMIT: 60, // 1 minute window

  // Real-time data
  REAL_TIME_DATA: 10, // 10 seconds
  LIVE_METRICS: 5, // 5 seconds

  // E-commerce specific
  PRODUCT_CATALOG: 600, // 10 minutes
  PRODUCT_DETAILS: 300, // 5 minutes
  CART_SESSION: 86400, // 24 hours
  RECOMMENDATION_CACHE: 1800, // 30 minutes
  PRICE_CACHE: 60, // 1 minute

  // AI/ML specific
  EMBEDDING_CACHE: 86400, // 24 hours (embeddings rarely change)
  MODEL_INFERENCE_CACHE: 300, // 5 minutes
  VECTOR_SEARCH_CACHE: 120, // 2 minutes

  // Healthcare specific
  PATIENT_DATA: 300, // 5 minutes
  TRIAGE_QUEUE: 30, // 30 seconds

  // Finance specific
  MARKET_DATA: 5, // 5 seconds (near real-time)
  PORTFOLIO_VALUE: 30, // 30 seconds

  // Default
  DEFAULT: 300, // 5 minutes
} as const;

// Cache key prefixes for namespace management
export const CACHE_PREFIX = {
  USER: 'user:',
  SESSION: 'session:',
  CONTENT: 'content:',
  API: 'api:',
  RATE_LIMIT: 'ratelimit:',
  PRODUCT: 'product:',
  CART: 'cart:',
  RECOMMENDATION: 'rec:',
  EMBEDDING: 'embedding:',
  INFERENCE: 'inference:',
  VECTOR: 'vector:',
  PATIENT: 'patient:',
  MARKET: 'market:',
  PORTFOLIO: 'portfolio:',
  QUEUE: 'queue:',
  LOCK: 'lock:',
  PUBSUB: 'pubsub:',
} as const;

// Redis configuration interface
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  connectTimeoutMs?: number;
  commandTimeoutMs?: number;
  keepAlive?: boolean;
  enableReadyCheck?: boolean;
  tls?: boolean;
}

// Cluster configuration
export interface RedisClusterConfig {
  nodes: Array<{ host: string; port: number }>;
  password?: string;
  maxRetries?: number;
  enableReadyCheck?: boolean;
  scaleReads?: 'master' | 'slave' | 'all';
}

// Production Redis configuration
export const productionRedisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetries: 10,
  retryDelayMs: 1000,
  connectTimeoutMs: 10000,
  commandTimeoutMs: 5000,
  keepAlive: true,
  enableReadyCheck: true,
  tls: process.env.REDIS_TLS === 'true',
};

// Cluster configuration for production scaling
export const productionClusterConfig: RedisClusterConfig = {
  nodes: (process.env.REDIS_CLUSTER_NODES || 'localhost:6379,localhost:6380,localhost:6381')
    .split(',')
    .map((node) => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port, 10) };
    }),
  password: process.env.REDIS_PASSWORD,
  maxRetries: 10,
  enableReadyCheck: true,
  scaleReads: 'slave', // Read from replicas for better performance
};

/**
 * Redis Cache Manager
 * Provides high-level caching operations with TTL management
 */
export class RedisCacheManager {
  private client: RedisClientType | null = null;
  private _cluster: RedisClusterType | null = null;
  private isClusterMode: boolean = false;
  private isConnected: boolean = false;
  private subscribers: Map<string, RedisClientType> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: RedisConfig = productionRedisConfig,
    private clusterConfig?: RedisClusterConfig
  ) {
    this.isClusterMode = !!clusterConfig && process.env.REDIS_CLUSTER_MODE === 'true';
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    console.log('[Redis] Connecting to Redis...');

    if (this.isClusterMode && this.clusterConfig) {
      await this.connectCluster();
    } else {
      await this.connectStandalone();
    }

    this.startHealthCheck();
    this.isConnected = true;
    console.log('[Redis] Connected successfully');
  }

  private async connectStandalone(): Promise<void> {
    const url = this.buildRedisUrl(this.config);

    this.client = createClient({
      url,
      socket: {
        connectTimeout: this.config.connectTimeoutMs,
        keepAlive: this.config.keepAlive ? 5000 : false,
        reconnectStrategy: (retries) => {
          if (retries > (this.config.maxRetries || 10)) {
            console.error('[Redis] Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.client.on('error', (err) => console.error('[Redis] Client error:', err));
    this.client.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
    this.client.on('ready', () => console.log('[Redis] Ready'));

    await this.client.connect();
  }

  private async connectCluster(): Promise<void> {
    // Cluster connection implementation
    console.log('[Redis] Cluster mode enabled');
    // Note: For production, use @redis/cluster package
    // This is a placeholder for cluster initialization
    throw new Error('Cluster mode requires additional configuration');
  }

  private buildRedisUrl(config: RedisConfig): string {
    const protocol = config.tls ? 'rediss' : 'redis';
    const auth = config.password ? `:${config.password}@` : '';
    return `${protocol}://${auth}${config.host}:${config.port}/${config.database || 0}`;
  }

  /**
   * Get the active client
   */
  private getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  // ===== Basic Cache Operations =====

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.getClient().get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Set a value with optional TTL
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = TTL.DEFAULT
  ): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.getClient().setEx(key, ttlSeconds, serialized);
  }

  /**
   * Set a value only if it doesn't exist (for distributed locks)
   */
  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.getClient().set(key, value, {
      NX: true,
      EX: ttlSeconds,
    });
    return result === 'OK';
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.getClient().del(key);
    return result > 0;
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.getClient().keys(pattern);
    if (keys.length === 0) return 0;
    return this.getClient().del(keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.getClient().exists(key);
    return result === 1;
  }

  /**
   * Get TTL of a key
   */
  async getTTL(key: string): Promise<number> {
    return this.getClient().ttl(key);
  }

  /**
   * Extend TTL of a key
   */
  async extendTTL(key: string, ttlSeconds: number): Promise<boolean> {
    return this.getClient().expire(key, ttlSeconds);
  }

  // ===== Advanced Cache Patterns =====

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = TTL.DEFAULT
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Cache with stale-while-revalidate pattern
   */
  async getWithRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    staleSeconds: number
  ): Promise<T> {
    const cached = await this.get<{ value: T; timestamp: number }>(key);
    const now = Date.now();

    if (cached) {
      const age = (now - cached.timestamp) / 1000;

      // If still fresh, return cached value
      if (age < ttlSeconds) {
        return cached.value;
      }

      // If stale but within grace period, return cached and revalidate in background
      if (age < ttlSeconds + staleSeconds) {
        // Fire-and-forget revalidation
        this.revalidate(key, fetcher, ttlSeconds).catch(console.error);
        return cached.value;
      }
    }

    // Fetch fresh data
    const value = await fetcher();
    await this.set(key, { value, timestamp: now }, ttlSeconds + staleSeconds);
    return value;
  }

  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const value = await fetcher();
      await this.set(key, { value, timestamp: Date.now() }, ttlSeconds);
    } catch (error) {
      console.error(`[Redis] Revalidation failed for ${key}:`, error);
    }
  }

  // ===== Hash Operations (for structured data) =====

  async hGet<T>(key: string, field: string): Promise<T | null> {
    const value = await this.getClient().hGet(key, field);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async hSet(key: string, field: string, value: any): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.getClient().hSet(key, field, serialized);
  }

  async hGetAll<T>(key: string): Promise<Record<string, T>> {
    const data = await this.getClient().hGetAll(key);
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value) as T;
      } catch {
        result[field] = value as unknown as T;
      }
    }
    return result;
  }

  async hDel(key: string, ...fields: string[]): Promise<number> {
    return this.getClient().hDel(key, fields);
  }

  // ===== List Operations (for queues) =====

  async lPush(key: string, ...values: string[]): Promise<number> {
    return this.getClient().lPush(key, values);
  }

  async rPop(key: string): Promise<string | null> {
    return this.getClient().rPop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.getClient().lRange(key, start, stop);
  }

  async lLen(key: string): Promise<number> {
    return this.getClient().lLen(key);
  }

  // ===== Sorted Set Operations (for leaderboards, priority queues) =====

  async zAdd(key: string, score: number, member: string): Promise<number> {
    return this.getClient().zAdd(key, { score, value: member });
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.getClient().zRange(key, start, stop);
  }

  async zRangeWithScores(
    key: string,
    start: number,
    stop: number
  ): Promise<Array<{ value: string; score: number }>> {
    return this.getClient().zRangeWithScores(key, start, stop);
  }

  async zRank(key: string, member: string): Promise<number | null> {
    return this.getClient().zRank(key, member);
  }

  async zScore(key: string, member: string): Promise<number | null> {
    return this.getClient().zScore(key, member);
  }

  // ===== Rate Limiting =====

  /**
   * Sliding window rate limiter
   */
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `${CACHE_PREFIX.RATE_LIMIT}${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const client = this.getClient();

    // Remove old entries
    await client.zRemRangeByScore(key, 0, windowStart);

    // Count current entries
    const count = await client.zCard(key);

    if (count >= maxRequests) {
      const oldestEntry = await client.zRange(key, 0, 0);
      const resetIn = oldestEntry.length > 0
        ? Math.ceil((parseInt(oldestEntry[0], 10) + windowSeconds * 1000 - now) / 1000)
        : windowSeconds;

      return {
        allowed: false,
        remaining: 0,
        resetIn,
      };
    }

    // Add current request
    await client.zAdd(key, { score: now, value: now.toString() });
    await client.expire(key, windowSeconds);

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetIn: windowSeconds,
    };
  }

  // ===== Distributed Locking =====

  /**
   * Acquire a distributed lock
   */
  async acquireLock(
    lockName: string,
    ttlSeconds: number = 30
  ): Promise<string | null> {
    const key = `${CACHE_PREFIX.LOCK}${lockName}`;
    const lockId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const acquired = await this.setNX(key, lockId, ttlSeconds);
    return acquired ? lockId : null;
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lockName: string, lockId: string): Promise<boolean> {
    const key = `${CACHE_PREFIX.LOCK}${lockName}`;
    const currentValue = await this.get<string>(key);

    if (currentValue === lockId) {
      await this.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Execute with lock
   */
  async withLock<T>(
    lockName: string,
    callback: () => Promise<T>,
    ttlSeconds: number = 30
  ): Promise<T | null> {
    const lockId = await this.acquireLock(lockName, ttlSeconds);
    if (!lockId) {
      console.warn(`[Redis] Could not acquire lock: ${lockName}`);
      return null;
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(lockName, lockId);
    }
  }

  // ===== Pub/Sub =====

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: any): Promise<number> {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    return this.getClient().publish(`${CACHE_PREFIX.PUBSUB}${channel}`, serialized);
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    // Create a dedicated subscriber client
    const subscriber = this.client!.duplicate();
    await subscriber.connect();

    this.subscribers.set(channel, subscriber);

    await subscriber.subscribe(`${CACHE_PREFIX.PUBSUB}${channel}`, (message) => {
      try {
        callback(JSON.parse(message));
      } catch {
        callback(message);
      }
    });
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    const subscriber = this.subscribers.get(channel);
    if (subscriber) {
      await subscriber.unsubscribe(`${CACHE_PREFIX.PUBSUB}${channel}`);
      await subscriber.quit();
      this.subscribers.delete(channel);
    }
  }

  // ===== Health Check & Monitoring =====

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        console.error('[Redis] Health check failed:', error);
      }
    }, 30000);
  }

  async ping(): Promise<string> {
    return this.getClient().ping();
  }

  async getInfo(): Promise<Record<string, any>> {
    const info = await this.getClient().info();
    const sections: Record<string, any> = {};

    let currentSection = 'default';
    for (const line of info.split('\r\n')) {
      if (line.startsWith('#')) {
        currentSection = line.substring(2).toLowerCase();
        sections[currentSection] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        sections[currentSection][key] = value;
      }
    }

    return sections;
  }

  async getMemoryUsage(): Promise<{
    used: number;
    peak: number;
    fragmentation: number;
  }> {
    const info = await this.getInfo();
    const memory = info.memory || {};

    return {
      used: parseInt(memory.used_memory || '0', 10),
      peak: parseInt(memory.used_memory_peak || '0', 10),
      fragmentation: parseFloat(memory.mem_fragmentation_ratio || '1'),
    };
  }

  async getConnectionCount(): Promise<number> {
    const info = await this.getInfo();
    return parseInt(info.clients?.connected_clients || '0', 10);
  }

  // ===== Cleanup =====

  async disconnect(): Promise<void> {
    console.log('[Redis] Disconnecting...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all subscriber connections
    for (const [, subscriber] of this.subscribers) {
      await subscriber.quit();
    }
    this.subscribers.clear();

    if (this.client) {
      await this.client.quit();
      this.client = null;
    }

    this.isConnected = false;
    console.log('[Redis] Disconnected');
  }
}

// Export singleton instance
export const redisCache = new RedisCacheManager(productionRedisConfig);

export default redisCache;
