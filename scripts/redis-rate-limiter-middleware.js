/**
 * Redis Rate Limiting Middleware
 * Vendor implementation using rate-limiter-flexible
 * Exposes Redis-backed rate limiting for Express/Fastify
 */

const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { Counter, Histogram, Gauge, Registry } = require('prom-client');
const Redis = require('ioredis');

const rateLimiterRegistry = new Registry();

const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['identifier', 'endpoint'],
  registers: [rateLimiterRegistry]
});

const rateLimitRejections = new Counter({
  name: 'rate_limit_rejections_total',
  help: 'Total rate limit rejections',
  labelNames: ['identifier', 'endpoint'],
  registers: [rateLimiterRegistry]
});

const rateLimitRemaining = new Gauge({
  name: 'rate_limit_remaining',
  help: 'Remaining requests in current window',
  labelNames: ['identifier'],
  registers: [rateLimiterRegistry]
});

const RATE_LIMIT_PRESETS = {
  standard: { points: 100, duration: 60, blockDuration: 60 },
  strict: { points: 20, duration: 60, blockDuration: 300 },
  relaxed: { points: 1000, duration: 60, blockDuration: 30 },
  aiInference: { points: 10, duration: 60, blockDuration: 120 },
  authentication: { points: 5, duration: 300, blockDuration: 900 },
  webhook: { points: 50, duration: 60, blockDuration: 60 }
};

class RateLimiterFactory {
  constructor(redisConfig = {}) {
    this.redis = null;
    this.limiters = new Map();
    this.redisConfig = {
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      password: redisConfig.password || process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      ...redisConfig
    };
  }

  async initialize() {
    try {
      this.redis = new Redis(this.redisConfig);
      await this.redis.ping();
      console.log('[RateLimiter] Redis connected');
      return true;
    } catch (error) {
      console.warn('[RateLimiter] Redis unavailable, using in-memory fallback');
      this.redis = null;
      return false;
    }
  }

  create(name, options = {}) {
    if (this.limiters.has(name)) {
      return this.limiters.get(name);
    }

    const preset = RATE_LIMIT_PRESETS[options.preset] || RATE_LIMIT_PRESETS.standard;
    const config = {
      keyPrefix: `rl:${name}`,
      points: options.points || preset.points,
      duration: options.duration || preset.duration,
      blockDuration: options.blockDuration || preset.blockDuration,
      ...options
    };

    let limiter;
    if (this.redis) {
      limiter = new RateLimiterRedis({
        storeClient: this.redis,
        ...config
      });
    } else {
      limiter = new RateLimiterMemory(config);
    }

    this.limiters.set(name, limiter);
    return limiter;
  }

  get(name) {
    return this.limiters.get(name);
  }

  async shutdown() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.limiters.clear();
  }
}

const factory = new RateLimiterFactory();

function getIdentifier(req, options = {}) {
  if (options.keyGenerator) {
    return options.keyGenerator(req);
  }
  return req.headers['x-api-key'] ||
         req.headers['authorization']?.split(' ')[1] ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.ip ||
         req.connection?.remoteAddress ||
         'anonymous';
}

function rateLimitMiddleware(limiterName, options = {}) {
  const limiter = factory.create(limiterName, options);

  return async (req, res, next) => {
    const identifier = getIdentifier(req, options);
    const endpoint = options.perEndpoint ? req.path : 'global';

    try {
      const result = await limiter.consume(identifier);
      
      rateLimitHits.inc({ identifier: identifier.slice(0, 20), endpoint });
      rateLimitRemaining.set({ identifier: identifier.slice(0, 20) }, result.remainingPoints);

      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': result.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });

      next();
    } catch (rateLimiterRes) {
      rateLimitRejections.inc({ identifier: identifier.slice(0, 20), endpoint });

      const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);

      res.set({
        'Retry-After': retryAfter,
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter,
        limit: limiter.points,
        window: limiter.duration
      });
    }
  };
}

function fastifyRateLimitPlugin(fastify, options, done) {
  const limiter = factory.create(options.name || 'fastify-default', options);

  fastify.addHook('onRequest', async (request, reply) => {
    const identifier = getIdentifier(request, options);

    try {
      const result = await limiter.consume(identifier);
      
      reply.headers({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': result.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });
    } catch (rateLimiterRes) {
      const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);

      reply
        .code(429)
        .headers({
          'Retry-After': retryAfter,
          'X-RateLimit-Limit': limiter.points,
          'X-RateLimit-Remaining': 0
        })
        .send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter
        });
    }
  });

  done();
}

async function getMetrics() {
  return rateLimiterRegistry.metrics();
}

function getMetricsContentType() {
  return rateLimiterRegistry.contentType;
}

module.exports = {
  factory,
  rateLimitMiddleware,
  fastifyRateLimitPlugin,
  RATE_LIMIT_PRESETS,
  getMetrics,
  getMetricsContentType,
  rateLimiterRegistry,
  RateLimiterFactory
};
