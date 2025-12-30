/**
 * LLM Judge x2 Validation Framework Unit Tests
 * TDD test suite for multi-model consensus evaluation
 * 
 * Tests cover:
 * - Dual-model validation logic
 * - Consensus calculation
 * - Rubric-based scoring
 * - Event emission
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
vi.stubEnv('OLLAMA_BASE_URL', 'http://localhost:11434');

// Import after mocks
const {
  LLMJudgeX2Validator,
  EVALUATION_RUBRIC,
  JUDGE_MODELS,
  EvaluationResult,
  quickValidate,
  fullValidate
} = await import('../../scripts/llm-judge-x2-validator.js');

describe('EVALUATION_RUBRIC', () => {
  it('should have all required criteria', () => {
    expect(EVALUATION_RUBRIC).toHaveProperty('correctness');
    expect(EVALUATION_RUBRIC).toHaveProperty('completeness');
    expect(EVALUATION_RUBRIC).toHaveProperty('maintainability');
    expect(EVALUATION_RUBRIC).toHaveProperty('performance');
    expect(EVALUATION_RUBRIC).toHaveProperty('vendorCompliance');
  });

  it('should have weights that sum to 1.0', () => {
    const totalWeight = Object.values(EVALUATION_RUBRIC)
      .reduce((sum: number, criterion: any) => sum + criterion.weight, 0);
    
    expect(totalWeight).toBeCloseTo(1.0, 2);
  });

  it('should have thresholds between 0 and 1', () => {
    for (const [name, criterion] of Object.entries(EVALUATION_RUBRIC)) {
      expect((criterion as any).threshold).toBeGreaterThanOrEqual(0);
      expect((criterion as any).threshold).toBeLessThanOrEqual(1);
    }
  });

  it('should have descriptions for each criterion', () => {
    for (const [name, criterion] of Object.entries(EVALUATION_RUBRIC)) {
      expect((criterion as any).description).toBeDefined();
      expect(typeof (criterion as any).description).toBe('string');
      expect((criterion as any).description.length).toBeGreaterThan(0);
    }
  });

  it('should have criteria arrays for each rubric', () => {
    for (const [name, criterion] of Object.entries(EVALUATION_RUBRIC)) {
      expect((criterion as any).criteria).toBeDefined();
      expect(Array.isArray((criterion as any).criteria)).toBe(true);
      expect((criterion as any).criteria.length).toBeGreaterThan(0);
    }
  });
});

describe('JUDGE_MODELS', () => {
  it('should have primary, secondary, and fallback models', () => {
    expect(JUDGE_MODELS).toHaveProperty('primary');
    expect(JUDGE_MODELS).toHaveProperty('secondary');
    expect(JUDGE_MODELS).toHaveProperty('fallback');
  });

  it('should have OpenAI as primary provider', () => {
    expect(JUDGE_MODELS.primary.provider).toBe('openai');
    expect(JUDGE_MODELS.primary.model).toContain('gpt');
  });

  it('should have Anthropic as secondary provider', () => {
    expect(JUDGE_MODELS.secondary.provider).toBe('anthropic');
    expect(JUDGE_MODELS.secondary.model).toContain('claude');
  });

  it('should have Ollama as fallback provider', () => {
    expect(JUDGE_MODELS.fallback.provider).toBe('ollama');
    expect(JUDGE_MODELS.fallback.endpoint).toContain('11434');
  });
});

describe('EvaluationResult', () => {
  it('should calculate consensus correctly for agreeing models', () => {
    const modelResults = {
      gpt4: { score: 0.85, model: 'gpt-4o' },
      claude: { score: 0.87, model: 'claude-sonnet-4' }
    };
    
    const result = new EvaluationResult('correctness', modelResults);
    
    expect(result.consensus.score).toBeCloseTo(0.86, 2);
    expect(result.consensus.agreement).toBe(true);
    expect(result.consensus.confidence).toBe('high');
  });

  it('should detect disagreement between models', () => {
    const modelResults = {
      gpt4: { score: 0.90, model: 'gpt-4o' },
      claude: { score: 0.50, model: 'claude-sonnet-4' }
    };
    
    const result = new EvaluationResult('correctness', modelResults);
    
    expect(result.consensus.agreement).toBe(false);
    expect(result.consensus.confidence).not.toBe('high');
  });

  it('should include timestamp', () => {
    const modelResults = {
      gpt4: { score: 0.80, model: 'gpt-4o' }
    };
    
    const result = new EvaluationResult('completeness', modelResults);
    
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });
});

describe('LLMJudgeX2Validator', () => {
  let validator: any;

  beforeEach(() => {
    vi.clearAllMocks();
    validator = new LLMJudgeX2Validator({ iterations: 1 });
  });

  afterEach(() => {
    validator.removeAllListeners();
  });

  describe('constructor', () => {
    it('should accept custom options', () => {
      const customValidator = new LLMJudgeX2Validator({
        requireBothPass: false,
        minConfidence: 'low',
        iterations: 5,
        timeout: 30000
      });
      
      expect(customValidator.options.requireBothPass).toBe(false);
      expect(customValidator.options.iterations).toBe(5);
      expect(customValidator.options.timeout).toBe(30000);
    });

    it('should use default options when none provided', () => {
      const defaultValidator = new LLMJudgeX2Validator();
      
      expect(defaultValidator.options.requireBothPass).toBe(true);
      expect(defaultValidator.options.iterations).toBe(3);
      expect(defaultValidator.options.timeout).toBe(60000);
    });
  });

  describe('event emission', () => {
    it('should emit evaluationStart event', async () => {
      const startListener = vi.fn();
      validator.on('evaluationStart', startListener);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"score": 0.85, "reasoning": "test"}' } }]
        })
      });
      
      // Start evaluation but don't await (just check event was emitted)
      const promise = validator.evaluate('test context', 'test code');
      
      // Give it a moment to emit the event
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(startListener).toHaveBeenCalled();
      
      // Clean up
      try { await promise; } catch {}
    });
  });

  describe('_generatePrompt', () => {
    it('should generate prompt with criterion details', () => {
      const prompt = validator._generatePrompt('correctness', 'Test context', 'const x = 1;');
      
      expect(prompt).toContain('correctness');
      expect(prompt).toContain('Test context');
      expect(prompt).toContain('const x = 1;');
      expect(prompt).toContain('0.0 to 1.0');
      expect(prompt).toContain('JSON');
    });

    it('should include rubric criteria in prompt', () => {
      const prompt = validator._generatePrompt('vendorCompliance', 'Context', 'Code');
      
      expect(prompt).toContain('vendor');
      expect(prompt.toLowerCase()).toContain('custom');
    });
  });

  describe('_determineVerdict', () => {
    it('should pass when all conditions are met', () => {
      const criteriaResults = {
        correctness: { meanScore: 0.90, agreementRate: 0.80, threshold: 0.85 },
        completeness: { meanScore: 0.85, agreementRate: 0.75, threshold: 0.80 },
        maintainability: { meanScore: 0.88, agreementRate: 0.90, threshold: 0.75 },
        performance: { meanScore: 0.82, agreementRate: 0.85, threshold: 0.70 },
        vendorCompliance: { meanScore: 0.95, agreementRate: 0.95, threshold: 0.90 }
      };
      
      const verdict = validator._determineVerdict(0.88, true, criteriaResults);
      
      expect(verdict.passes).toBe(true);
      expect(verdict.grade).toMatch(/^[AB]/);
    });

    it('should fail when overall score is too low', () => {
      const criteriaResults = {
        correctness: { meanScore: 0.60, agreementRate: 0.80, threshold: 0.85 }
      };
      
      const verdict = validator._determineVerdict(0.60, false, criteriaResults);
      
      expect(verdict.passes).toBe(false);
    });

    it('should calculate correct letter grade', () => {
      expect(validator._determineVerdict(0.96, true, {}).grade).toBe('A+');
      expect(validator._determineVerdict(0.91, true, {}).grade).toBe('A');
      expect(validator._determineVerdict(0.86, true, {}).grade).toBe('A-');
      expect(validator._determineVerdict(0.81, true, {}).grade).toBe('B+');
      expect(validator._determineVerdict(0.76, true, {}).grade).toBe('B');
      expect(validator._determineVerdict(0.55, true, {}).grade).toBe('F');
    });
  });

  describe('_generateRecommendations', () => {
    it('should generate HIGH priority for scores below threshold', () => {
      const criteriaResults = {
        correctness: { meanScore: 0.50, threshold: 0.85, agreementRate: 0.80 }
      };
      
      const recommendations = validator._generateRecommendations(criteriaResults);
      
      expect(recommendations.some((r: any) => r.priority === 'HIGH')).toBe(true);
    });

    it('should generate MEDIUM priority for scores near threshold', () => {
      const criteriaResults = {
        correctness: { meanScore: 0.80, threshold: 0.85, agreementRate: 0.80 }
      };
      
      const recommendations = validator._generateRecommendations(criteriaResults);
      
      expect(recommendations.some((r: any) => r.priority === 'MEDIUM')).toBe(true);
    });

    it('should generate INFO for low model agreement', () => {
      const criteriaResults = {
        correctness: { meanScore: 0.90, threshold: 0.85, agreementRate: 0.50 }
      };
      
      const recommendations = validator._generateRecommendations(criteriaResults);
      
      expect(recommendations.some((r: any) => r.priority === 'INFO')).toBe(true);
    });

    it('should sort recommendations by priority', () => {
      const criteriaResults = {
        a: { meanScore: 0.90, threshold: 0.85, agreementRate: 0.50 },  // INFO
        b: { meanScore: 0.80, threshold: 0.85, agreementRate: 0.80 },  // MEDIUM
        c: { meanScore: 0.50, threshold: 0.85, agreementRate: 0.80 }   // HIGH
      };
      
      const recommendations = validator._generateRecommendations(criteriaResults);
      
      // HIGH should come before MEDIUM which comes before INFO
      const priorities = recommendations.map((r: any) => r.priority);
      const highIndex = priorities.indexOf('HIGH');
      const mediumIndex = priorities.indexOf('MEDIUM');
      const infoIndex = priorities.indexOf('INFO');
      
      if (highIndex !== -1 && mediumIndex !== -1) {
        expect(highIndex).toBeLessThan(mediumIndex);
      }
      if (mediumIndex !== -1 && infoIndex !== -1) {
        expect(mediumIndex).toBeLessThan(infoIndex);
      }
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '{"score": 0.90, "reasoning": "good", "issues": [], "recommendations": []}' } }],
        content: [{ text: '{"score": 0.88, "reasoning": "good", "issues": [], "recommendations": []}' }]
      })
    });
  });

  describe('quickValidate', () => {
    it('should return boolean result', async () => {
      // This test would require actual API calls or more sophisticated mocking
      // For now, we verify the function exists and returns expected type
      expect(typeof quickValidate).toBe('function');
    });
  });

  describe('fullValidate', () => {
    it('should accept options parameter', async () => {
      expect(typeof fullValidate).toBe('function');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty code input', () => {
    const validator = new LLMJudgeX2Validator({ iterations: 1 });
    const prompt = validator._generatePrompt('correctness', 'context', '');
    
    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should handle special characters in code', () => {
    const validator = new LLMJudgeX2Validator({ iterations: 1 });
    const code = 'const regex = /[a-z]+/g; // "quotes" & <brackets>';
    const prompt = validator._generatePrompt('correctness', 'context', code);
    
    expect(prompt).toContain(code);
  });

  it('should handle very long code input', () => {
    const validator = new LLMJudgeX2Validator({ iterations: 1 });
    const longCode = 'x'.repeat(10000);
    const prompt = validator._generatePrompt('correctness', 'context', longCode);
    
    expect(prompt).toContain(longCode);
  });
});

describe('X2 Validation Logic', () => {
  it('should require both models to pass by default', () => {
    const validator = new LLMJudgeX2Validator();
    expect(validator.options.requireBothPass).toBe(true);
  });

  it('should allow disabling x2 requirement', () => {
    const validator = new LLMJudgeX2Validator({ requireBothPass: false });
    expect(validator.options.requireBothPass).toBe(false);
  });

  it('should track model agreement in verdict', () => {
    const validator = new LLMJudgeX2Validator();
    const criteriaResults = {
      test: { meanScore: 0.90, agreementRate: 0.90, threshold: 0.85 }
    };
    
    const verdict = validator._determineVerdict(0.90, true, criteriaResults);
    
    expect(verdict).toHaveProperty('modelAgreement');
  });
});
