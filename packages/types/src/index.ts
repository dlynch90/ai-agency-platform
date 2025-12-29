import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  domain: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;

export const UserRoleSchema = z.enum(['ADMIN', 'MANAGER', 'USER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: UserRoleSchema,
  tenantId: z.string().cuid(),
  clerkId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const UseCaseSchema = z.enum([
  'ECOMMERCE_PERSONALIZATION',
  'HEALTHCARE_TRIAGE',
  'FINANCIAL_PORTFOLIO',
  'LEGAL_DOCUMENT',
  'REAL_ESTATE',
  'EDUCATION_ADAPTIVE',
  'MANUFACTURING_QC',
  'CUSTOMER_SERVICE',
  'SUPPLY_CHAIN',
  'HR_TALENT_MATCHING',
]);

export type UseCase = z.infer<typeof UseCaseSchema>;

export const AIModelProviderSchema = z.enum([
  'OLLAMA',
  'OPENAI',
  'ANTHROPIC',
  'GOOGLE',
  'HUGGINGFACE',
]);

export type AIModelProvider = z.infer<typeof AIModelProviderSchema>;

export const AIRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().default('llama3.2'),
  provider: AIModelProviderSchema.default('OLLAMA'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4096).default(1024),
  topP: z.number().min(0).max(1).default(0.9),
  tenantId: z.string().cuid(),
  useCase: UseCaseSchema,
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

export const AIResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  provider: AIModelProviderSchema,
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  latencyMs: z.number(),
  costUsd: z.number().optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

export const EvaluationMetricSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(1),
  threshold: z.number().min(0).max(1),
  passed: z.boolean(),
});

export type EvaluationMetric = z.infer<typeof EvaluationMetricSchema>;

export const HyperparameterConfigSchema = z.object({
  model: z.array(z.string()),
  temperature: z.array(z.number()),
  topP: z.array(z.number()),
  maxTokens: z.array(z.number()),
});

export type HyperparameterConfig = z.infer<typeof HyperparameterConfigSchema>;

export const GraphQLSubgraphSchema = z.enum([
  'USERS',
  'PRODUCTS',
  'ORDERS',
  'CAMPAIGNS',
  'ANALYTICS',
  'TICKETS',
  'KNOWLEDGE',
]);

export type GraphQLSubgraph = z.infer<typeof GraphQLSubgraphSchema>;

export const FederationContextSchema = z.object({
  tenantId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  subgraphs: z.array(GraphQLSubgraphSchema),
});

export type FederationContext = z.infer<typeof FederationContextSchema>;
