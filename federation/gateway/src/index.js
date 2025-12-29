/**
 * Apollo Federation 2.0 Gateway
 * Central gateway for all subgraphs with subscriptions, rate limiting, caching, and Prometheus metrics
 */

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } = require('@apollo/gateway');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { collectDefaultMetrics, Counter, Histogram, Registry } = require('prom-client');
const Redis = require('ioredis');
require('dotenv').config();

// Configuration
const config = {
  port: process.env.GATEWAY_PORT || 4000,
  subgraphs: [
    { name: 'users', url: process.env.USERS_SUBGRAPH_URL || 'http://localhost:4001/graphql' },
    { name: 'campaigns', url: process.env.CAMPAIGNS_SUBGRAPH_URL || 'http://localhost:4002/graphql' },
    { name: 'analytics', url: process.env.ANALYTICS_SUBGRAPH_URL || 'http://localhost:4003/graphql' }
  ],
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  rateLimit: {
    points: parseInt(process.env.RATE_LIMIT_POINTS || '1000'),
    duration: parseInt(process.env.RATE_LIMIT_DURATION || '60')
  }
};

// Prometheus Metrics Registry
const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

// Custom Metrics
const graphqlRequestCounter = new Counter({
  name: 'graphql_requests_total',
  help: 'Total number of GraphQL requests',
  labelNames: ['operation', 'operationName', 'status'],
  registers: [metricsRegistry]
});

const graphqlRequestDuration = new Histogram({
  name: 'graphql_request_duration_seconds',
  help: 'Duration of GraphQL requests in seconds',
  labelNames: ['operation', 'operationName'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry]
});

const subgraphRequestDuration = new Histogram({
  name: 'subgraph_request_duration_seconds',
  help: 'Duration of subgraph requests in seconds',
  labelNames: ['subgraph'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry]
});

const cacheHitCounter = new Counter({
  name: 'graphql_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cacheType'],
  registers: [metricsRegistry]
});

const rateLimitCounter = new Counter({
  name: 'graphql_rate_limit_total',
  help: 'Total number of rate limited requests',
  labelNames: ['identifier'],
  registers: [metricsRegistry]
});

// Redis client for caching
let redis;
try {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  });
} catch (error) {
  console.warn('Redis not available, using in-memory caching');
  redis = null;
}

// Rate limiter (Redis-backed or in-memory fallback)
let rateLimiter;
const initRateLimiter = async () => {
  try {
    if (redis) {
      await redis.connect();
      rateLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: 'graphql_rl',
        points: config.rateLimit.points,
        duration: config.rateLimit.duration
      });
    }
  } catch (error) {
    console.warn('Using in-memory rate limiter');
    rateLimiter = new RateLimiterMemory({
      points: config.rateLimit.points,
      duration: config.rateLimit.duration
    });
  }
};

// In-memory cache for fallback
const memoryCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// Cache implementation
class CacheManager {
  static async get(key) {
    try {
      if (redis && redis.status === 'ready') {
        const data = await redis.get(key);
        if (data) {
          cacheHitCounter.inc({ cacheType: 'redis' });
          return JSON.parse(data);
        }
      } else if (memoryCache.has(key)) {
        const cached = memoryCache.get(key);
        if (Date.now() < cached.expiry) {
          cacheHitCounter.inc({ cacheType: 'memory' });
          return cached.data;
        }
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }
    return null;
  }

  static async set(key, data, ttlSeconds = 300) {
    try {
      if (redis && redis.status === 'ready') {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
      } else {
        memoryCache.set(key, {
          data,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern) {
    try {
      if (redis && redis.status === 'ready') {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

// Custom RemoteGraphQLDataSource with caching and metrics
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  constructor(options) {
    super(options);
    this.subgraphName = options.name || 'unknown';
  }

  willSendRequest({ request, context }) {
    // Forward authentication headers
    if (context.authToken) {
      request.http.headers.set('authorization', context.authToken);
    }
    if (context.tenantId) {
      request.http.headers.set('x-tenant-id', context.tenantId);
    }
    if (context.userId) {
      request.http.headers.set('x-user-id', context.userId);
    }
    // Trace ID for distributed tracing
    if (context.traceId) {
      request.http.headers.set('x-trace-id', context.traceId);
    }
  }

  async didReceiveResponse({ response, request, context }) {
    // Track subgraph metrics
    const duration = (Date.now() - context.requestStart) / 1000;
    subgraphRequestDuration.observe({ subgraph: this.subgraphName }, duration);
    return response;
  }
}

// Apollo Gateway configuration
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: config.subgraphs
  }),
  buildService({ name, url }) {
    return new AuthenticatedDataSource({ url, name });
  }
});

// Prometheus metrics plugin
const prometheusPlugin = {
  async requestDidStart({ request }) {
    const start = Date.now();
    const operationType = request.query?.includes('mutation') ? 'mutation' :
                          request.query?.includes('subscription') ? 'subscription' : 'query';
    const operationName = request.operationName || 'anonymous';

    return {
      async willSendResponse({ response }) {
        const duration = (Date.now() - start) / 1000;
        const status = response.errors ? 'error' : 'success';

        graphqlRequestCounter.inc({ operation: operationType, operationName, status });
        graphqlRequestDuration.observe({ operation: operationType, operationName }, duration);
      }
    };
  }
};

// Caching plugin
const cachingPlugin = {
  async requestDidStart({ request, contextValue }) {
    // Only cache queries, not mutations
    if (request.query?.includes('mutation')) {
      return {};
    }

    const cacheKey = `gql:${Buffer.from(JSON.stringify({
      query: request.query,
      variables: request.variables
    })).toString('base64').slice(0, 100)}`;

    return {
      async responseForOperation({ request }) {
        // Check cache before executing
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          return { data: cached };
        }
        return null;
      },
      async willSendResponse({ response }) {
        // Cache successful responses
        if (response.body.singleResult?.data && !response.body.singleResult?.errors) {
          await CacheManager.set(cacheKey, response.body.singleResult.data, 300);
        }
      }
    };
  }
};

// Rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
  if (!rateLimiter) {
    return next();
  }

  const identifier = req.headers['x-api-key'] ||
                     req.headers['authorization'] ||
                     req.ip ||
                     'anonymous';

  try {
    await rateLimiter.consume(identifier);
    next();
  } catch (error) {
    rateLimitCounter.inc({ identifier: identifier.slice(0, 20) });
    res.status(429).json({
      errors: [{
        message: 'Too many requests. Please try again later.',
        extensions: {
          code: 'RATE_LIMITED',
          retryAfter: Math.round(error.msBeforeNext / 1000)
        }
      }]
    });
  }
};

// Create and start the server
async function startServer() {
  await initRateLimiter();

  const app = express();
  const httpServer = createServer(app);

  // Apollo Server
  const server = new ApolloServer({
    gateway,
    plugins: [
      prometheusPlugin,
      cachingPlugin,
      ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ],
    introspection: true,
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production'
  });

  await server.start();

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });

  // Subscription server (placeholder - actual subscriptions handled by subgraphs)
  useServer({
    schema: null, // Will be populated by gateway
    context: async (ctx) => {
      return {
        authToken: ctx.connectionParams?.authToken,
        tenantId: ctx.connectionParams?.tenantId,
        userId: ctx.connectionParams?.userId
      };
    }
  }, wsServer);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      subgraphs: {}
    };

    for (const subgraph of config.subgraphs) {
      try {
        const response = await fetch(`${subgraph.url.replace('/graphql', '')}/health`, {
          signal: AbortSignal.timeout(5000)
        });
        health.subgraphs[subgraph.name] = response.ok ? 'healthy' : 'unhealthy';
      } catch {
        health.subgraphs[subgraph.name] = 'unreachable';
      }
    }

    const hasUnhealthy = Object.values(health.subgraphs).some(s => s !== 'healthy');
    res.status(hasUnhealthy ? 503 : 200).json(health);
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', metricsRegistry.contentType);
      res.end(await metricsRegistry.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  // GraphQL endpoint with rate limiting
  app.use(
    '/graphql',
    rateLimitMiddleware,
    expressMiddleware(server, {
      context: async ({ req }) => ({
        authToken: req.headers.authorization,
        tenantId: req.headers['x-tenant-id'],
        userId: req.headers['x-user-id'],
        traceId: req.headers['x-trace-id'] || `trace-${Date.now()}`,
        requestStart: Date.now()
      })
    })
  );

  // Cache invalidation endpoint (for internal use)
  app.post('/cache/invalidate', async (req, res) => {
    const { pattern } = req.body;
    if (!pattern) {
      return res.status(400).json({ error: 'Pattern required' });
    }
    await CacheManager.invalidate(pattern);
    res.json({ success: true, pattern });
  });

  // Start HTTP server
  httpServer.listen(config.port, () => {
    console.log(`Federation Gateway ready at http://localhost:${config.port}/graphql`);
    console.log(`Subscriptions ready at ws://localhost:${config.port}/graphql`);
    console.log(`Health check at http://localhost:${config.port}/health`);
    console.log(`Metrics at http://localhost:${config.port}/metrics`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gateway...');
    await server.stop();
    if (redis) {
      await redis.quit();
    }
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(console.error);
