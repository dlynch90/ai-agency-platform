#!/usr/bin/env node

/**
 * COMPREHENSIVE MULTI-METHOD EVALUATION ORCHESTRATOR
 * 
 * Combines multiple advanced evaluation methodologies:
 * 1. LLM-as-Judge (10 iterations, multi-model consensus)
 * 2. Neo4j Dependency Graph Analysis (atomic → molecular → association)
 * 3. Finite Element Analysis (structural code quality)
 * 4. Numerical Methods (statistical aggregation)
 * 5. Deep Web Research (latest best practices)
 * 
 * Produces GPA-style scoring with comprehensive recommendations
 */

import { evaluateWithLLMJudge } from './ollama-llm-judge-evaluator.js';
import { performGraphAnalysis } from './neo4j-dependency-analyzer.js';
import { performFiniteElementAnalysis } from './finite-element-analyzer.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Main evaluation orchestrator
 */
async function runComprehensiveEvaluation(rootDir = '.') {
  const startTime = Date.now();
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                       ║');
  console.log('║   COMPREHENSIVE MULTI-METHOD CODE QUALITY EVALUATION SYSTEM           ║');
  console.log('║                                                                       ║');
  console.log('║   Methods:                                                            ║');
  console.log('║   • LLM-as-Judge (10 iterations, multi-model)                         ║');
  console.log('║   • Neo4j Dependency Graph Analysis                                   ║');
  console.log('║   • Finite Element Analysis                                           ║');
  console.log('║   • Numerical Methods & Statistical Aggregation                       ║');
  console.log('║   • Web Research Integration                                          ║');
  console.log('║                                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Gather context
  console.log('📋 Phase 1: Context Gathering\n');
  const context = await gatherProjectContext(rootDir);
  
  // Run all analyses in parallel for efficiency
  console.log('\n📊 Phase 2: Multi-Method Analysis\n');
  
  const [llmResults, graphResults, feaResults] = await Promise.all([
    runLLMJudgeAnalysis(context),
    runGraphAnalysis(rootDir),
    runFEAnalysis(rootDir)
  ]);
  
  // Aggregate results
  console.log('\n📈 Phase 3: Numerical Aggregation\n');
  const aggregated = aggregateResults({
    llm: llmResults,
    graph: graphResults,
    fea: feaResults
  });
  
  // Calculate final GPA
  console.log('\n🎓 Phase 4: GPA Calculation\n');
  const gpa = calculateFinalGPA(aggregated);
  
  // Generate comprehensive report
  console.log('\n📝 Phase 5: Report Generation\n');
  const report = generateComprehensiveReport({
    context,
    llmResults,
    graphResults,
    feaResults,
    aggregated,
    gpa,
    metadata: {
      timestamp: new Date().toISOString(),
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      rootDirectory: rootDir
    }
  });
  
  // Save report
  await saveReport(report, rootDir);
  
  // Print summary
  printSummary(report);
  
  return report;
}

/**
 * Gather project context for evaluation
 */
async function gatherProjectContext(rootDir) {
  console.log('  • Reading package.json...');
  const packageJson = await readJSON(path.join(rootDir, 'package.json')).catch(() => ({}));
  
  console.log('  • Reading tsconfig.json...');
  const tsconfig = await readJSON(path.join(rootDir, 'tsconfig.json')).catch(() => ({}));
  
  console.log('  • Reading gap analysis...');
  const gapAnalysis = await fs.readFile(path.join(rootDir, 'opencode-gap-analysis.md'), 'utf-8')
    .catch(() => 'No gap analysis found');
  
  console.log('  • Scanning directory structure...');
  const structure = await scanStructure(rootDir);
  
  console.log('  • Analyzing OpenCode installation...');
  const opencodeStatus = await analyzeOpenCodeInstallation(rootDir);
  
  return {
    package: packageJson,
    typescript: tsconfig,
    gapAnalysis,
    structure,
    opencode: opencodeStatus
  };
}

/**
 * Run LLM-as-Judge evaluation
 */
async function runLLMJudgeAnalysis(context) {
  console.log('  🤖 Running LLM-as-Judge with 10 iterations...\n');
  
  const contextSummary = `
PROJECT ANALYSIS CONTEXT:

Package: ${context.package.name || 'Unknown'}
Version: ${context.package.version || 'Unknown'}
Description: ${context.package.description || 'N/A'}

Dependencies: ${Object.keys(context.package.dependencies || {}).length} production
DevDependencies: ${Object.keys(context.package.devDependencies || {}).length} development

TypeScript: ${context.typescript.compilerOptions ? 'Configured' : 'Not configured'}

OpenCode Installation:
${JSON.stringify(context.opencode, null, 2)}

Gap Analysis Summary:
${context.gapAnalysis.substring(0, 2000)}...

Directory Structure:
Total Directories: ${context.structure.directories.length}
Total Files: ${context.structure.files.length}
`;

  try {
    const results = await evaluateWithLLMJudge(contextSummary, 10);
    return results;
  } catch (error) {
    console.error('   ⚠️  LLM evaluation failed:', error.message);
    return { error: error.message, scores: {} };
  }
}

/**
 * Run graph analysis
 */
async function runGraphAnalysis(rootDir) {
  console.log('  🔗 Running Neo4j Dependency Graph Analysis...\n');
  
  try {
    const results = await performGraphAnalysis(rootDir);
    return results;
  } catch (error) {
    console.error('   ⚠️  Graph analysis failed:', error.message);
    return { error: error.message, scores: {} };
  }
}

/**
 * Run finite element analysis
 */
async function runFEAnalysis(rootDir) {
  console.log('  🔬 Running Finite Element Analysis...\n');
  
  try {
    const results = await performFiniteElementAnalysis(rootDir);
    return results;
  } catch (error) {
    console.error('   ⚠️  FEA failed:', error.message);
    return { error: error.message, scores: {} };
  }
}

/**
 * Aggregate results using numerical methods
 */
function aggregateResults(results) {
  console.log('  📊 Applying numerical aggregation methods...\n');
  
  const scores = {
    llm: extractLLMScores(results.llm),
    graph: extractGraphScores(results.graph),
    fea: extractFEAScores(results.fea)
  };
  
  // Calculate weighted average across methods
  const weights = {
    llm: 0.40,   // LLM judge: 40% (subjective quality)
    graph: 0.30, // Graph analysis: 30% (structural quality)
    fea: 0.30    // FEA: 30% (technical metrics)
  };
  
  const aggregatedScores = {};
  const allCategories = new Set([
    ...Object.keys(scores.llm),
    ...Object.keys(scores.graph),
    ...Object.keys(scores.fea)
  ]);
  
  for (const category of allCategories) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    if (scores.llm[category] !== undefined) {
      weightedSum += scores.llm[category] * weights.llm;
      totalWeight += weights.llm;
    }
    
    if (scores.graph[category] !== undefined) {
      weightedSum += scores.graph[category] * weights.graph;
      totalWeight += weights.graph;
    }
    
    if (scores.fea[category] !== undefined) {
      weightedSum += scores.fea[category] * weights.fea;
      totalWeight += weights.fea;
    }
    
    aggregatedScores[category] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  // Calculate statistics
  const values = Object.values(aggregatedScores);
  
  return {
    scores: aggregatedScores,
    statistics: {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: calculateMedian(values),
      stdDev: calculateStdDev(values),
      min: Math.min(...values),
      max: Math.max(...values)
    },
    methodWeights: weights
  };
}

/**
 * Calculate final GPA
 */
function calculateFinalGPA(aggregated) {
  console.log('  🎓 Computing final GPA scores...\n');
  
  const categoryGPAs = {};
  let totalWeightedGPA = 0;
  let totalWeight = 0;
  
  // Category weights for final GPA
  const categoryWeights = {
    completeness: 0.20,
    correctness: 0.25,
    integration: 0.15,
    security: 0.20,
    maintainability: 0.10,
    performance: 0.10
  };
  
  for (const [category, score] of Object.entries(aggregated.scores)) {
    const weight = categoryWeights[category] || 0.05;
    const gpa = scoreToGPA(score);
    const letterGrade = gpaToLetter(gpa);
    
    categoryGPAs[category] = {
      score: score.toFixed(3),
      gpa: gpa.toFixed(2),
      letterGrade,
      weight: weight.toFixed(2)
    };
    
    totalWeightedGPA += gpa * weight;
    totalWeight += weight;
  }
  
  const overallGPA = totalWeight > 0 ? totalWeightedGPA / totalWeight : 0;
  const overallLetter = gpaToLetter(overallGPA);
  
  return {
    overall: {
      gpa: overallGPA.toFixed(2),
      letterGrade: overallLetter,
      percentile: calculatePercentile(overallGPA)
    },
    categories: categoryGPAs,
    statistics: aggregated.statistics
  };
}

/**
 * Generate comprehensive report
 */
function generateComprehensiveReport(data) {
  console.log('  📝 Generating comprehensive report...\n');
  
  return {
    metadata: data.metadata,
    executiveSummary: generateExecutiveSummary(data),
    gpaResults: data.gpa,
    detailedAnalysis: {
      llmJudge: summarizeLLMResults(data.llmResults),
      graphAnalysis: summarizeGraphResults(data.graphResults),
      finiteElement: summarizeFEAResults(data.feaResults)
    },
    aggregatedScores: data.aggregated,
    recommendations: generateRecommendations(data),
    actionPlan: generateActionPlan(data)
  };
}

/**
 * Helper functions
 */

async function readJSON(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function scanStructure(rootDir) {
  const directories = [];
  const files = [];
  
  async function walk(dir, depth = 0) {
    if (depth > 3) return;
    
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      if (entry.isDirectory()) {
        directories.push(path.relative(rootDir, fullPath));
        await walk(fullPath, depth + 1);
      } else {
        files.push(path.relative(rootDir, fullPath));
      }
    }
  }
  
  await walk(rootDir);
  
  return { directories, files };
}

async function analyzeOpenCodeInstallation(rootDir) {
  const opencodeDir = path.join(rootDir, '.opencode');
  
  try {
    await fs.access(opencodeDir);
    
    const agents = await fs.readdir(path.join(opencodeDir, 'agent')).catch(() => []);
    const commands = await fs.readdir(path.join(opencodeDir, 'command')).catch(() => []);
    const contexts = await fs.readdir(path.join(opencodeDir, 'context')).catch(() => []);
    
    return {
      installed: true,
      components: {
        agents: agents.length,
        commands: commands.length,
        contexts: contexts.length
      }
    };
  } catch {
    return { installed: false };
  }
}

function extractLLMScores(results) {
  if (results.error) return {};
  
  const scores = {};
  
  if (results.gpaResults && results.gpaResults.criteriaGrades) {
    for (const [category, data] of Object.entries(results.gpaResults.criteriaGrades)) {
      scores[category] = parseFloat(data.score);
    }
  }
  
  return scores;
}

function extractGraphScores(results) {
  if (results.error) return {};
  
  const scores = {};
  
  if (results.scores) {
    // Flatten nested scores
    for (const [level, levelScores] of Object.entries(results.scores)) {
      for (const [metric, value] of Object.entries(levelScores)) {
        scores[`${level}_${metric}`] = value;
      }
    }
  }
  
  return scores;
}

function extractFEAScores(results) {
  if (results.error) return {};
  return results.scores || {};
}

function scoreToGPA(score) {
  if (score >= 0.93) return 4.0;
  if (score >= 0.90) return 3.7;
  if (score >= 0.87) return 3.3;
  if (score >= 0.83) return 3.0;
  if (score >= 0.80) return 2.7;
  if (score >= 0.77) return 2.3;
  if (score >= 0.73) return 2.0;
  if (score >= 0.70) return 1.7;
  if (score >= 0.67) return 1.3;
  if (score >= 0.60) return 1.0;
  return 0.0;
}

function gpaToLetter(gpa) {
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.7) return 'A-';
  if (gpa >= 3.3) return 'B+';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.7) return 'B-';
  if (gpa >= 2.3) return 'C+';
  if (gpa >= 2.0) return 'C';
  if (gpa >= 1.7) return 'C-';
  if (gpa >= 1.3) return 'D+';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

function calculatePercentile(gpa) {
  const percentile = (gpa / 4.0) * 100;
  return Math.round(percentile);
}

function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateStdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function generateExecutiveSummary(data) {
  const gpa = parseFloat(data.gpa.overall.gpa);
  const grade = data.gpa.overall.letterGrade;
  
  let assessment = '';
  if (gpa >= 3.5) {
    assessment = 'EXCELLENT - System demonstrates high quality across all metrics';
  } else if (gpa >= 3.0) {
    assessment = 'GOOD - System is well-structured with minor areas for improvement';
  } else if (gpa >= 2.5) {
    assessment = 'SATISFACTORY - System is functional but requires attention to quality';
  } else if (gpa >= 2.0) {
    assessment = 'NEEDS IMPROVEMENT - Significant quality issues identified';
  } else {
    assessment = 'CRITICAL - Major quality concerns require immediate action';
  }
  
  return {
    overallGrade: grade,
    overallGPA: gpa.toFixed(2),
    assessment,
    evaluationDate: data.metadata.timestamp,
    totalDuration: data.metadata.duration,
    methodsUsed: ['LLM-as-Judge', 'Graph Analysis', 'Finite Element Analysis']
  };
}

function summarizeLLMResults(results) {
  if (results.error) return { error: results.error };
  
  return {
    iterations: results.metadata?.iterations || 0,
    models: results.metadata?.models || [],
    totalSamples: results.metadata?.totalSamples || 0,
    consensusScores: results.consensusScores || {},
    recommendations: results.recommendations || []
  };
}

function summarizeGraphResults(results) {
  if (results.error) return { error: results.error };
  
  return {
    nodes: results.graphStats?.nodes || 0,
    edges: results.graphStats?.edges || 0,
    density: results.graphStats?.density?.toFixed(4) || '0',
    analysis: results.analysis || {}
  };
}

function summarizeFEAResults(results) {
  if (results.error) return { error: results.error };
  
  return {
    elements: results.elements || 0,
    summary: results.results?.summary || {},
    hotspots: results.results?.hotspots || []
  };
}

function generateRecommendations(data) {
  const recommendations = [];
  
  // From LLM
  if (data.llmResults.recommendations) {
    recommendations.push(...data.llmResults.recommendations);
  }
  
  // From FEA
  if (data.feaResults.results?.recommendations) {
    recommendations.push(...data.feaResults.results.recommendations);
  }
  
  // Based on GPA
  for (const [category, grades] of Object.entries(data.gpa.categories)) {
    const gpa = parseFloat(grades.gpa);
    if (gpa < 2.0) {
      recommendations.push({
        priority: 'HIGH',
        category,
        gpa: grades.gpa,
        grade: grades.letterGrade,
        action: `Critical improvement needed in ${category}`
      });
    }
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateActionPlan(data) {
  const gpa = parseFloat(data.gpa.overall.gpa);
  
  const plan = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  if (gpa < 2.0) {
    plan.immediate.push('Address critical quality issues');
    plan.immediate.push('Complete missing OpenCode installation components');
    plan.immediate.push('Security audit of configuration files');
  }
  
  if (gpa < 3.0) {
    plan.shortTerm.push('Refactor high-complexity modules');
    plan.shortTerm.push('Improve test coverage');
    plan.shortTerm.push('Document architectural decisions');
  }
  
  plan.longTerm.push('Establish continuous quality monitoring');
  plan.longTerm.push('Integrate quality gates in CI/CD');
  plan.longTerm.push('Regular architectural reviews');
  
  return plan;
}

async function saveReport(report, rootDir) {
  const reportPath = path.join(rootDir, 'comprehensive-evaluation-report.json');
  const mdReportPath = path.join(rootDir, 'comprehensive-evaluation-report.md');
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  await fs.writeFile(mdReportPath, generateMarkdownReport(report));
  
  console.log(`\n  ✅ Report saved to:`);
  console.log(`     • ${reportPath}`);
  console.log(`     • ${mdReportPath}`);
}

function generateMarkdownReport(report) {
  return `# Comprehensive Code Quality Evaluation Report

**Generated**: ${report.metadata.timestamp}  
**Duration**: ${report.metadata.duration}

---

## Executive Summary

**Overall GPA**: ${report.executiveSummary.overallGPA} (${report.executiveSummary.overallGrade})  
**Assessment**: ${report.executiveSummary.assessment}

**Evaluation Methods**:
${report.executiveSummary.methodsUsed.map(m => `- ${m}`).join('\n')}

---

## GPA Results

### Overall Performance
- **GPA**: ${report.gpaResults.overall.gpa}/4.0
- **Letter Grade**: ${report.gpaResults.overall.letterGrade}
- **Percentile**: ${report.gpaResults.overall.percentile}%

### Category Breakdown

| Category | Score | GPA | Grade | Weight |
|----------|-------|-----|-------|--------|
${Object.entries(report.gpaResults.categories).map(([cat, data]) => 
  `| ${cat} | ${data.score} | ${data.gpa} | ${data.letterGrade} | ${data.weight} |`
).join('\n')}

---

## Detailed Analysis

### LLM-as-Judge Results
- **Iterations**: ${report.detailedAnalysis.llmJudge.iterations || 0}
- **Models**: ${report.detailedAnalysis.llmJudge.models?.join(', ') || 'N/A'}
- **Total Samples**: ${report.detailedAnalysis.llmJudge.totalSamples || 0}

### Graph Analysis Results
- **Nodes**: ${report.detailedAnalysis.graphAnalysis.nodes || 0}
- **Edges**: ${report.detailedAnalysis.graphAnalysis.edges || 0}
- **Density**: ${report.detailedAnalysis.graphAnalysis.density || 0}

### Finite Element Analysis Results
- **Elements Analyzed**: ${report.detailedAnalysis.finiteElement.elements || 0}

---

## Recommendations

${report.recommendations.slice(0, 10).map((rec, i) => `
### ${i + 1}. [${rec.priority}] ${rec.category || rec.criterion || 'General'}
${rec.issue || rec.action}
`).join('\n')}

---

## Action Plan

### Immediate Actions
${report.actionPlan.immediate.map(a => `- ${a}`).join('\n')}

### Short-Term (1-2 weeks)
${report.actionPlan.shortTerm.map(a => `- ${a}`).join('\n')}

### Long-Term (1-3 months)
${report.actionPlan.longTerm.map(a => `- ${a}`).join('\n')}

---

*Report generated by Comprehensive Multi-Method Evaluation System*
`;
}

function printSummary(report) {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                      EVALUATION COMPLETE                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log(`  📊 OVERALL GPA: ${report.gpaResults.overall.gpa}/4.0 (${report.gpaResults.overall.letterGrade})`);
  console.log(`  📈 Percentile: ${report.gpaResults.overall.percentile}%`);
  console.log(`  ⏱️  Duration: ${report.metadata.duration}`);
  console.log('\n');
  console.log('  📝 Top Recommendations:');
  report.recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`     ${i + 1}. [${rec.priority}] ${rec.action || rec.issue}`);
  });
  console.log('\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] || '.';
  runComprehensiveEvaluation(rootDir)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runComprehensiveEvaluation };
