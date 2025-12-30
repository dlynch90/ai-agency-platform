/**
 * Opossum Circuit Breaker - Vendor Implementation
 * Replaces custom circuit breaker with official Opossum library
 * @see https://github.com/nodeshift/opossum
 * 
 * Features:
 * - Prometheus metrics integration
 * - Event-driven state management
 * - Configurable thresholds and timeouts
 * - Fallback function support
 * - Health monitoring
 */

const CircuitBreaker = require('opossum');
const { Counter, Histogram, Gauge, Registry } = require('prom-client');

// Prometheus metrics registry for circuit breakers
const circuitBreakerRegistry = new Registry();

// Custom metrics for circuit breaker monitoring
const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['name'],
  registers: [circuitBreakerRegistry]
});

const circuitBreakerFireCounter = new Counter({
  name: 'circuit_breaker_fire_total',
  help: 'Total number of circuit breaker fire attempts',
  labelNames: ['name', 'result'],
  registers: [circuitBreakerRegistry]
});

const circuitBreakerLatency = new Histogram({
  name: 'circuit_breaker_latency_seconds',
  help: 'Circuit breaker operation latency in seconds',
  labelNames: ['name'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [circuitBreakerRegistry]
});

const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['name', 'type'],
  registers: [circuitBreakerRegistry]
});

/**
 * Default circuit breaker configuration
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
  timeout: 3000,                    // Time in ms before a call is considered failed
  errorThresholdPercentage: 50,     // Error percentage at which to open circuit
  resetTimeout: 30000,              // Time in ms to wait before testing circuit
  volumeThreshold: 5,               // Minimum requests before tripping
  rollingCountTimeout: 10000,       // Rolling statistical window
  rollingCountBuckets: 10,          // Number of buckets in rolling window
  name: 'default',                  // Circuit breaker name for metrics
  group: 'default',                 // Group for organizing breakers
  rollingPercentilesEnabled: true,  // Enable percentile calculations
  capacity: 10,                     // Max concurrent requests (semaphore)
  errorFilter: null,                // Function to filter errors
  cache: false,                     // Enable caching
};

/**
 * Circuit breaker factory with Prometheus metrics integration
 */
class CircuitBreakerFactory {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create or retrieve a circuit breaker
   * @param {string} name - Unique identifier for the circuit breaker
   * @param {Function} action - The async function to protect
   * @param {Object} options - Circuit breaker configuration
   * @returns {CircuitBreaker} Configured circuit breaker instance
   */
  create(name, action, options = {}) {
    if (this.breakers.has(name)) {
      return this.breakers.get(name);
    }

    const config = {
      ...DEFAULT_OPTIONS,
      ...options,
      name
    };

    const breaker = new CircuitBreaker(action, config);

    // Register event handlers for metrics
    this._attachEventHandlers(breaker, name);

    // Store breaker reference
    this.breakers.set(name, breaker);

    return breaker;
  }

  /**
   * Attach Prometheus metrics event handlers
   * @private
   */
  _attachEventHandlers(breaker, name) {
    // Success events
    breaker.on('success', (result, latencyMs) => {
      circuitBreakerFireCounter.inc({ name, result: 'success' });
      circuitBreakerLatency.observe({ name }, latencyMs / 1000);
    });

    // Failure events
    breaker.on('failure', (error, latencyMs) => {
      circuitBreakerFireCounter.inc({ name, result: 'failure' });
      circuitBreakerFailures.inc({ name, type: 'failure' });
      circuitBreakerLatency.observe({ name }, latencyMs / 1000);
    });

    // Timeout events
    breaker.on('timeout', (latencyMs) => {
      circuitBreakerFireCounter.inc({ name, result: 'timeout' });
      circuitBreakerFailures.inc({ name, type: 'timeout' });
      circuitBreakerLatency.observe({ name }, latencyMs / 1000);
    });

    // Rejection events (circuit open)
    breaker.on('reject', () => {
      circuitBreakerFireCounter.inc({ name, result: 'rejected' });
      circuitBreakerFailures.inc({ name, type: 'rejected' });
    });

    // Fallback events
    breaker.on('fallback', (result) => {
      circuitBreakerFireCounter.inc({ name, result: 'fallback' });
    });

    // State change events
    breaker.on('open', () => {
      circuitBreakerState.set({ name }, 1);
      console.log(`[CircuitBreaker] ${name}: OPENED`);
    });

    breaker.on('halfOpen', () => {
      circuitBreakerState.set({ name }, 2);
      console.log(`[CircuitBreaker] ${name}: HALF-OPEN`);
    });

    breaker.on('close', () => {
      circuitBreakerState.set({ name }, 0);
      console.log(`[CircuitBreaker] ${name}: CLOSED`);
    });

    // Initialize state metric
    circuitBreakerState.set({ name }, 0);
  }

  /**
   * Get circuit breaker by name
   * @param {string} name - Circuit breaker name
   * @returns {CircuitBreaker|undefined}
   */
  get(name) {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breakers
   * @returns {Map}
   */
  getAll() {
    return this.breakers;
  }

  /**
   * Get health status of all circuit breakers
   * @returns {Object}
   */
  getHealthStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = {
        state: breaker.opened ? 'open' : (breaker.halfOpen ? 'halfOpen' : 'closed'),
        stats: breaker.stats,
        enabled: breaker.enabled,
        warmUp: breaker.warmUp,
        volumeThreshold: breaker.volumeThreshold
      };
    }
    return status;
  }

  /**
   * Shutdown all circuit breakers
   */
  shutdown() {
    for (const [name, breaker] of this.breakers) {
      breaker.shutdown();
      console.log(`[CircuitBreaker] ${name}: SHUTDOWN`);
    }
    this.breakers.clear();
  }
}

// Singleton factory instance
const factory = new CircuitBreakerFactory();

/**
 * Pre-configured circuit breakers for common use cases
 */
const presets = {
  /**
   * HTTP API calls - moderate timeout, standard thresholds
   */
  httpApi: {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 10
  },

  /**
   * Database operations - longer timeout, lower threshold
   */
  database: {
    timeout: 10000,
    errorThresholdPercentage: 30,
    resetTimeout: 60000,
    volumeThreshold: 5
  },

  /**
   * External services - aggressive timeout, quick reset
   */
  externalService: {
    timeout: 3000,
    errorThresholdPercentage: 60,
    resetTimeout: 15000,
    volumeThreshold: 5
  },

  /**
   * AI/ML inference - very long timeout, high threshold
   */
  aiInference: {
    timeout: 120000,
    errorThresholdPercentage: 70,
    resetTimeout: 60000,
    volumeThreshold: 3
  },

  /**
   * Cache operations - very short timeout
   */
  cache: {
    timeout: 1000,
    errorThresholdPercentage: 80,
    resetTimeout: 10000,
    volumeThreshold: 20
  }
};

/**
 * Express middleware for circuit breaker protection
 * @param {string} name - Circuit breaker name
 * @param {Function} handler - Route handler to protect
 * @param {Object} options - Circuit breaker options
 * @returns {Function} Express middleware
 */
function circuitBreakerMiddleware(name, handler, options = {}) {
  const breaker = factory.create(name, handler, options);

  // Set fallback if provided
  if (options.fallback) {
    breaker.fallback(options.fallback);
  }

  return async (req, res, next) => {
    try {
      const result = await breaker.fire(req, res);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      if (breaker.opened) {
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Circuit breaker is open',
          retryAfter: Math.ceil(breaker.options.resetTimeout / 1000)
        });
      } else {
        next(error);
      }
    }
  };
}

/**
 * Prometheus metrics endpoint handler
 * @returns {Promise<string>} Prometheus metrics output
 */
async function getMetrics() {
  return circuitBreakerRegistry.metrics();
}

/**
 * Get metrics content type
 * @returns {string}
 */
function getMetricsContentType() {
  return circuitBreakerRegistry.contentType;
}

// Export everything needed
module.exports = {
  // Factory for creating circuit breakers
  factory,
  
  // Convenience function for creating breakers
  createCircuitBreaker: (name, action, options) => factory.create(name, action, options),
  
  // Pre-configured presets
  presets,
  
  // Express middleware
  circuitBreakerMiddleware,
  
  // Metrics
  getMetrics,
  getMetricsContentType,
  circuitBreakerRegistry,
  
  // Default options for reference
  DEFAULT_OPTIONS,
  
  // Direct Opossum export for advanced usage
  CircuitBreaker
};
