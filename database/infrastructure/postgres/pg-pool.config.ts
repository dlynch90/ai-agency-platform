/**
 * PostgreSQL Connection Pool Configuration
 * Production-ready settings for high-performance database operations
 */

import { Pool, PoolConfig } from 'pg';

// Environment-based configuration
export interface PostgresPoolConfig extends PoolConfig {
  // Connection settings
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;

  // Pool sizing
  min: number;
  max: number;

  // Timeouts
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statementTimeout: number;
  queryTimeout: number;

  // SSL
  ssl?: boolean | object;

  // Health checks
  keepAlive: boolean;
  keepAliveInitialDelayMillis: number;
}

// Production pool configuration
export const productionPoolConfig: PostgresPoolConfig = {
  // Connection
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'ai_agency_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',

  // Pool sizing - optimized for production
  min: parseInt(process.env.PG_POOL_MIN || '5', 10),
  max: parseInt(process.env.PG_POOL_MAX || '50', 10),

  // Timeouts
  idleTimeoutMillis: 30000, // 30 seconds idle before releasing
  connectionTimeoutMillis: 10000, // 10 seconds to establish connection
  statementTimeout: 60000, // 60 seconds max for statements
  queryTimeout: 30000, // 30 seconds query timeout

  // SSL for production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,

  // Keep-alive for long-running connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Development pool configuration
export const developmentPoolConfig: PostgresPoolConfig = {
  ...productionPoolConfig,
  min: 2,
  max: 10,
  ssl: false,
  idleTimeoutMillis: 60000,
};

// Read replica configuration for horizontal scaling
export const readReplicaPoolConfig: PostgresPoolConfig = {
  ...productionPoolConfig,
  host: process.env.POSTGRES_READ_REPLICA_HOST || productionPoolConfig.host,
  port: parseInt(process.env.POSTGRES_READ_REPLICA_PORT || '5432', 10),
  min: 10,
  max: 100, // Higher for read-heavy workloads
};

/**
 * PostgreSQL Pool Manager
 * Manages primary and read replica connections with health monitoring
 */
export class PostgresPoolManager {
  private primaryPool: Pool;
  private readPool: Pool | null = null;
  private isInitialized: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private primaryConfig: PostgresPoolConfig = productionPoolConfig,
    private readConfig?: PostgresPoolConfig
  ) {
    this.primaryPool = new Pool(this.primaryConfig);

    if (this.readConfig) {
      this.readPool = new Pool(this.readConfig);
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Primary pool events
    this.primaryPool.on('connect', (client) => {
      console.log('[PostgreSQL] Primary pool: Client connected');
      // Set session-level configurations
      client.query('SET statement_timeout = $1', [this.primaryConfig.statementTimeout]);
    });

    this.primaryPool.on('acquire', () => {
      console.debug('[PostgreSQL] Primary pool: Client acquired');
    });

    this.primaryPool.on('release', () => {
      console.debug('[PostgreSQL] Primary pool: Client released');
    });

    this.primaryPool.on('error', (err) => {
      console.error('[PostgreSQL] Primary pool error:', err);
    });

    this.primaryPool.on('remove', () => {
      console.debug('[PostgreSQL] Primary pool: Client removed');
    });

    // Read pool events
    if (this.readPool) {
      this.readPool.on('connect', (client) => {
        console.log('[PostgreSQL] Read pool: Client connected');
        client.query('SET statement_timeout = $1', [this.primaryConfig.statementTimeout]);
      });

      this.readPool.on('error', (err) => {
        console.error('[PostgreSQL] Read pool error:', err);
      });
    }
  }

  /**
   * Initialize pools and verify connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[PostgreSQL] Initializing connection pools...');

    // Test primary connection
    const primaryClient = await this.primaryPool.connect();
    try {
      const result = await primaryClient.query('SELECT NOW() as now, version() as version');
      console.log('[PostgreSQL] Primary connection established:', {
        serverTime: result.rows[0].now,
        version: result.rows[0].version.split(' ')[1],
      });
    } finally {
      primaryClient.release();
    }

    // Test read replica connection
    if (this.readPool) {
      const readClient = await this.readPool.connect();
      try {
        await readClient.query('SELECT 1');
        console.log('[PostgreSQL] Read replica connection established');
      } finally {
        readClient.release();
      }
    }

    this.startHealthCheck();
    this.isInitialized = true;
    console.log('[PostgreSQL] Connection pools initialized successfully');
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    const healthCheckIntervalMs = 30000; // 30 seconds

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('[PostgreSQL] Health check failed:', error);
      }
    }, healthCheckIntervalMs);
  }

  /**
   * Perform health check on all pools
   */
  async healthCheck(): Promise<{
    primary: PoolHealthStatus;
    read?: PoolHealthStatus;
  }> {
    const primaryStatus = await this.checkPoolHealth(this.primaryPool, 'primary');
    const readStatus = this.readPool
      ? await this.checkPoolHealth(this.readPool, 'read')
      : undefined;

    return {
      primary: primaryStatus,
      read: readStatus,
    };
  }

  private async checkPoolHealth(pool: Pool, name: string): Promise<PoolHealthStatus> {
    const startTime = Date.now();

    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        const latency = Date.now() - startTime;

        return {
          status: 'healthy',
          latencyMs: latency,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    }
  }

  /**
   * Get a client for write operations (primary)
   */
  async getWriteClient() {
    return this.primaryPool.connect();
  }

  /**
   * Get a client for read operations (prefers replica if available)
   */
  async getReadClient() {
    if (this.readPool) {
      return this.readPool.connect();
    }
    return this.primaryPool.connect();
  }

  /**
   * Execute a query on the appropriate pool
   */
  async query<T = any>(
    text: string,
    values?: any[],
    options: { readOnly?: boolean } = {}
  ): Promise<T[]> {
    const pool = options.readOnly && this.readPool ? this.readPool : this.primaryPool;
    const result = await pool.query(text, values);
    return result.rows;
  }

  /**
   * Execute a transaction on the primary pool
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.primaryPool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const stats: PoolStats = {
      primary: {
        total: this.primaryPool.totalCount,
        idle: this.primaryPool.idleCount,
        waiting: this.primaryPool.waitingCount,
      },
    };

    if (this.readPool) {
      stats.read = {
        total: this.readPool.totalCount,
        idle: this.readPool.idleCount,
        waiting: this.readPool.waitingCount,
      };
    }

    return stats;
  }

  /**
   * Gracefully close all connections
   */
  async close(): Promise<void> {
    console.log('[PostgreSQL] Closing connection pools...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.primaryPool.end();

    if (this.readPool) {
      await this.readPool.end();
    }

    this.isInitialized = false;
    console.log('[PostgreSQL] Connection pools closed');
  }
}

// Type definitions
export interface PoolHealthStatus {
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  error?: string;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

export interface PoolStats {
  primary: {
    total: number;
    idle: number;
    waiting: number;
  };
  read?: {
    total: number;
    idle: number;
    waiting: number;
  };
}

// Export singleton instance
export const pgPool = new PostgresPoolManager(
  process.env.NODE_ENV === 'production' ? productionPoolConfig : developmentPoolConfig,
  process.env.POSTGRES_READ_REPLICA_HOST ? readReplicaPoolConfig : undefined
);

export default pgPool;
