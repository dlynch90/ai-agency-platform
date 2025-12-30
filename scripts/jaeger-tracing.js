/**
 * Jaeger Distributed Tracing Integration
 * Vendor implementation using OpenTelemetry SDK
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const JAEGER_CONFIG = {
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  serviceName: process.env.OTEL_SERVICE_NAME || 'ai-agency-platform',
  environment: process.env.NODE_ENV || 'development'
};

let sdk = null;

async function initializeTracing(config = {}) {
  const mergedConfig = { ...JAEGER_CONFIG, ...config };

  const exporter = new JaegerExporter({
    endpoint: mergedConfig.endpoint
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: mergedConfig.serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: mergedConfig.environment
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false }
      })
    ]
  });

  await sdk.start();
  console.log(`[Tracing] Jaeger initialized: ${mergedConfig.serviceName}`);

  process.on('SIGTERM', () => shutdown());
  process.on('SIGINT', () => shutdown());

  return sdk;
}

async function shutdown() {
  if (sdk) {
    await sdk.shutdown();
    console.log('[Tracing] Jaeger shutdown complete');
  }
}

function getTracer(name = 'default') {
  return trace.getTracer(name);
}

function createSpan(name, options = {}) {
  const tracer = getTracer(options.tracerName);
  return tracer.startSpan(name, options);
}

async function withSpan(name, fn, options = {}) {
  const tracer = getTracer(options.tracerName);
  
  return tracer.startActiveSpan(name, options, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

function tracingMiddleware(options = {}) {
  return (req, res, next) => {
    const tracer = getTracer(options.tracerName || 'http');
    const spanName = `${req.method} ${req.path}`;

    tracer.startActiveSpan(spanName, (span) => {
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.url);
      span.setAttribute('http.target', req.path);
      
      if (req.headers['x-request-id']) {
        span.setAttribute('http.request_id', req.headers['x-request-id']);
      }

      const originalEnd = res.end;
      res.end = function(...args) {
        span.setAttribute('http.status_code', res.statusCode);
        
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
        return originalEnd.apply(this, args);
      };

      next();
    });
  };
}

function injectTraceContext(headers = {}) {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    headers['x-trace-id'] = spanContext.traceId;
    headers['x-span-id'] = spanContext.spanId;
  }
  return headers;
}

function extractTraceContext(headers) {
  return {
    traceId: headers['x-trace-id'],
    spanId: headers['x-span-id'],
    parentSpanId: headers['x-parent-span-id']
  };
}

module.exports = {
  initializeTracing,
  shutdown,
  getTracer,
  createSpan,
  withSpan,
  tracingMiddleware,
  injectTraceContext,
  extractTraceContext,
  JAEGER_CONFIG
};
