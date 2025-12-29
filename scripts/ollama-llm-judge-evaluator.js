/**
 * Advanced LLM-as-Judge Evaluation Framework
 * Implements 10-iteration multi-model evaluation with numerical scoring
 * Based on DAG (Directed Acyclic Graph) decision tree methodology
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Evaluation Models Configuration
const EVALUATION_MODELS = [
  'mistral:latest',
  'codellama:7b',
  'llama3.2:3b'
];

// Evaluation Criteria with Weighted Scoring
const EVALUATION_CRITERIA = {
  completeness: {
    weight: 0.20,
    description: 'Are all required components installed and configured?',
    thresholds: { excellent: 0.9, good: 0.75, acceptable: 0.6, poor: 0.4 }
  },
  correctness: {
    weight: 0.25,
    description: 'Are implementations correct and following best practices?',
    thresholds: { excellent: 0.95, good: 0.85, acceptable: 0.7, poor: 0.5 }
  },
  integration: {
    weight: 0.15,
    description: 'How well do components integrate with existing systems?',
    thresholds: { excellent: 0.9, good: 0.75, acceptable: 0.6, poor: 0.4 }
  },
  security: {
    weight: 0.20,
    description: 'Are security best practices followed?',
    thresholds: { excellent: 0.95, good: 0.85, acceptable: 0.7, poor: 0.5 }
  },
  maintainability: {
    weight: 0.10,
    description: 'Is the code maintainable and well-documented?',
    thresholds: { excellent: 0.85, good: 0.7, acceptable: 0.6, poor: 0.4 }
  },
  performance: {
    weight: 0.10,
    description: 'Will the system perform efficiently?',
    thresholds: { excellent: 0.85, good: 0.7, acceptable: 0.6, poor: 0.4 }
  }
};

/**
 * Call Ollama API for LLM evaluation
 */
async function callOllama(model, prompt) {
  try {
    const response = await execAsync(
      `ollama run ${model} "${prompt.replace(/"/g, '\\"')}"`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    );
    return response.stdout.trim();
  } catch (error) {
    console.error(`Error calling Ollama with model ${model}:`, error.message);
    return null;
  }
}

/**
 * Parse numerical score from LLM response
 */
function extractScore(response) {
  // Look for scores in formats: "8/10", "0.85", "85%", "Score: 8.5"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*\/\s*10/,
    /(?:score|rating):\s*(\d+(?:\.\d+)?)/i,
    /(\d+)%/,
    /(\d\.\d+)/
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      let score = parseFloat(match[1]);
      // Normalize to 0-1 scale
      if (score > 1) score = score / 10;
      if (score > 1) score = score / 100;
      return Math.min(1, Math.max(0, score));
    }
  }

  return null;
}

/**
 * Single criterion evaluation
 */
async function evaluateCriterion(criterion, context, model, iteration) {
  const prompt = `
You are an expert code quality evaluator. Evaluate the following aspect on a scale of 0.0 to 1.0:

CRITERION: ${criterion}
DESCRIPTION: ${EVALUATION_CRITERIA[criterion].description}

CONTEXT:
${context}

Provide a numerical score (0.0-1.0) and brief justification.
Format: Score: X.XX | Justification: <your reasoning>
`;

  const response = await callOllama(model, prompt);
  if (!response) return null;

  const score = extractScore(response);
  
  return {
    criterion,
    model,
    iteration,
    score,
    justification: response,
    timestamp: new Date().toISOString()
  };
}

/**
 * Multi-iteration evaluation with consensus
 */
async function runMultiIterationEvaluation(context, iterations = 10) {
  const results = [];
  
  console.log(`\n🔬 Starting ${iterations}-iteration LLM-as-Judge evaluation...\n`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n📊 Iteration ${i}/${iterations}`);
    
    for (const criterion of Object.keys(EVALUATION_CRITERIA)) {
      // Rotate through models for diversity
      const model = EVALUATION_MODELS[i % EVALUATION_MODELS.length];
      
      console.log(`  ⚖️  Evaluating ${criterion} with ${model}...`);
      
      const result = await evaluateCriterion(criterion, context, model, i);
      if (result && result.score !== null) {
        results.push(result);
        console.log(`     Score: ${result.score.toFixed(3)}`);
      }
    }
  }

  return results;
}

/**
 * Calculate consensus scores and statistics
 */
function calculateConsensus(results) {
  const criteriaScores = {};
  
  for (const criterion of Object.keys(EVALUATION_CRITERIA)) {
    const criterionResults = results.filter(r => r.criterion === criterion);
    
    if (criterionResults.length === 0) continue;
    
    const scores = criterionResults.map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate confidence interval (95%)
    const confidenceInterval = 1.96 * (stdDev / Math.sqrt(scores.length));
    
    criteriaScores[criterion] = {
      mean,
      median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
      stdDev,
      confidence: confidenceInterval,
      min: Math.min(...scores),
      max: Math.max(...scores),
      samples: scores.length,
      weight: EVALUATION_CRITERIA[criterion].weight
    };
  }
  
  return criteriaScores;
}

/**
 * Calculate weighted GPA-style score
 */
function calculateGPA(consensusScores) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  const criteriaGrades = {};
  
  for (const [criterion, stats] of Object.entries(consensusScores)) {
    const score = stats.mean;
    const weight = stats.weight;
    
    // Convert to GPA scale (0.0-4.0)
    let gpa = 0;
    let letterGrade = 'F';
    
    if (score >= 0.93) { gpa = 4.0; letterGrade = 'A'; }
    else if (score >= 0.90) { gpa = 3.7; letterGrade = 'A-'; }
    else if (score >= 0.87) { gpa = 3.3; letterGrade = 'B+'; }
    else if (score >= 0.83) { gpa = 3.0; letterGrade = 'B'; }
    else if (score >= 0.80) { gpa = 2.7; letterGrade = 'B-'; }
    else if (score >= 0.77) { gpa = 2.3; letterGrade = 'C+'; }
    else if (score >= 0.73) { gpa = 2.0; letterGrade = 'C'; }
    else if (score >= 0.70) { gpa = 1.7; letterGrade = 'C-'; }
    else if (score >= 0.67) { gpa = 1.3; letterGrade = 'D+'; }
    else if (score >= 0.60) { gpa = 1.0; letterGrade = 'D'; }
    else { gpa = 0.0; letterGrade = 'F'; }
    
    weightedSum += gpa * weight;
    totalWeight += weight;
    
    criteriaGrades[criterion] = {
      score: score.toFixed(3),
      gpa: gpa.toFixed(2),
      letterGrade,
      weight: weight.toFixed(2)
    };
  }
  
  const overallGPA = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    overallGPA: overallGPA.toFixed(2),
    criteriaGrades
  };
}

/**
 * Main evaluation orchestrator
 */
export async function evaluateWithLLMJudge(contextData, iterations = 10) {
  const startTime = Date.now();
  
  // Run multi-iteration evaluation
  const rawResults = await runMultiIterationEvaluation(contextData, iterations);
  
  // Calculate consensus
  const consensusScores = calculateConsensus(rawResults);
  
  // Calculate GPA
  const gpaResults = calculateGPA(consensusScores);
  
  const evaluation = {
    metadata: {
      timestamp: new Date().toISOString(),
      iterations,
      models: EVALUATION_MODELS,
      totalSamples: rawResults.length,
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    },
    rawResults,
    consensusScores,
    gpaResults,
    recommendations: generateRecommendations(consensusScores, gpaResults)
  };
  
  return evaluation;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(consensusScores, gpaResults) {
  const recommendations = [];
  
  for (const [criterion, stats] of Object.entries(consensusScores)) {
    const grade = gpaResults.criteriaGrades[criterion];
    
    if (stats.mean < 0.7) {
      recommendations.push({
        priority: 'HIGH',
        criterion,
        score: stats.mean,
        grade: grade.letterGrade,
        issue: `${criterion} is below acceptable threshold`,
        action: `Review and improve ${EVALUATION_CRITERIA[criterion].description.toLowerCase()}`
      });
    } else if (stats.mean < 0.85) {
      recommendations.push({
        priority: 'MEDIUM',
        criterion,
        score: stats.mean,
        grade: grade.letterGrade,
        issue: `${criterion} has room for improvement`,
        action: `Consider optimizing ${criterion} aspects`
      });
    }
  }
  
  return recommendations.sort((a, b) => a.score - b.score);
}

// Export for use in other modules
export { EVALUATION_CRITERIA, calculateGPA, calculateConsensus };
