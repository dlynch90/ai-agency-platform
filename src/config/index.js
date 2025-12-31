/**
 * AI Agency Platform - Centralized Configuration Manager
 * Eliminates all hardcoded values and provides type-safe configuration
 */

require('dotenv').config();

/**
 * Get environment variable with validation and default value
 */
function getEnv(key, defaultValue = undefined, required = false) {
  const value = process.env[key];

  if (value === undefined || value === '') {
    if (required) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return defaultValue;
  }

  return value;
}

/**
 * Get integer environment variable
 */
function getEnvInt(key, defaultValue = 0) {
  const value = getEnv(key);
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get float environment variable
 */
function getEnvFloat(key, defaultValue = 0.0) {
  const value = getEnv(key);
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get boolean environment variable
 */
function getEnvBool(key, defaultValue = false) {
  const value = getEnv(key);
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get array environment variable (comma-separated)
 */
function getEnvArray(key, defaultValue = []) {
  const value = getEnv(key);
  if (value === undefined || value === '') return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Main configuration object
 */
const config = {
  // ============================================================================
  // APPLICATION
  // ============================================================================
  app: {
    name: getEnv('APP_NAME', 'ai-agency-platform'),
    version: getEnv('APP_VERSION', '1.0.0'),
    env: getEnv('NODE_ENV', 'development'),
    port: getEnvInt('APP_PORT', 8080),
    host: getEnv('APP_HOST', '0.0.0.0'),
    url: getEnv('APP_URL', 'http://localhost:8080'),
    apiVersion: getEnv('API_VERSION', 'v1'),
    logLevel: getEnv('LOG_LEVEL', 'info'),
    debug: getEnvBool('DEBUG', false),
    isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
    isProduction: getEnv('NODE_ENV', 'development') === 'production',
    isTest: getEnv('NODE_ENV', 'development') === 'test',
  },

  // ============================================================================
  // AUTHENTICATION - CLERK
  // ============================================================================
  clerk: {
    publishableKey: getEnv('CLERK_PUBLISHABLE_KEY'),
    secretKey: getEnv('CLERK_SECRET_KEY'),
    webhookSecret: getEnv('CLERK_WEBHOOK_SECRET'),
    jwtKey: getEnv('CLERK_JWT_KEY'),
    frontendApi: getEnv('CLERK_FRONTEND_API'),
    apiUrl: getEnv('CLERK_API_URL', 'https://api.clerk.dev'),
    enabled: Boolean(getEnv('CLERK_SECRET_KEY')),
  },

  // ============================================================================
  // DATABASE - SUPABASE
  // ============================================================================
  supabase: {
    url: getEnv('SUPABASE_URL'),
    anonKey: getEnv('SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: getEnv('SUPABASE_JWT_SECRET'),
    dbUrl: getEnv('SUPABASE_DB_URL'),
    storageUrl: getEnv('SUPABASE_STORAGE_URL'),
    realtimeUrl: getEnv('SUPABASE_REALTIME_URL'),
    enabled: Boolean(getEnv('SUPABASE_URL')),
  },

  // ============================================================================
  // DATABASE - POSTGRESQL
  // ============================================================================
  postgres: {
    host: getEnv('POSTGRES_HOST', 'localhost'),
    port: getEnvInt('POSTGRES_PORT', 5432),
    user: getEnv('POSTGRES_USER', 'postgres'),
    password: getEnv('POSTGRES_PASSWORD'),
    database: getEnv('POSTGRES_DB', 'ai_agency'),
    ssl: getEnvBool('POSTGRES_SSL', false),
    maxConnections: getEnvInt('POSTGRES_MAX_CONNECTIONS', 20),
    poolMin: getEnvInt('POSTGRES_POOL_MIN', 2),
    poolMax: getEnvInt('POSTGRES_POOL_MAX', 10),
    get url() {
      return getEnv('DATABASE_URL') ||
        `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
    },
  },

  // ============================================================================
  // DATABASE - REDIS
  // ============================================================================
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvInt('REDIS_PORT', 6379),
    password: getEnv('REDIS_PASSWORD'),
    db: getEnvInt('REDIS_DB', 0),
    tls: getEnvBool('REDIS_TLS', false),
    maxConnections: getEnvInt('REDIS_MAX_CONNECTIONS', 20),
    get url() {
      const auth = this.password ? `:${this.password}@` : '';
      return getEnv('REDIS_URL') || `redis://${auth}${this.host}:${this.port}/${this.db}`;
    },
  },

  // ============================================================================
  // DATABASE - NEO4J
  // ============================================================================
  neo4j: {
    host: getEnv('NEO4J_HOST', 'localhost'),
    boltPort: getEnvInt('NEO4J_BOLT_PORT', 7687),
    httpPort: getEnvInt('NEO4J_HTTP_PORT', 7474),
    user: getEnv('NEO4J_USER', 'neo4j'),
    password: getEnv('NEO4J_PASSWORD'),
    database: getEnv('NEO4J_DATABASE', 'neo4j'),
    maxConnections: getEnvInt('NEO4J_MAX_CONNECTIONS', 10),
    get uri() {
      return getEnv('NEO4J_URI') || `bolt://${this.host}:${this.boltPort}`;
    },
  },

  // ============================================================================
  // VECTOR DATABASE - QDRANT
  // ============================================================================
  qdrant: {
    host: getEnv('QDRANT_HOST', 'localhost'),
    port: getEnvInt('QDRANT_PORT', 6333),
    grpcPort: getEnvInt('QDRANT_GRPC_PORT', 6334),
    apiKey: getEnv('QDRANT_API_KEY'),
    collection: getEnv('QDRANT_COLLECTION', 'ai_agency_vectors'),
    get url() {
      return getEnv('QDRANT_URL') || `http://${this.host}:${this.port}`;
    },
  },

  // ============================================================================
  // MESSAGE QUEUE - KAFKA
  // ============================================================================
  kafka: {
    brokers: getEnvArray('KAFKA_BROKERS', ['localhost:9092']),
    clientId: getEnv('KAFKA_CLIENT_ID', 'ai-agency'),
    groupId: getEnv('KAFKA_GROUP_ID', 'ai-agency-group'),
    ssl: getEnvBool('KAFKA_SSL', false),
    sasl: {
      mechanism: getEnv('KAFKA_SASL_MECHANISM'),
      username: getEnv('KAFKA_SASL_USERNAME'),
      password: getEnv('KAFKA_SASL_PASSWORD'),
    },
    maxConnections: getEnvInt('KAFKA_MAX_CONNECTIONS', 10),
  },

  // ============================================================================
  // MESSAGE QUEUE - RABBITMQ
  // ============================================================================
  rabbitmq: {
    host: getEnv('RABBITMQ_HOST', 'localhost'),
    port: getEnvInt('RABBITMQ_PORT', 5672),
    user: getEnv('RABBITMQ_USER', 'guest'),
    password: getEnv('RABBITMQ_PASSWORD', 'guest'),
    vhost: getEnv('RABBITMQ_VHOST', '/'),
    maxConnections: getEnvInt('RABBITMQ_MAX_CONNECTIONS', 15),
    get url() {
      return getEnv('RABBITMQ_URL') ||
        `amqp://${this.user}:${this.password}@${this.host}:${this.port}${this.vhost}`;
    },
  },

  // ============================================================================
  // WORKFLOW ENGINE - TEMPORAL
  // ============================================================================
  temporal: {
    address: getEnv('TEMPORAL_ADDRESS', 'localhost:7233'),
    namespace: getEnv('TEMPORAL_NAMESPACE', 'default'),
    taskQueue: getEnv('TEMPORAL_TASK_QUEUE', 'ai-agency-tasks'),
    workerCount: getEnvInt('TEMPORAL_WORKER_COUNT', 4),
    uiPort: getEnvInt('TEMPORAL_UI_PORT', 8080),
  },

  // ============================================================================
  // API GATEWAY - KONG
  // ============================================================================
  kong: {
    proxyUrl: getEnv('KONG_PROXY_URL', 'http://localhost:8000'),
    adminUrl: getEnv('KONG_ADMIN_URL', 'http://localhost:8001'),
    proxySslUrl: getEnv('KONG_PROXY_SSL_URL', 'https://localhost:8443'),
    adminSslUrl: getEnv('KONG_ADMIN_SSL_URL', 'https://localhost:8444'),
    database: getEnv('KONG_DATABASE', 'off'),
  },

  // ============================================================================
  // GRAPHQL
  // ============================================================================
  graphql: {
    endpoint: getEnv('GRAPHQL_ENDPOINT', '/graphql'),
    port: getEnvInt('GRAPHQL_PORT', 4000),
    playground: getEnvBool('GRAPHQL_PLAYGROUND', true),
    introspection: getEnvBool('GRAPHQL_INTROSPECTION', true),
    debug: getEnvBool('GRAPHQL_DEBUG', false),
    depthLimit: getEnvInt('GRAPHQL_DEPTH_LIMIT', 10),
    complexityLimit: getEnvInt('GRAPHQL_COMPLEXITY_LIMIT', 1000),
  },

  // ============================================================================
  // AI/ML - OPENAI
  // ============================================================================
  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
    orgId: getEnv('OPENAI_ORG_ID'),
    model: getEnv('OPENAI_MODEL', 'gpt-4'),
    embeddingModel: getEnv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
    maxTokens: getEnvInt('OPENAI_MAX_TOKENS', 4096),
    temperature: getEnvFloat('OPENAI_TEMPERATURE', 0.7),
    enabled: Boolean(getEnv('OPENAI_API_KEY')),
  },

  // ============================================================================
  // AI/ML - ANTHROPIC
  // ============================================================================
  anthropic: {
    apiKey: getEnv('ANTHROPIC_API_KEY'),
    model: getEnv('ANTHROPIC_MODEL', 'claude-3-opus-20240229'),
    maxTokens: getEnvInt('ANTHROPIC_MAX_TOKENS', 4096),
    enabled: Boolean(getEnv('ANTHROPIC_API_KEY')),
  },

  // ============================================================================
  // AI/ML - HUGGINGFACE
  // ============================================================================
  huggingface: {
    apiKey: getEnv('HUGGINGFACE_API_KEY'),
    model: getEnv('HUGGINGFACE_MODEL'),
    endpoint: getEnv('HUGGINGFACE_ENDPOINT'),
    enabled: Boolean(getEnv('HUGGINGFACE_API_KEY')),
  },

  // ============================================================================
  // AI/ML - OLLAMA
  // ============================================================================
  ollama: {
    host: getEnv('OLLAMA_HOST', 'localhost'),
    port: getEnvInt('OLLAMA_PORT', 11434),
    model: getEnv('OLLAMA_MODEL', 'llama3'),
    get url() {
      return getEnv('OLLAMA_URL') || `http://${this.host}:${this.port}`;
    },
  },

  // ============================================================================
  // AI/ML - LITELLM
  // ============================================================================
  litellm: {
    host: getEnv('LITELLM_HOST', 'localhost'),
    port: getEnvInt('LITELLM_PORT', 4000),
    masterKey: getEnv('LITELLM_MASTER_KEY'),
    get url() {
      return getEnv('LITELLM_URL') || `http://${this.host}:${this.port}`;
    },
  },

  // ============================================================================
  // ML TRACKING - MLFLOW
  // ============================================================================
  mlflow: {
    trackingUri: getEnv('MLFLOW_TRACKING_URI', 'http://localhost:5000'),
    experimentName: getEnv('MLFLOW_EXPERIMENT_NAME', 'ai-agency'),
    s3EndpointUrl: getEnv('MLFLOW_S3_ENDPOINT_URL'),
    artifactRoot: getEnv('MLFLOW_ARTIFACT_ROOT', './mlruns'),
  },

  // ============================================================================
  // SEARCH - ELASTICSEARCH
  // ============================================================================
  elasticsearch: {
    host: getEnv('ELASTICSEARCH_HOST', 'localhost'),
    port: getEnvInt('ELASTICSEARCH_PORT', 9200),
    user: getEnv('ELASTICSEARCH_USER'),
    password: getEnv('ELASTICSEARCH_PASSWORD'),
    index: getEnv('ELASTICSEARCH_INDEX', 'ai_agency'),
    get url() {
      return getEnv('ELASTICSEARCH_URL') || `http://${this.host}:${this.port}`;
    },
  },

  // ============================================================================
  // MONITORING - PROMETHEUS & GRAFANA
  // ============================================================================
  monitoring: {
    prometheus: {
      host: getEnv('PROMETHEUS_HOST', 'localhost'),
      port: getEnvInt('PROMETHEUS_PORT', 9090),
      get url() {
        return getEnv('PROMETHEUS_URL') || `http://${this.host}:${this.port}`;
      },
    },
    grafana: {
      host: getEnv('GRAFANA_HOST', 'localhost'),
      port: getEnvInt('GRAFANA_PORT', 3000),
      adminUser: getEnv('GRAFANA_ADMIN_USER', 'admin'),
      adminPassword: getEnv('GRAFANA_ADMIN_PASSWORD'),
      get url() {
        return getEnv('GRAFANA_URL') || `http://${this.host}:${this.port}`;
      },
    },
  },

  // ============================================================================
  // LOGGING - DATADOG
  // ============================================================================
  datadog: {
    apiKey: getEnv('DD_API_KEY'),
    appKey: getEnv('DD_APP_KEY'),
    site: getEnv('DD_SITE', 'datadoghq.com'),
    env: getEnv('DD_ENV', 'development'),
    service: getEnv('DD_SERVICE', 'ai-agency'),
    logsEnabled: getEnvBool('DD_LOGS_ENABLED', true),
    apmEnabled: getEnvBool('DD_APM_ENABLED', true),
    enabled: Boolean(getEnv('DD_API_KEY')),
  },

  // ============================================================================
  // STORAGE - AWS S3
  // ============================================================================
  s3: {
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
    region: getEnv('AWS_REGION', 'us-east-1'),
    bucket: getEnv('AWS_S3_BUCKET', 'ai-agency-storage'),
    endpoint: getEnv('AWS_S3_ENDPOINT'),
    usePathStyle: getEnvBool('S3_USE_PATH_STYLE', false),
    enabled: Boolean(getEnv('AWS_ACCESS_KEY_ID')),
  },

  // ============================================================================
  // EMAIL - SENDGRID
  // ============================================================================
  sendgrid: {
    apiKey: getEnv('SENDGRID_API_KEY'),
    fromEmail: getEnv('SENDGRID_FROM_EMAIL'),
    fromName: getEnv('SENDGRID_FROM_NAME', 'AI Agency'),
    enabled: Boolean(getEnv('SENDGRID_API_KEY')),
  },

  // ============================================================================
  // EMAIL - RESEND
  // ============================================================================
  resend: {
    apiKey: getEnv('RESEND_API_KEY'),
    fromEmail: getEnv('RESEND_FROM_EMAIL'),
    enabled: Boolean(getEnv('RESEND_API_KEY')),
  },

  // ============================================================================
  // PAYMENTS - STRIPE
  // ============================================================================
  stripe: {
    publishableKey: getEnv('STRIPE_PUBLISHABLE_KEY'),
    secretKey: getEnv('STRIPE_SECRET_KEY'),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
    priceId: getEnv('STRIPE_PRICE_ID'),
    enabled: Boolean(getEnv('STRIPE_SECRET_KEY')),
  },

  // ============================================================================
  // CRM INTEGRATIONS
  // ============================================================================
  crm: {
    hubspot: {
      apiKey: getEnv('HUBSPOT_API_KEY'),
      portalId: getEnv('HUBSPOT_PORTAL_ID'),
      enabled: Boolean(getEnv('HUBSPOT_API_KEY')),
    },
    salesforce: {
      clientId: getEnv('SALESFORCE_CLIENT_ID'),
      clientSecret: getEnv('SALESFORCE_CLIENT_SECRET'),
      instanceUrl: getEnv('SALESFORCE_INSTANCE_URL'),
      enabled: Boolean(getEnv('SALESFORCE_CLIENT_ID')),
    },
  },

  // ============================================================================
  // MARKETING INTEGRATIONS
  // ============================================================================
  marketing: {
    mailchimp: {
      apiKey: getEnv('MAILCHIMP_API_KEY'),
      listId: getEnv('MAILCHIMP_LIST_ID'),
      enabled: Boolean(getEnv('MAILCHIMP_API_KEY')),
    },
    googleAnalytics: {
      trackingId: getEnv('GA_TRACKING_ID'),
      enabled: Boolean(getEnv('GA_TRACKING_ID')),
    },
    segment: {
      writeKey: getEnv('SEGMENT_WRITE_KEY'),
      enabled: Boolean(getEnv('SEGMENT_WRITE_KEY')),
    },
    mixpanel: {
      token: getEnv('MIXPANEL_TOKEN'),
      enabled: Boolean(getEnv('MIXPANEL_TOKEN')),
    },
  },

  // ============================================================================
  // NOTION INTEGRATION
  // ============================================================================
  notion: {
    apiKey: getEnv('NOTION_API_KEY'),
    databaseId: getEnv('NOTION_DATABASE_ID'),
    workspaceId: getEnv('NOTION_WORKSPACE_ID'),
    enabled: Boolean(getEnv('NOTION_API_KEY')),
  },

  // ============================================================================
  // GOOGLE SHEETS INTEGRATION
  // ============================================================================
  googleSheets: {
    apiKey: getEnv('GOOGLE_SHEETS_API_KEY'),
    clientId: getEnv('GOOGLE_SHEETS_CLIENT_ID'),
    clientSecret: getEnv('GOOGLE_SHEETS_CLIENT_SECRET'),
    refreshToken: getEnv('GOOGLE_SHEETS_REFRESH_TOKEN'),
    enabled: Boolean(getEnv('GOOGLE_SHEETS_CLIENT_ID')),
  },

  // ============================================================================
  // GITHUB
  // ============================================================================
  github: {
    token: getEnv('GITHUB_TOKEN'),
    webhookSecret: getEnv('GITHUB_WEBHOOK_SECRET'),
    appId: getEnv('GITHUB_APP_ID'),
    appPrivateKey: getEnv('GITHUB_APP_PRIVATE_KEY'),
    org: getEnv('GITHUB_ORG'),
    enabled: Boolean(getEnv('GITHUB_TOKEN')),
  },

  // ============================================================================
  // SLACK
  // ============================================================================
  slack: {
    botToken: getEnv('SLACK_BOT_TOKEN'),
    signingSecret: getEnv('SLACK_SIGNING_SECRET'),
    appToken: getEnv('SLACK_APP_TOKEN'),
    webhookUrl: getEnv('SLACK_WEBHOOK_URL'),
    enabled: Boolean(getEnv('SLACK_BOT_TOKEN')),
  },

  // ============================================================================
  // DISCORD
  // ============================================================================
  discord: {
    botToken: getEnv('DISCORD_BOT_TOKEN'),
    clientId: getEnv('DISCORD_CLIENT_ID'),
    clientSecret: getEnv('DISCORD_CLIENT_SECRET'),
    webhookUrl: getEnv('DISCORD_WEBHOOK_URL'),
    enabled: Boolean(getEnv('DISCORD_BOT_TOKEN')),
  },

  // ============================================================================
  // SECURITY
  // ============================================================================
  security: {
    jwtSecret: getEnv('JWT_SECRET'),
    jwtExpiry: getEnvInt('JWT_EXPIRY', 86400),
    jwtRefreshExpiry: getEnvInt('JWT_REFRESH_EXPIRY', 604800),
    encryptionKey: getEnv('ENCRYPTION_KEY'),
    corsOrigins: getEnvArray('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:8080']),
    rateLimit: {
      max: getEnvInt('RATE_LIMIT_MAX', 100),
      window: getEnvInt('RATE_LIMIT_WINDOW', 60000),
    },
  },

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================
  features: {
    marketingModule: getEnvBool('FEATURE_MARKETING_MODULE', true),
    webDesignModule: getEnvBool('FEATURE_WEB_DESIGN_MODULE', true),
    crmModule: getEnvBool('FEATURE_CRM_MODULE', true),
    excelModule: getEnvBool('FEATURE_EXCEL_MODULE', true),
    notionModule: getEnvBool('FEATURE_NOTION_MODULE', true),
    aiAgents: getEnvBool('FEATURE_AI_AGENTS', true),
    analytics: getEnvBool('FEATURE_ANALYTICS', true),
    realtime: getEnvBool('FEATURE_REALTIME', true),
  },

  // ============================================================================
  // TESTING
  // ============================================================================
  testing: {
    databaseUrl: getEnv('TEST_DATABASE_URL'),
    redisUrl: getEnv('TEST_REDIS_URL'),
    e2eBaseUrl: getEnv('E2E_BASE_URL', 'http://localhost:3000'),
    playwrightHeadless: getEnvBool('PLAYWRIGHT_HEADLESS', true),
    jestTimeout: getEnvInt('JEST_TIMEOUT', 30000),
  },

  // ============================================================================
  // STATISTICAL ANALYSIS (Binomial Distribution / PDE)
  // ============================================================================
  statistics: {
    binomial: {
      n: getEnvInt('STAT_BINOMIAL_N', 5),
      p: getEnvFloat('STAT_BINOMIAL_P', 0.10),
      confidenceLevel: getEnvFloat('STAT_CONFIDENCE_LEVEL', 0.95),
      tailThreshold: getEnvFloat('STAT_TAIL_THRESHOLD', 0.05),
    },
    fea: {
      meshDensity: getEnvInt('FEA_MESH_DENSITY', 100),
      tolerance: getEnvFloat('FEA_TOLERANCE', 1e-6),
      maxIterations: getEnvInt('FEA_MAX_ITERATIONS', 1000),
      solverType: getEnv('FEA_SOLVER_TYPE', 'direct'),
    },
    pde: {
      gridSize: getEnvInt('PDE_GRID_SIZE', 50),
      timeSteps: getEnvInt('PDE_TIME_STEPS', 1000),
      boundaryType: getEnv('PDE_BOUNDARY_TYPE', 'dirichlet'),
      method: getEnv('PDE_METHOD', 'finite_difference'),
    },
  },
};

/**
 * Validate required configuration
 */
function validateConfig() {
  const errors = [];
  const warnings = [];

  // Production requirements
  if (config.app.isProduction) {
    if (!config.security.jwtSecret) {
      errors.push('JWT_SECRET is required in production');
    }
    if (!config.postgres.password) {
      errors.push('POSTGRES_PASSWORD is required in production');
    }
    if (config.graphql.introspection) {
      warnings.push('GraphQL introspection should be disabled in production');
    }
    if (config.graphql.playground) {
      warnings.push('GraphQL playground should be disabled in production');
    }
  }

  // Warn about disabled integrations
  if (!config.clerk.enabled && !config.supabase.enabled) {
    warnings.push('No authentication provider configured (Clerk or Supabase)');
  }

  return { errors, warnings, valid: errors.length === 0 };
}

/**
 * Print configuration summary
 */
function printConfigSummary() {
  console.log('\n=== AI Agency Platform Configuration ===\n');
  console.log(`Environment: ${config.app.env}`);
  console.log(`App URL: ${config.app.url}`);
  console.log(`API Version: ${config.app.apiVersion}`);
  console.log('\n--- Enabled Integrations ---');
  console.log(`Clerk Auth: ${config.clerk.enabled ? '✓' : '✗'}`);
  console.log(`Supabase: ${config.supabase.enabled ? '✓' : '✗'}`);
  console.log(`OpenAI: ${config.openai.enabled ? '✓' : '✗'}`);
  console.log(`Anthropic: ${config.anthropic.enabled ? '✓' : '✗'}`);
  console.log(`Stripe: ${config.stripe.enabled ? '✓' : '✗'}`);
  console.log(`Notion: ${config.notion.enabled ? '✓' : '✗'}`);
  console.log(`Google Sheets: ${config.googleSheets.enabled ? '✓' : '✗'}`);
  console.log(`HubSpot CRM: ${config.crm.hubspot.enabled ? '✓' : '✗'}`);
  console.log(`Salesforce CRM: ${config.crm.salesforce.enabled ? '✓' : '✗'}`);
  console.log(`Slack: ${config.slack.enabled ? '✓' : '✗'}`);
  console.log(`Discord: ${config.discord.enabled ? '✓' : '✗'}`);
  console.log('\n--- Feature Flags ---');
  Object.entries(config.features).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✓' : '✗'}`);
  });
  console.log('\n');
}

// Export configuration and utilities
module.exports = {
  config,
  getEnv,
  getEnvInt,
  getEnvFloat,
  getEnvBool,
  getEnvArray,
  validateConfig,
  printConfigSummary,
  default: config,
};
