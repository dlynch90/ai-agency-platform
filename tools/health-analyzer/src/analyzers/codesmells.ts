import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import type {
  Analyzer,
  AnalyzerConfig,
  CodeSmellAnalysis,
  CodeSmell,
  CodeSmellCategory,
  CodeSmellType,
  VendorReplacement,
} from '../types.js';

interface SmellPattern {
  type: CodeSmellType;
  pattern: RegExp;
  description: string;
  vendorAlternative: string;
  severity: CodeSmell['severity'];
  effort: string;
}

const SMELL_PATTERNS: SmellPattern[] = [
  {
    type: 'console-log',
    pattern: /console\.(log|debug|info|warn|error)\s*\(/g,
    description: 'Console statement found - use structured logging',
    vendorAlternative: 'pino, winston, or structlog',
    severity: 'low',
    effort: '30 minutes',
  },
  {
    type: 'hardcoded-path',
    pattern: /['"`]\/Users\/\w+|['"`]\/home\/\w+|['"`]C:\\Users/g,
    description: 'Hardcoded user path - use environment variables',
    vendorAlternative: 'dotenv, env-var, or config package',
    severity: 'medium',
    effort: '1 hour',
  },
  {
    type: 'hardcoded-secret',
    pattern: /(?:password|secret|api_?key|token)\s*[:=]\s*['"`][^'"`]{8,}/gi,
    description: 'Potential hardcoded secret - use secret management',
    vendorAlternative: '@1password/sdk, vault, or AWS Secrets Manager',
    severity: 'critical',
    effort: '2 hours',
  },
  {
    type: 'custom-auth',
    pattern:
      /class\s+\w*Auth\w*|function\s+\w*(authenticate|authorize)\w*\s*\(|jwt\s*\.\s*sign\s*\(/gi,
    description: 'Custom authentication implementation',
    vendorAlternative: '@clerk/clerk-sdk-node, auth0, or passport.js',
    severity: 'high',
    effort: '1 sprint',
  },
  {
    type: 'custom-http',
    pattern:
      /class\s+\w*Http\w*Parser|function\s+parse\w*Request|new\s+XMLHttpRequest\s*\(/gi,
    description: 'Custom HTTP handling - use standard libraries',
    vendorAlternative: 'axios, node-fetch, or got',
    severity: 'high',
    effort: '1 sprint',
  },
  {
    type: 'custom-logging',
    pattern:
      /class\s+\w*Logger\w*|function\s+log\w*\s*\(|\.log\s*=\s*function/gi,
    description: 'Custom logging implementation',
    vendorAlternative: 'pino, winston, bunyan, or structlog',
    severity: 'medium',
    effort: '4 hours',
  },
  {
    type: 'custom-caching',
    pattern:
      /class\s+\w*Cache\w*Manager|new\s+Map\s*\(\s*\)[\s\S]{0,50}cache|memoryCache\s*=/gi,
    description: 'Custom caching implementation',
    vendorAlternative: 'ioredis, node-cache, or keyv',
    severity: 'medium',
    effort: '4 hours',
  },
  {
    type: 'custom-validation',
    pattern:
      /class\s+\w*Validator\w*|function\s+validate\w*\s*\([^)]*\)\s*{[\s\S]{50,}/gi,
    description: 'Custom validation logic - use schema validation',
    vendorAlternative: 'zod, yup, joi, or class-validator',
    severity: 'medium',
    effort: '2 hours',
  },
  {
    type: 'vendor-wrapper',
    pattern:
      /class\s+\w*(Redis|Postgres|Neo4j|Prisma)\w*(?:Manager|Wrapper|Client)/gi,
    description: 'Unnecessary wrapper around vendor library',
    vendorAlternative: 'Use vendor library directly',
    severity: 'low',
    effort: '2 hours',
  },
];

const VENDOR_REPLACEMENTS: Record<CodeSmellType, VendorReplacement['package']> =
  {
    'console-log': 'pino',
    'hardcoded-path': 'dotenv',
    'hardcoded-secret': '@1password/sdk',
    'custom-auth': '@clerk/clerk-sdk-node',
    'custom-http': 'axios',
    'custom-logging': 'pino',
    'custom-caching': 'ioredis',
    'custom-validation': 'zod',
    'vendor-wrapper': 'direct vendor import',
    'custom-state-management': 'zustand',
  };

export class CodeSmellAnalyzer implements Analyzer<CodeSmellAnalysis> {
  name = 'CodeSmellAnalyzer';

  async analyze(
    basePath: string,
    config: AnalyzerConfig
  ): Promise<CodeSmellAnalysis> {
    const smells: CodeSmell[] = [];
    const vendorReplacements: VendorReplacement[] = [];

    const files = await glob('**/*.{js,ts,jsx,tsx,py}', {
      cwd: basePath,
      ignore: [
        ...(config.excludePaths || []),
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.d.ts',
      ],
    });

    for (const file of files) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (const pattern of SMELL_PATTERNS) {
          const matches = content.matchAll(pattern.pattern);

          for (const match of matches) {
            const lineNumber = this.getLineNumber(content, match.index || 0);
            const lineContent = lines[lineNumber - 1]?.trim() || '';

            if (this.isInTestFile(file) || this.isInComment(lineContent))
              continue;

            smells.push({
              type: pattern.type,
              severity: pattern.severity,
              file: fullPath,
              line: lineNumber,
              description: pattern.description,
              vendorAlternative: pattern.vendorAlternative,
              effort: pattern.effort,
            });

            if (['critical', 'high'].includes(pattern.severity)) {
              vendorReplacements.push({
                currentCode: lineContent.slice(0, 100),
                file: fullPath,
                vendorSolution: pattern.vendorAlternative,
                package: VENDOR_REPLACEMENTS[pattern.type],
                effort: pattern.effort,
                priority: pattern.severity as VendorReplacement['priority'],
              });
            }
          }
        }
      } catch {}
    }

    const categories = this.categorizeSmells(smells);
    const score = this.calculateScore(smells);

    return {
      score,
      totalSmells: smells.length,
      smells: smells.slice(0, 100),
      categories,
      vendorReplacements: vendorReplacements.slice(0, 50),
    };
  }

  private getLineNumber(content: string, index: number): number {
    const beforeMatch = content.slice(0, index);
    return (beforeMatch.match(/\n/g) || []).length + 1;
  }

  private isInTestFile(file: string): boolean {
    return (
      file.includes('.test.') ||
      file.includes('.spec.') ||
      file.includes('__tests__')
    );
  }

  private isInComment(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('#')
    );
  }

  private categorizeSmells(smells: CodeSmell[]): CodeSmellCategory[] {
    const categoryMap = new Map<
      CodeSmellType,
      { count: number; severity: CodeSmell['severity'] }
    >();

    for (const smell of smells) {
      const existing = categoryMap.get(smell.type);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(smell.type, { count: 1, severity: smell.severity });
      }
    }

    const categoryDescriptions: Record<CodeSmellType, string> = {
      'console-log': 'Console statements that should use structured logging',
      'hardcoded-path': 'Hardcoded file paths that reduce portability',
      'hardcoded-secret': 'Potential secrets that should use secret management',
      'custom-auth': 'Custom authentication that should use vendor solutions',
      'custom-http': 'Custom HTTP handling that should use standard libraries',
      'custom-logging': 'Custom logging that should use vendor loggers',
      'custom-caching': 'Custom caching that should use vendor solutions',
      'custom-validation': 'Custom validation that should use schema libraries',
      'vendor-wrapper': 'Unnecessary wrappers around vendor libraries',
      'custom-state-management': 'Custom state management patterns',
    };

    return Array.from(categoryMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      severity: data.severity,
      description: categoryDescriptions[type],
    }));
  }

  private calculateScore(smells: CodeSmell[]): number {
    let score = 100;

    const criticalCount = smells.filter(
      (s) => s.severity === 'critical'
    ).length;
    const highCount = smells.filter((s) => s.severity === 'high').length;
    const mediumCount = smells.filter((s) => s.severity === 'medium').length;
    const lowCount = smells.filter((s) => s.severity === 'low').length;

    score -= criticalCount * 10;
    score -= highCount * 5;
    score -= mediumCount * 2;
    score -= lowCount * 0.5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
