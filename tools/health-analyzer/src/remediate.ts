import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import type {
  CodeSmell,
  CodeSmellType,
  HealthReport,
  AnalyzerConfig,
} from './types.js';

export interface RemediationResult {
  file: string;
  smellType: CodeSmellType;
  originalLine: string;
  fixedLine: string;
  line: number;
  status: 'fixed' | 'skipped' | 'failed';
  reason?: string;
}

export interface RemediationReport {
  timestamp: string;
  duration: number;
  totalSmellsFound: number;
  fixed: number;
  skipped: number;
  failed: number;
  results: RemediationResult[];
  filesModified: string[];
  packagesToInstall: string[];
}

interface FileModification {
  path: string;
  originalContent: string;
  modifiedContent: string;
  changes: RemediationResult[];
}

const VENDOR_PACKAGES: Record<CodeSmellType, string[]> = {
  'console-log': ['pino'],
  'hardcoded-path': ['dotenv'],
  'hardcoded-secret': ['dotenv'],
  'custom-auth': ['@clerk/clerk-sdk-node'],
  'custom-http': ['axios'],
  'custom-logging': ['pino'],
  'custom-caching': ['ioredis'],
  'custom-validation': ['zod'],
  'vendor-wrapper': [],
  'custom-state-management': ['zustand'],
};

const SEVERITY_ORDER: Record<CodeSmell['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export class CodeRemediator {
  private dryRun: boolean;
  private verbose: boolean;
  private modifications: Map<string, FileModification> = new Map();

  constructor(options: { dryRun?: boolean; verbose?: boolean } = {}) {
    this.dryRun = options.dryRun ?? false;
    this.verbose = options.verbose ?? false;
  }

  async remediateFromReport(
    report: HealthReport,
    config: Partial<AnalyzerConfig> = {}
  ): Promise<RemediationReport> {
    const startTime = Date.now();
    const results: RemediationResult[] = [];
    const packagesToInstall = new Set<string>();

    const smells = [...report.codeSmells.smells].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );

    for (const smell of smells) {
      const result = await this.remediateSmell(smell);
      results.push(result);

      if (result.status === 'fixed') {
        const packages = VENDOR_PACKAGES[smell.type] || [];
        for (const pkg of packages) {
          packagesToInstall.add(pkg);
        }
      }
    }

    if (!this.dryRun) {
      await this.applyModifications();
    }

    const filesModified = Array.from(this.modifications.keys());

    return {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      totalSmellsFound: smells.length,
      fixed: results.filter((r) => r.status === 'fixed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
      filesModified,
      packagesToInstall: Array.from(packagesToInstall),
    };
  }

  async remediateDirectory(
    basePath: string,
    options: {
      severityFilter?: CodeSmell['severity'][];
      typeFilter?: CodeSmellType[];
    } = {}
  ): Promise<RemediationReport> {
    const { CodeSmellAnalyzer } = await import('./analyzers/codesmells.js');
    const analyzer = new CodeSmellAnalyzer();

    const config: AnalyzerConfig = {
      basePath,
      excludePaths: ['node_modules', '.git', 'dist', 'build'],
      includeVendorTemplates: false,
      includeApiAnalysis: false,
      includeDatabaseAnalysis: false,
      includeInfrastructureAnalysis: false,
      includeCodeSmellDetection: true,
      outputFormat: 'json',
    };

    const analysis = await analyzer.analyze(basePath, config);

    let smells = analysis.smells;

    if (options.severityFilter?.length) {
      smells = smells.filter((s) =>
        options.severityFilter!.includes(s.severity)
      );
    }

    if (options.typeFilter?.length) {
      smells = smells.filter((s) => options.typeFilter!.includes(s.type));
    }

    const mockReport: HealthReport = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      score: {
        overall: 0,
        breakdown: {
          vendorAdoption: 0,
          apiCoverage: 0,
          databaseHealth: 0,
          infrastructureMaturity: 0,
          codeQuality: 0,
        },
        grade: 'F',
      },
      vendors: {
        score: 0,
        templates: [],
        tools: [],
        configurations: [],
        adoptionRate: 0,
        missingVendors: [],
      },
      apis: {
        score: 0,
        graphql: {
          schemas: [],
          queries: 0,
          mutations: 0,
          subscriptions: 0,
          types: 0,
        },
        rest: { endpoints: [], servers: [], documented: 0, undocumented: 0 },
        federation: { enabled: false, subgraphs: [] },
        totalEndpoints: 0,
      },
      databases: {
        score: 0,
        prisma: {
          schemas: [],
          totalModels: 0,
          totalEnums: 0,
          totalRelations: 0,
        },
        connections: [],
        migrations: { pending: 0, applied: 0 },
        totalModels: 0,
      },
      infrastructure: {
        score: 0,
        docker: {
          composeFiles: [],
          dockerfiles: [],
          services: [],
          networks: [],
          volumes: [],
        },
        kubernetes: { helmCharts: [], manifests: [], namespaces: [] },
        monitoring: {
          prometheus: false,
          grafana: false,
          sentry: false,
          datadog: false,
          healthChecks: [],
          metricsEndpoints: [],
        },
        cicd: { workflows: [], provider: 'none' },
      },
      codeSmells: analysis,
      recommendations: [],
      metadata: {
        analyzedAt: new Date().toISOString(),
        duration: 0,
        filesScanned: 0,
        errorsEncountered: [],
      },
    };

    return this.remediateFromReport(mockReport);
  }

  private async remediateSmell(smell: CodeSmell): Promise<RemediationResult> {
    const result: RemediationResult = {
      file: smell.file,
      smellType: smell.type,
      originalLine: '',
      fixedLine: '',
      line: smell.line || 0,
      status: 'skipped',
    };

    try {
      const content = await this.getFileContent(smell.file);
      const lines = content.split('\n');
      const lineIndex = (smell.line || 1) - 1;

      if (lineIndex < 0 || lineIndex >= lines.length) {
        result.status = 'failed';
        result.reason = 'Line number out of range';
        return result;
      }

      result.originalLine = lines[lineIndex];
      const fixedLine = this.applyFix(smell.type, result.originalLine, smell);

      if (fixedLine === null) {
        result.status = 'skipped';
        result.reason = 'No automated fix available';
        return result;
      }

      if (fixedLine === result.originalLine) {
        result.status = 'skipped';
        result.reason = 'No change needed';
        return result;
      }

      result.fixedLine = fixedLine;
      lines[lineIndex] = fixedLine;

      this.stageModification(smell.file, content, lines.join('\n'), result);
      result.status = 'fixed';
    } catch (error) {
      result.status = 'failed';
      result.reason = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  private applyFix(
    type: CodeSmellType,
    line: string,
    smell: CodeSmell
  ): string | null {
    switch (type) {
      case 'console-log':
        return this.fixConsoleLog(line);
      case 'hardcoded-secret':
        return this.fixHardcodedSecret(line);
      case 'hardcoded-path':
        return this.fixHardcodedPath(line);
      case 'custom-logging':
        return this.fixCustomLogging(line);
      case 'custom-validation':
      case 'custom-auth':
      case 'custom-http':
      case 'custom-caching':
      case 'vendor-wrapper':
      case 'custom-state-management':
        return null;
      default:
        return null;
    }
  }

  private fixConsoleLog(line: string): string {
    const consolePatterns = [
      { pattern: /console\.log\s*\(/, replacement: 'logger.info(' },
      { pattern: /console\.error\s*\(/, replacement: 'logger.error(' },
      { pattern: /console\.warn\s*\(/, replacement: 'logger.warn(' },
      { pattern: /console\.debug\s*\(/, replacement: 'logger.debug(' },
      { pattern: /console\.info\s*\(/, replacement: 'logger.info(' },
    ];

    let fixed = line;
    for (const { pattern, replacement } of consolePatterns) {
      fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
  }

  private fixHardcodedSecret(line: string): string {
    const secretPatterns = [
      /(?<key>password|secret|api_?key|token)\s*[:=]\s*['"`](?<value>[^'"`]{8,})['"`]/gi,
    ];

    let fixed = line;
    for (const pattern of secretPatterns) {
      fixed = fixed.replace(pattern, (match, key) => {
        const envVarName = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return `${key}: process.env.${envVarName}`;
      });
    }

    return fixed;
  }

  private fixHardcodedPath(line: string): string {
    const pathPatterns = [
      { pattern: /['"`](\/Users\/\w+[^'"`]*)['"`]/g, envVar: 'HOME' },
      { pattern: /['"`](\/home\/\w+[^'"`]*)['"`]/g, envVar: 'HOME' },
      { pattern: /['"`](C:\\Users\\[^'"`]*)['"`]/g, envVar: 'USERPROFILE' },
    ];

    let fixed = line;
    for (const { pattern, envVar } of pathPatterns) {
      fixed = fixed.replace(pattern, (match, fullPath) => {
        const relativePath = fullPath.replace(
          /^(\/Users\/\w+|\/home\/\w+|C:\\Users\\[^\\]+)/,
          ''
        );
        return `path.join(process.env.${envVar} || '', '${relativePath}')`;
      });
    }

    return fixed;
  }

  private fixCustomLogging(line: string): string {
    if (/class\s+\w*Logger/i.test(line)) {
      return '// TODO: Replace custom Logger class with pino';
    }
    if (/function\s+log\w*\s*\(/i.test(line)) {
      return '// TODO: Replace custom log function with pino';
    }
    return line;
  }

  private async getFileContent(filePath: string): Promise<string> {
    const modification = this.modifications.get(filePath);
    if (modification) {
      return modification.modifiedContent;
    }
    return fs.readFile(filePath, 'utf-8');
  }

  private stageModification(
    filePath: string,
    originalContent: string,
    modifiedContent: string,
    change: RemediationResult
  ): void {
    const existing = this.modifications.get(filePath);
    if (existing) {
      existing.modifiedContent = modifiedContent;
      existing.changes.push(change);
    } else {
      this.modifications.set(filePath, {
        path: filePath,
        originalContent,
        modifiedContent,
        changes: [change],
      });
    }
  }

  private async applyModifications(): Promise<void> {
    for (const [filePath, modification] of this.modifications) {
      try {
        const backupPath = `${filePath}.bak`;
        await fs.writeFile(backupPath, modification.originalContent);
        await fs.writeFile(filePath, modification.modifiedContent);
      } catch {}
    }
  }

  async createBackup(basePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(basePath, '.health-backups', timestamp);
    await fs.mkdir(backupDir, { recursive: true });

    for (const [filePath, modification] of this.modifications) {
      const relativePath = path.relative(basePath, filePath);
      const backupPath = path.join(backupDir, relativePath);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, modification.originalContent);
    }

    return backupDir;
  }

  async rollback(backupDir: string, basePath: string): Promise<void> {
    const allPaths = await glob('**/*', {
      cwd: backupDir,
    });

    for (const file of allPaths) {
      const backupPath = path.join(backupDir, file);
      const originalPath = path.join(basePath, file);
      try {
        const stat = await fs.stat(backupPath);
        if (stat.isFile()) {
          const content = await fs.readFile(backupPath, 'utf-8');
          await fs.writeFile(originalPath, content);
        }
      } catch {}
    }
  }
}

export function generateRemediationMarkdown(report: RemediationReport): string {
  const lines: string[] = [];

  lines.push('# Remediation Report');
  lines.push(`\n**Generated:** ${report.timestamp}`);
  lines.push(`**Duration:** ${report.duration}ms`);

  lines.push('\n## Summary');
  lines.push(`- **Total Smells Found:** ${report.totalSmellsFound}`);
  lines.push(`- **Fixed:** ${report.fixed}`);
  lines.push(`- **Skipped:** ${report.skipped}`);
  lines.push(`- **Failed:** ${report.failed}`);

  if (report.filesModified.length > 0) {
    lines.push('\n## Files Modified');
    for (const file of report.filesModified) {
      lines.push(`- ${file}`);
    }
  }

  if (report.packagesToInstall.length > 0) {
    lines.push('\n## Packages to Install');
    lines.push('\n```bash');
    lines.push(`npm install ${report.packagesToInstall.join(' ')}`);
    lines.push('```');
  }

  if (report.results.filter((r) => r.status === 'fixed').length > 0) {
    lines.push('\n## Changes Applied');
    const fixed = report.results.filter((r) => r.status === 'fixed');
    const byFile = new Map<string, RemediationResult[]>();

    for (const result of fixed) {
      const existing = byFile.get(result.file) || [];
      existing.push(result);
      byFile.set(result.file, existing);
    }

    for (const [file, changes] of byFile) {
      lines.push(`\n### ${file}`);
      for (const change of changes) {
        lines.push(`\n**Line ${change.line}** (${change.smellType}):`);
        lines.push('```diff');
        lines.push(`- ${change.originalLine.trim()}`);
        lines.push(`+ ${change.fixedLine.trim()}`);
        lines.push('```');
      }
    }
  }

  const skipped = report.results.filter(
    (r) => r.status === 'skipped' && r.reason !== 'No change needed'
  );
  if (skipped.length > 0) {
    lines.push('\n## Manual Remediation Required');
    const grouped = new Map<CodeSmellType, RemediationResult[]>();

    for (const result of skipped) {
      const existing = grouped.get(result.smellType) || [];
      existing.push(result);
      grouped.set(result.smellType, existing);
    }

    for (const [type, results] of grouped) {
      const vendorPkg = VENDOR_PACKAGES[type];
      lines.push(`\n### ${type}`);
      if (vendorPkg.length > 0) {
        lines.push(`**Recommended package:** ${vendorPkg.join(', ')}`);
      }
      lines.push('\n| File | Line | Reason |');
      lines.push('|------|------|--------|');
      for (const r of results.slice(0, 10)) {
        lines.push(
          `| ${path.basename(r.file)} | ${r.line} | ${r.reason || 'N/A'} |`
        );
      }
      if (results.length > 10) {
        lines.push(`\n*...and ${results.length - 10} more*`);
      }
    }
  }

  return lines.join('\n');
}

export async function runRemediation(options: {
  path: string;
  dryRun?: boolean;
  verbose?: boolean;
  severity?: CodeSmell['severity'][];
  types?: CodeSmellType[];
  output?: string;
}): Promise<RemediationReport> {
  const remediator = new CodeRemediator({
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  const report = await remediator.remediateDirectory(options.path, {
    severityFilter: options.severity,
    typeFilter: options.types,
  });

  if (options.output) {
    const markdown = generateRemediationMarkdown(report);
    await fs.writeFile(options.output, markdown);
  }

  return report;
}
