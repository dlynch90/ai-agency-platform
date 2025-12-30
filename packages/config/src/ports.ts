/**
 * SSOT Port Configuration
 * All service ports centralized with environment variable overrides
 * Values from chezmoidata.toml: services.*.port
 */

export const PORTS = {
  // Vector Databases
  qdrant: parseInt(process.env.QDRANT_PORT || '6333', 10),
  qdrantGrpc: parseInt(process.env.QDRANT_GRPC_PORT || '6334', 10),

  // Graph Database
  neo4jBolt: parseInt(process.env.NEO4J_BOLT_PORT || '7687', 10),
  neo4jHttp: parseInt(process.env.NEO4J_HTTP_PORT || '7474', 10),

  // Cache
  redis: parseInt(process.env.REDIS_PORT || '6379', 10),

  // Relational Database
  postgres: parseInt(process.env.POSTGRES_PORT || '5432', 10),

  // AI/ML Services
  ollama: parseInt(process.env.OLLAMA_PORT || '11434', 10),
  litellm: parseInt(process.env.LITELLM_PORT || '4000', 10),

  // Observability
  langfuse: parseInt(process.env.LANGFUSE_PORT || '3000', 10),

  // Memory Services
  mem0: parseInt(process.env.MEM0_PORT || '3001', 10),
  pytorch: parseInt(process.env.PYTORCH_PORT || '3002', 10),

  // Message Queue
  kafka: parseInt(process.env.KAFKA_PORT || '9092', 10),
} as const;

export const HOSTS = {
  qdrant: process.env.QDRANT_HOST || 'localhost',
  neo4j: process.env.NEO4J_HOST || 'localhost',
  redis: process.env.REDIS_HOST || 'localhost',
  postgres: process.env.POSTGRES_HOST || 'localhost',
  ollama: process.env.OLLAMA_HOST || 'localhost',
  litellm: process.env.LITELLM_HOST || 'localhost',
  langfuse: process.env.LANGFUSE_HOST || 'localhost',
  kafka: process.env.KAFKA_HOST || 'localhost',
} as const;

/**
 * Get full URL for a service
 */
export function getServiceUrl(
  service: keyof typeof HOSTS,
  protocol: 'http' | 'https' | 'bolt' | 'redis' = 'http'
): string {
  const host = HOSTS[service];
  const port = PORTS[service as keyof typeof PORTS];

  switch (protocol) {
    case 'bolt':
      return `bolt://${host}:${PORTS.neo4jBolt}`;
    case 'redis':
      return `redis://${host}:${PORTS.redis}`;
    default:
      return `${protocol}://${host}:${port}`;
  }
}

// Pre-built connection strings
export const CONNECTION_STRINGS = {
  qdrant: () => getServiceUrl('qdrant'),
  neo4j: () => getServiceUrl('neo4j', 'bolt'),
  redis: () => getServiceUrl('redis', 'redis'),
  ollama: () => getServiceUrl('ollama'),
  litellm: () => getServiceUrl('litellm'),
} as const;
