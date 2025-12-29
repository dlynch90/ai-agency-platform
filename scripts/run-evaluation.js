#!/usr/bin/env node

/**
 * Simplified Comprehensive Evaluation Runner
 * Focuses on reliable metrics without external dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEvaluation() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE OPENCODE INSTALLATION EVALUATION                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  const results = {
    timestamp: new Date().toISOString(),
    evaluations: {}
  };

  // 1. Static Analysis
  console.log('📊 Phase 1: Static Code Analysis\n');
  results.evaluations.static = await performStaticAnalysis();

  // 2. Structure Analysis
  console.log('\n📂 Phase 2: Structure Analysis\n');
  results.evaluations.structure = await analyzeStructure();

  // 3. Dependency Analysis
  console.log('\n🔗 Phase 3: Dependency Analysis\n');
  results.evaluations.dependencies = await analyzeDependencies();

  // 4. OpenCode Readiness
  console.log('\n✅ Phase 4: OpenCode Readiness Check\n');
  results.evaluations.opencode = await checkOpenCodeReadiness();

  // 5. Calculate GPA
  console.log('\n🎓 Phase 5: GPA Calculation\n');
  results.gpa = calculateGPA(results.evaluations);

  // 6. Generate Report
  await generateReport(results);

  return results;
}

async function performStaticAnalysis() {
  const metrics = {
    totalFiles: 0,
    totalLines: 0,
    fileTypes: {},
    largeFiles: []
  };

  async function scanDir(dir, depth = 0) {
    if (depth > 4) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        await scanDir(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'].includes(ext)) {
          metrics.totalFiles++;
          metrics.fileTypes[ext] = (metrics.fileTypes[ext] || 0) + 1;

          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            metrics.totalLines += lines;

            if (lines > 500) {
              metrics.largeFiles.push({ path: fullPath, lines });
            }
          } catch (e) {
            // Skip files we can't read
          }
        }
      }
    }
  }

  await scanDir('.');

  console.log(`  ✓ Analyzed ${metrics.totalFiles} files`);
  console.log(`  ✓ Total lines of code: ${metrics.totalLines.toLocaleString()}`);

  return {
    metrics,
    score: calculateStaticScore(metrics)
  };
}

async function analyzeStructure() {
  const requiredDirs = [
    'standards',
    'workflows',
    'tasks',
    '.opencode',
    '.opencode/agent',
    '.opencode/command',
    '.opencode/context'
  ];

  const exists = {};
  let presentCount = 0;

  for (const dir of requiredDirs) {
    try {
      await fs.access(dir);
      exists[dir] = true;
      presentCount++;
      console.log(`  ✓ ${dir}`);
    } catch {
      exists[dir] = false;
      console.log(`  ✗ ${dir} (missing)`);
    }
  }

  const completeness = presentCount / requiredDirs.length;

  return {
    requiredDirectories: requiredDirs.length,
    presentDirectories: presentCount,
    exists,
    completeness,
    score: completeness
  };
}

async function analyzeDependencies() {
  try {
    const pkgContent = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(pkgContent);

    const prodDeps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    const criticalDeps = [
      '@langchain/community',
      '@langchain/core',
      'typescript',
      'vitest',
      'vite'
    ];

    const present = criticalDeps.filter(dep => 
      prodDeps.includes(dep) || devDeps.includes(dep)
    );

    console.log(`  ✓ Production dependencies: ${prodDeps.length}`);
    console.log(`  ✓ Development dependencies: ${devDeps.length}`);
    console.log(`  ✓ Critical dependencies present: ${present.length}/${criticalDeps.length}`);

    return {
      production: prodDeps.length,
      development: devDeps.length,
      criticalPresent: present.length,
      criticalTotal: criticalDeps.length,
      score: present.length / criticalDeps.length
    };
  } catch (e) {
    console.log('  ✗ Failed to read package.json');
    return { score: 0 };
  }
}

async function checkOpenCodeReadiness() {
  const checks = [
    { name: 'OpenCode directory exists', path: '.opencode' },
    { name: 'Standards directory exists', path: 'standards' },
    { name: 'Workflows directory exists', path: 'workflows' },
    { name: 'Tasks directory exists', path: 'tasks' },
    { name: 'package.json exists', path: 'package.json' },
    { name: 'tsconfig.json exists', path: 'tsconfig.json' },
    { name: 'Environment example', path: '.opencode/env.example' }
  ];

  let passed = 0;

  for (const check of checks) {
    try {
      await fs.access(check.path);
      console.log(`  ✓ ${check.name}`);
      passed++;
    } catch {
      console.log(`  ✗ ${check.name}`);
    }
  }

  const readiness = passed / checks.length;

  return {
    totalChecks: checks.length,
    passed,
    readiness,
    score: readiness
  };
}

function calculateStaticScore(metrics) {
  // Score based on code organization
  let score = 0.5; // Base score

  // Bonus for reasonable file count
  if (metrics.totalFiles >= 10 && metrics.totalFiles <= 1000) {
    score += 0.2;
  }

  // Penalty for too many large files
  if (metrics.largeFiles.length / metrics.totalFiles < 0.1) {
    score += 0.15;
  }

  // Bonus for language diversity
  if (Object.keys(metrics.fileTypes).length >= 2) {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

function calculateGPA(evaluations) {
  const categories = {
    'Static Analysis': { score: evaluations.static?.score || 0, weight: 0.25 },
    'Structure Completeness': { score: evaluations.structure?.score || 0, weight: 0.30 },
    'Dependencies': { score: evaluations.dependencies?.score || 0, weight: 0.20 },
    'OpenCode Readiness': { score: evaluations.opencode?.score || 0, weight: 0.25 }
  };

  let weightedSum = 0;
  let totalWeight = 0;

  const categoryResults = {};

  for (const [name, data] of Object.entries(categories)) {
    const gpa = scoreToGPA(data.score);
    const letter = gpaToLetter(gpa);

    categoryResults[name] = {
      score: data.score.toFixed(3),
      gpa: gpa.toFixed(2),
      letter,
      weight: data.weight.toFixed(2)
    };

    weightedSum += gpa * data.weight;
    totalWeight += data.weight;

    console.log(`  ${name}: ${data.score.toFixed(3)} → ${gpa.toFixed(2)} (${letter})`);
  }

  const overallGPA = weightedSum / totalWeight;
  const overallLetter = gpaToLetter(overallGPA);

  console.log(`\n  Overall GPA: ${overallGPA.toFixed(2)}/4.0 (${overallLetter})`);

  return {
    overall: {
      gpa: overallGPA.toFixed(2),
      letter: overallLetter,
      percentile: Math.round((overallGPA / 4.0) * 100)
    },
    categories: categoryResults
  };
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

async function generateReport(results) {
  console.log('\n📝 Generating Report\n');

  const report = `# Comprehensive OpenCode Evaluation Report

**Generated**: ${results.timestamp}

---

## Executive Summary

**Overall GPA**: ${results.gpa.overall.gpa}/4.0 (${results.gpa.overall.letter})  
**Percentile**: ${results.gpa.overall.percentile}%

---

## Category Breakdown

| Category | Score | GPA | Grade | Weight |
|----------|-------|-----|-------|--------|
${Object.entries(results.gpa.categories).map(([cat, data]) => 
  `| ${cat} | ${data.score} | ${data.gpa} | ${data.letter} | ${data.weight} |`
).join('\n')}

---

## Detailed Analysis

### Static Analysis
- **Total Files**: ${results.evaluations.static.metrics.totalFiles.toLocaleString()}
- **Total Lines**: ${results.evaluations.static.metrics.totalLines.toLocaleString()}
- **File Types**: ${Object.entries(results.evaluations.static.metrics.fileTypes)
    .map(([ext, count]) => `${ext}: ${count}`).join(', ')}
- **Large Files (>500 lines)**: ${results.evaluations.static.metrics.largeFiles.length}

### Structure Completeness
- **Required Directories**: ${results.evaluations.structure.requiredDirectories}
- **Present**: ${results.evaluations.structure.presentDirectories}
- **Completeness**: ${(results.evaluations.structure.completeness * 100).toFixed(1)}%

Missing Directories:
${Object.entries(results.evaluations.structure.exists)
  .filter(([_, exists]) => !exists)
  .map(([dir]) => `- ${dir}`)
  .join('\n')}

### Dependencies
- **Production Dependencies**: ${results.evaluations.dependencies.production || 0}
- **Development Dependencies**: ${results.evaluations.dependencies.development || 0}
- **Critical Dependencies Present**: ${results.evaluations.dependencies.criticalPresent || 0}/${results.evaluations.dependencies.criticalTotal || 0}

### OpenCode Readiness
- **Checks Passed**: ${results.evaluations.opencode.passed}/${results.evaluations.opencode.totalChecks}
- **Readiness**: ${(results.evaluations.opencode.readiness * 100).toFixed(1)}%

---

## Recommendations

### Priority 1: Critical Gaps
${results.gpa.overall.gpa < 2.5 ? `
- Complete missing directory structures (standards/, workflows/, tasks/)
- Install missing critical dependencies
- Configure environment variables
` : '- System structure is adequate'}

### Priority 2: Quality Improvements
- Refactor large files (>500 lines)
- Improve test coverage
- Document architecture decisions

### Priority 3: Enhancement
- Set up CI/CD integration
- Configure git hooks
- Establish code review process

---

## Action Plan

### Immediate (Today)
1. Create missing directories: \`mkdir -p standards workflows tasks/subtasks\`
2. Review and configure .env file
3. Run validation: \`npm run validate:tools\`

### Short-Term (1-2 Days)
1. Populate standards directory with code guidelines
2. Define workflows for common tasks
3. Set up task tracking structure

### Long-Term (1 Week)
1. Integrate with CI/CD pipeline
2. Establish quality gates
3. Train team on OpenCode usage

---

*Generated by Comprehensive Multi-Method Evaluation System*
`;

  await fs.writeFile('final-evaluation-report.md', report);
  await fs.writeFile('final-evaluation-report.json', JSON.stringify(results, null, 2));

  console.log('  ✓ Report saved to:');
  console.log('    • final-evaluation-report.md');
  console.log('    • final-evaluation-report.json');

  console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    EVALUATION COMPLETE                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');
}

runEvaluation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
