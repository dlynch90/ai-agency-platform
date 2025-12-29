import { describe, it, expect } from 'vitest';
import {
  TenantSchema,
  UserSchema,
  AIRequestSchema,
  AIResponseSchema,
  UseCaseSchema,
  HyperparameterConfigSchema,
} from './index';

describe('Type Schemas', () => {
  describe('TenantSchema', () => {
    it('should validate valid tenant', () => {
      const tenant = {
        id: 'cltenant12345678901234',
        name: 'Test Tenant',
        domain: 'test.example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = TenantSchema.safeParse(tenant);
      expect(result.success).toBe(true);
    });

    it('should reject tenant with empty name', () => {
      const tenant = {
        id: 'cltenant12345678901234',
        name: '',
        domain: 'test.example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = TenantSchema.safeParse(tenant);
      expect(result.success).toBe(false);
    });
  });

  describe('AIRequestSchema', () => {
    it('should validate valid AI request', () => {
      const request = {
        prompt: 'Test prompt',
        model: 'llama3.2',
        provider: 'OLLAMA',
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9,
        tenantId: 'cltenantid1234567890123',
        useCase: 'ECOMMERCE_PERSONALIZATION',
      };
      
      const result = AIRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should apply defaults for optional fields', () => {
      const request = {
        prompt: 'Test prompt',
        tenantId: 'cltenantid1234567890123',
        useCase: 'ECOMMERCE_PERSONALIZATION',
      };
      
      const result = AIRequestSchema.parse(request);
      expect(result.model).toBe('llama3.2');
      expect(result.provider).toBe('OLLAMA');
      expect(result.temperature).toBe(0.7);
    });

    it('should reject invalid temperature', () => {
      const request = {
        prompt: 'Test prompt',
        temperature: 3.0,
        tenantId: 'cltenantid1234567890123',
        useCase: 'ECOMMERCE_PERSONALIZATION',
      };
      
      const result = AIRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('UseCaseSchema', () => {
    it('should accept all valid use cases', () => {
      const useCases = [
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
      ];
      
      useCases.forEach((useCase) => {
        const result = UseCaseSchema.safeParse(useCase);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid use case', () => {
      const result = UseCaseSchema.safeParse('INVALID_USE_CASE');
      expect(result.success).toBe(false);
    });
  });

  describe('HyperparameterConfigSchema', () => {
    it('should validate hyperparameter config', () => {
      const config = {
        model: ['llama3.2', 'gpt-4o'],
        temperature: [0.0, 0.7, 1.0],
        topP: [0.9, 1.0],
        maxTokens: [256, 1024, 2048],
      };
      
      const result = HyperparameterConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});
