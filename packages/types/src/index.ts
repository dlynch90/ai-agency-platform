import { z } from 'zod';

// AI Request Schema
export const AIRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  useCase: z.string().optional(),
  tenantId: z.string().optional(),
  provider: z.enum(['openai', 'anthropic', 'google']).optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

// AI Response Schema
export const AIResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
  finishReason: z.string().optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// Configuration types
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

// Use case configuration
export interface UseCaseConfig {
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
  hyperparameters: Record<string, any>;
}

// Hyperparameter defaults
export interface HyperparameterDefaults {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}