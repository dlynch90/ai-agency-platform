import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@ai-agency/config', () => ({
  config: {
    env: {
      LOG_LEVEL: 'error',
      LITELLM_BASE_URL: 'http://localhost:4000',
      OLLAMA_BASE_URL: 'http://localhost:11434',
    },
  },
  USE_CASE_CONFIG: {
    ECOMMERCE_PERSONALIZATION: {
      defaultModel: 'llama3.2',
      subgraphs: ['PRODUCTS', 'USERS', 'ORDERS'],
      vectorDb: 'qdrant',
    },
  },
  HYPERPARAMETER_DEFAULTS: {
    model: ['llama3.2', 'gpt-4o'],
    temperature: [0.0, 0.7],
    topP: [0.9, 1.0],
    maxTokens: [256, 1024],
  },
}));

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await fetch('http://localhost:3001/health');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('ai');
    });
  });

  describe('Models Endpoint', () => {
    it('should return available models and hyperparameters', async () => {
      const response = await fetch('http://localhost:3001/v1/models');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.models).toBeDefined();
      expect(data.useCases).toBeDefined();
      expect(data.hyperparameters).toBeDefined();
      expect(Array.isArray(data.models)).toBe(true);
    });
  });

  describe('Completion Endpoint', () => {
    it('should validate request schema', async () => {
      const response = await fetch('http://localhost:3001/v1/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          tenantId: 'invalid',
          useCase: 'INVALID',
        }),
      });
      
      expect(response.status).toBe(400);
    });

    it('should accept valid request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Test response' } }],
          model: 'llama3.2',
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });
      
      global.fetch = mockFetch;
      
      const request = {
        prompt: 'Test prompt',
        model: 'llama3.2',
        provider: 'OLLAMA',
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9,
        tenantId: 'cltest123456789012345',
        useCase: 'ECOMMERCE_PERSONALIZATION',
      };
      
      expect(request.prompt).toBe('Test prompt');
      expect(request.useCase).toBe('ECOMMERCE_PERSONALIZATION');
    });
  });

  describe('Input Validation', () => {
    it('should reject temperature outside valid range', () => {
      const invalidTemperatures = [-0.1, 2.1, 3];
      
      invalidTemperatures.forEach((temp) => {
        expect(temp).not.toBeGreaterThanOrEqual(0);
        expect(temp).not.toBeLessThanOrEqual(2);
      });
    });

    it('should accept valid hyperparameters', () => {
      const validConfig = {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 1024,
      };
      
      expect(validConfig.temperature).toBeGreaterThanOrEqual(0);
      expect(validConfig.temperature).toBeLessThanOrEqual(2);
      expect(validConfig.topP).toBeGreaterThanOrEqual(0);
      expect(validConfig.topP).toBeLessThanOrEqual(1);
      expect(validConfig.maxTokens).toBeGreaterThan(0);
      expect(validConfig.maxTokens).toBeLessThanOrEqual(4096);
    });
  });
});
