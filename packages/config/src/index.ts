import { z } from 'zod';

// Environment configuration schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  NEO4J_URI: z.string().url().optional(),
  QDRANT_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
});

// Parse environment variables
const env = envSchema.parse(process.env);

// Configuration object
export const config = {
  env,
  database: {
    url: env.DATABASE_URL,
  },
  redis: env.REDIS_URL ? { url: env.REDIS_URL } : undefined,
  neo4j: env.NEO4J_URI ? { uri: env.NEO4J_URI } : undefined,
  qdrant: env.QDRANT_URL ? { url: env.QDRANT_URL } : undefined,
  ai: {
    openai: env.OPENAI_API_KEY ? { apiKey: env.OPENAI_API_KEY } : undefined,
    anthropic: env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : undefined,
    google: env.GOOGLE_API_KEY ? { apiKey: env.GOOGLE_API_KEY } : undefined,
  },
  auth: {
    clerk: env.CLERK_SECRET_KEY ? { secretKey: env.CLERK_SECRET_KEY } : undefined,
  },
};

// Use case configurations
export const USE_CASE_CONFIG = {
  ecommerce: {
    name: 'E-commerce Personalization',
    description: 'AI-powered product recommendations and personalization',
    models: ['gpt-4', 'claude-3-sonnet', 'gemini-pro'],
    defaultModel: 'gpt-4',
    hyperparameters: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
  healthcare: {
    name: 'Healthcare Analytics',
    description: 'Medical data analysis and insights',
    models: ['gpt-4', 'claude-3-sonnet'],
    defaultModel: 'gpt-4',
    hyperparameters: {
      temperature: 0.1,
      maxTokens: 2000,
    },
  },
  finance: {
    name: 'Financial Analysis',
    description: 'Market analysis and financial insights',
    models: ['gpt-4', 'claude-3-sonnet'],
    defaultModel: 'gpt-4',
    hyperparameters: {
      temperature: 0.2,
      maxTokens: 1500,
    },
  },
};

// Hyperparameter defaults
export const HYPERPARAMETER_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
};