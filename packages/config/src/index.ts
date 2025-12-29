import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  NEO4J_URI: z.string().optional(),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().optional(),
  QDRANT_URL: z.string().url().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  LITELLM_BASE_URL: z.string().url().default('http://localhost:4000'),
  MLFLOW_TRACKING_URI: z.string().url().default('http://localhost:5000'),
  OPTUNA_STORAGE: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

export function getConfig(): Env {
  const result = EnvSchema.safeParse(process.env);
  
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
  }
  
  return result.data;
}

export const config = {
  get env() {
    return getConfig();
  },
  
  get isDevelopment() {
    return this.env.NODE_ENV === 'development';
  },
  
  get isProduction() {
    return this.env.NODE_ENV === 'production';
  },
  
  get isTest() {
    return this.env.NODE_ENV === 'test';
  },
};

export const USE_CASE_CONFIG = {
  ECOMMERCE_PERSONALIZATION: {
    defaultModel: 'llama3.2',
    subgraphs: ['PRODUCTS', 'USERS', 'ORDERS'],
    vectorDb: 'qdrant',
  },
  HEALTHCARE_TRIAGE: {
    defaultModel: 'llama3.2',
    subgraphs: ['USERS', 'ANALYTICS'],
    vectorDb: 'neo4j',
  },
  FINANCIAL_PORTFOLIO: {
    defaultModel: 'gpt-4o',
    subgraphs: ['USERS', 'ANALYTICS'],
    vectorDb: 'qdrant',
  },
  LEGAL_DOCUMENT: {
    defaultModel: 'claude-sonnet-4',
    subgraphs: ['USERS', 'ANALYTICS'],
    vectorDb: 'elasticsearch',
  },
  REAL_ESTATE: {
    defaultModel: 'llama3.2',
    subgraphs: ['PRODUCTS', 'USERS', 'ANALYTICS'],
    vectorDb: 'postgis',
  },
  EDUCATION_ADAPTIVE: {
    defaultModel: 'llama3.2',
    subgraphs: ['USERS', 'ANALYTICS'],
    vectorDb: 'redis',
  },
  MANUFACTURING_QC: {
    defaultModel: 'llama3.2',
    subgraphs: ['PRODUCTS', 'ANALYTICS'],
    vectorDb: 'influxdb',
  },
  CUSTOMER_SERVICE: {
    defaultModel: 'llama3.2',
    subgraphs: ['TICKETS', 'USERS', 'KNOWLEDGE'],
    vectorDb: 'qdrant',
  },
  SUPPLY_CHAIN: {
    defaultModel: 'gpt-4o',
    subgraphs: ['PRODUCTS', 'ORDERS', 'ANALYTICS'],
    vectorDb: 'neo4j',
  },
  HR_TALENT_MATCHING: {
    defaultModel: 'llama3.2',
    subgraphs: ['USERS', 'ANALYTICS'],
    vectorDb: 'qdrant',
  },
} as const;

export const HYPERPARAMETER_DEFAULTS = {
  model: ['llama3.2', 'codellama', 'gpt-4o', 'claude-sonnet-4'],
  temperature: [0.0, 0.3, 0.7, 1.0],
  topP: [0.5, 0.9, 1.0],
  maxTokens: [256, 512, 1024, 2048],
} as const;
