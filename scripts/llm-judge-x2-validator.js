/**
 * LLM Judge x2 Validation Framework
 * Multi-model consensus evaluation system requiring GPT-4 + Claude agreement
 * 
 * Features:
 * - Dual-model validation (both must pass)
 * - Configurable evaluation rubrics
 * - Statistical confidence scoring
 * - DeepEval integration ready
 * - Event-driven result streaming
 * 
 * @see https://github.com/confident-ai/deepeval
 */

import { EventEmitter } from 'events';

// Evaluation models configuration
const JUDGE_MODELS = {
  primary: {
    provider: 'openai',
    model: 'gpt-4o',
    endpoint: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY
  },
  secondary: {
    provider: 'anthropic', 
    model: 'claude-sonnet-4-20250514',
    endpoint: process.env.ANTHROPIC_API_BASE || 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  fallback: {
    provider: 'ollama',
    model: 'llama3.2:latest',
    endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  }
};

// Evaluation rubric with weighted criteria
const EVALUATION_RUBRIC = {
  correctness: {
    weight: 0.30,
    threshold: 0.85,
    description: 'Technical accuracy and correctness of implementation',
    criteria: [
      'Code compiles/runs without errors',
      'Logic is sound and handles edge cases',
      'Follows language/framework best practices',
      'No security vulnerabilities'
    ]
  },
  completeness: {
    weight: 0.25,
    threshold: 0.80,
    description: 'All requirements are addressed',
    criteria: [
      'All specified features implemented',
      'Error handling is comprehensive',
      'Tests cover main scenarios',
      'Documentation is adequate'
    ]
  },
  maintainability: {
    weight: 0.20,
    threshold: 0.75,
    description: 'Code is readable and maintainable',
    criteria: [
      'Clear naming conventions',
      'Appropriate abstraction levels',
      'Minimal code duplication',
      'Well-structured modules'
    ]
  },
  performance: {
    weight: 0.15,
    threshold: 0.70,
    description: 'Efficient resource usage',
    criteria: [
      'No obvious performance bottlenecks',
      'Appropriate data structures',
      'Efficient algorithms used',
      'Resource cleanup handled'
    ]
  },
  vendorCompliance: {
    weight: 0.10,
    threshold: 0.90,
    description: 'Uses vendor libraries instead of custom code',
    criteria: [
      'No custom implementations of common patterns',
      'Uses approved vendor libraries',
      'Follows vendor best practices',
      'Proper dependency management'
    ]
  }
};

/**
 * Evaluation result structure
 */
class EvaluationResult {
  constructor(criterion, modelResults) {
    this.criterion = criterion;
    this.modelResults = modelResults;
    this.timestamp = new Date().toISOString();
    this.consensus = this._calculateConsensus();
  }

  _calculateConsensus() {
    const scores = Object.values(this.modelResults).map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Check if models agree (within acceptable deviation)
    const agreement = stdDev < 0.15;
    
    return {
      score: mean,
      stdDev,
      agreement,
      confidence: agreement ? 'high' : (stdDev < 0.25 ? 'medium' : 'low'),
      passesThreshold: mean >= EVALUATION_RUBRIC[this.criterion]?.threshold
    };
  }
}

/**
 * LLM Judge x2 Validator
 */
class LLMJudgeX2Validator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      requireBothPass: true,
      minConfidence: 'medium',
      iterations: 3,
      timeout: 60000,
      ...options
    };
    this.results = [];
  }

  /**
   * Generate evaluation prompt for a criterion
   */
  _generatePrompt(criterion, context, code) {
    const rubric = EVALUATION_RUBRIC[criterion];
    
    return `You are an expert code reviewer evaluating ${criterion}.

## Evaluation Criteria
${rubric.description}

Specific aspects to evaluate:
${rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Context
${context}

## Code to Evaluate
\`\`\`
${code}
\`\`\`

## Instructions
1. Analyze the code against each criterion
2. Provide a score from 0.0 to 1.0
3. List specific issues found (if any)
4. Provide actionable recommendations

## Response Format (JSON)
{
  "score": 0.XX,
  "reasoning": "Brief explanation of score",
  "issues": ["issue1", "issue2"],
  "recommendations": ["rec1", "rec2"],
  "passesThreshold": true/false
}

Respond ONLY with valid JSON.`;
  }

  /**
   * Call OpenAI API
   */
  async _callOpenAI(prompt) {
    const response = await fetch(`${JUDGE_MODELS.primary.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JUDGE_MODELS.primary.apiKey}`
      },
      body: JSON.stringify({
        model: JUDGE_MODELS.primary.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(this.options.timeout)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  /**
   * Call Anthropic API
   */
  async _callAnthropic(prompt) {
    const response = await fetch(`${JUDGE_MODELS.secondary.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': JUDGE_MODELS.secondary.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: JUDGE_MODELS.secondary.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(this.options.timeout)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Anthropic response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Call Ollama API (fallback)
   */
  async _callOllama(prompt) {
    const response = await fetch(`${JUDGE_MODELS.fallback.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: JUDGE_MODELS.fallback.model,
        prompt,
        stream: false,
        format: 'json'
      }),
      signal: AbortSignal.timeout(this.options.timeout)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.response);
  }

  /**
   * Evaluate a single criterion with both models
   */
  async _evaluateCriterion(criterion, context, code, iteration) {
    const prompt = this._generatePrompt(criterion, context, code);
    const modelResults = {};

    this.emit('criterionStart', { criterion, iteration });

    // Parallel evaluation with both models
    const [gpt4Result, claudeResult] = await Promise.allSettled([
      this._callOpenAI(prompt),
      this._callAnthropic(prompt)
    ]);

    // Process GPT-4 result
    if (gpt4Result.status === 'fulfilled') {
      modelResults.gpt4 = {
        ...gpt4Result.value,
        model: JUDGE_MODELS.primary.model
      };
    } else {
      this.emit('modelError', { model: 'gpt4', error: gpt4Result.reason });
      // Try Ollama fallback
      try {
        const ollamaResult = await this._callOllama(prompt);
        modelResults.ollama_primary = {
          ...ollamaResult,
          model: JUDGE_MODELS.fallback.model,
          isFallback: true
        };
      } catch (fallbackError) {
        this.emit('modelError', { model: 'ollama_primary', error: fallbackError });
      }
    }

    // Process Claude result
    if (claudeResult.status === 'fulfilled') {
      modelResults.claude = {
        ...claudeResult.value,
        model: JUDGE_MODELS.secondary.model
      };
    } else {
      this.emit('modelError', { model: 'claude', error: claudeResult.reason });
      // Try Ollama fallback
      try {
        const ollamaResult = await this._callOllama(prompt);
        modelResults.ollama_secondary = {
          ...ollamaResult,
          model: JUDGE_MODELS.fallback.model,
          isFallback: true
        };
      } catch (fallbackError) {
        this.emit('modelError', { model: 'ollama_secondary', error: fallbackError });
      }
    }

    const result = new EvaluationResult(criterion, modelResults);
    this.emit('criterionComplete', { criterion, iteration, result });

    return result;
  }

  /**
   * Run full evaluation across all criteria
   */
  async evaluate(context, code) {
    const startTime = Date.now();
    this.results = [];
    const criteriaResults = {};

    this.emit('evaluationStart', { 
      criteria: Object.keys(EVALUATION_RUBRIC),
      iterations: this.options.iterations 
    });

    // Evaluate each criterion multiple times for statistical significance
    for (const criterion of Object.keys(EVALUATION_RUBRIC)) {
      const iterationResults = [];
      
      for (let i = 0; i < this.options.iterations; i++) {
        const result = await this._evaluateCriterion(criterion, context, code, i + 1);
        iterationResults.push(result);
      }

      // Aggregate iteration results
      const scores = iterationResults.map(r => r.consensus.score);
      const agreements = iterationResults.map(r => r.consensus.agreement);
      
      criteriaResults[criterion] = {
        meanScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        agreementRate: agreements.filter(a => a).length / agreements.length,
        threshold: EVALUATION_RUBRIC[criterion].threshold,
        weight: EVALUATION_RUBRIC[criterion].weight,
        iterations: iterationResults
      };
    }

    // Calculate overall score
    let weightedSum = 0;
    let totalWeight = 0;
    let allPass = true;

    for (const [criterion, result] of Object.entries(criteriaResults)) {
      weightedSum += result.meanScore * result.weight;
      totalWeight += result.weight;
      
      if (result.meanScore < result.threshold) {
        allPass = false;
      }
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Determine final verdict
    const verdict = this._determineVerdict(overallScore, allPass, criteriaResults);

    const evaluation = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        iterations: this.options.iterations,
        models: Object.keys(JUDGE_MODELS).slice(0, 2)
      },
      criteriaResults,
      overallScore,
      verdict,
      recommendations: this._generateRecommendations(criteriaResults),
      passesX2Validation: verdict.passes
    };

    this.emit('evaluationComplete', evaluation);
    return evaluation;
  }

  /**
   * Determine final verdict based on x2 validation rules
   */
  _determineVerdict(overallScore, allCriteriaPass, criteriaResults) {
    // Check if both models agreed on most criteria
    const highAgreementCount = Object.values(criteriaResults)
      .filter(r => r.agreementRate >= 0.66).length;
    const totalCriteria = Object.keys(criteriaResults).length;
    const modelAgreement = highAgreementCount / totalCriteria >= 0.80;

    // X2 validation requires:
    // 1. Overall score >= 0.80
    // 2. All criteria pass their thresholds
    // 3. Models agree on majority of evaluations
    const passes = overallScore >= 0.80 && 
                   (this.options.requireBothPass ? allCriteriaPass : overallScore >= 0.70) &&
                   modelAgreement;

    // Letter grade
    let grade;
    if (overallScore >= 0.95) grade = 'A+';
    else if (overallScore >= 0.90) grade = 'A';
    else if (overallScore >= 0.85) grade = 'A-';
    else if (overallScore >= 0.80) grade = 'B+';
    else if (overallScore >= 0.75) grade = 'B';
    else if (overallScore >= 0.70) grade = 'B-';
    else if (overallScore >= 0.65) grade = 'C+';
    else if (overallScore >= 0.60) grade = 'C';
    else grade = 'F';

    return {
      passes,
      grade,
      overallScore: overallScore.toFixed(3),
      modelAgreement,
      allCriteriaPass,
      reasoning: passes 
        ? 'Code passes LLM Judge x2 validation with model consensus'
        : `Validation failed: ${!modelAgreement ? 'Models disagree' : ''} ${!allCriteriaPass ? 'Some criteria below threshold' : ''} ${overallScore < 0.80 ? 'Overall score too low' : ''}`.trim()
    };
  }

  /**
   * Generate actionable recommendations
   */
  _generateRecommendations(criteriaResults) {
    const recommendations = [];

    for (const [criterion, result] of Object.entries(criteriaResults)) {
      if (result.meanScore < result.threshold) {
        recommendations.push({
          priority: 'HIGH',
          criterion,
          score: result.meanScore.toFixed(3),
          threshold: result.threshold,
          action: `Improve ${criterion}: score ${result.meanScore.toFixed(2)} below threshold ${result.threshold}`
        });
      } else if (result.meanScore < result.threshold + 0.10) {
        recommendations.push({
          priority: 'MEDIUM',
          criterion,
          score: result.meanScore.toFixed(3),
          threshold: result.threshold,
          action: `${criterion} is close to threshold - consider improvements`
        });
      }

      if (result.agreementRate < 0.66) {
        recommendations.push({
          priority: 'INFO',
          criterion,
          agreementRate: result.agreementRate.toFixed(2),
          action: `Model disagreement on ${criterion} - manual review recommended`
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, INFO: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

/**
 * Quick validation function for CI/CD integration
 */
async function quickValidate(code, context = 'Code review validation') {
  const validator = new LLMJudgeX2Validator({ iterations: 1 });
  const result = await validator.evaluate(context, code);
  return result.passesX2Validation;
}

/**
 * Full validation with detailed report
 */
async function fullValidate(code, context, options = {}) {
  const validator = new LLMJudgeX2Validator(options);
  
  // Attach event listeners for real-time progress
  validator.on('criterionComplete', ({ criterion, result }) => {
    console.log(`✓ ${criterion}: ${result.consensus.score.toFixed(2)} (${result.consensus.confidence} confidence)`);
  });

  return validator.evaluate(context, code);
}

// Export
export {
  LLMJudgeX2Validator,
  EVALUATION_RUBRIC,
  JUDGE_MODELS,
  EvaluationResult,
  quickValidate,
  fullValidate
};

export default LLMJudgeX2Validator;
