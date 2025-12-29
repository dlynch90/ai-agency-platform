#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { CodebaseHealthAnalyzer } from './index.js';
import { runRemediation } from './remediate.js';
import type { HealthReport, CodeSmell, CodeSmellType } from './types.js';

const program = new Command();

program
  .name('codebase-health')
  .description(
    'Comprehensive codebase health analyzer with vendor adoption scoring'
  )
  .version('1.0.0');

program
  .option('-p, --path <path>', 'Base path to analyze', process.cwd())
  .option('-f, --format <format>', 'Output format (json, markdown)', 'json')
  .option('--ultrathink', 'Enable deep analysis mode', false)
  .option('--no-vendors', 'Skip vendor analysis')
  .option('--no-apis', 'Skip API analysis')
  .option('--no-databases', 'Skip database analysis')
  .option('--no-infrastructure', 'Skip infrastructure analysis')
  .option('--no-codesmells', 'Skip code smell detection')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    const startTime = Date.now();

    console.log('\n🔬 Codebase Health Analyzer v1.0.0');
    console.log('═'.repeat(50));

    if (options.ultrathink) {
      console.log(
        '🧠 ULTRATHINK mode enabled - deep analysis in progress...\n'
      );
    }

    const analyzer = new CodebaseHealthAnalyzer();

    try {
      const report = await analyzer.analyze(options.path, {
        includeVendorTemplates: options.vendors !== false,
        includeApiAnalysis: options.apis !== false,
        includeDatabaseAnalysis: options.databases !== false,
        includeInfrastructureAnalysis: options.infrastructure !== false,
        includeCodeSmellDetection: options.codesmells !== false,
        outputFormat: options.format,
      });

      if (options.format === 'markdown') {
        console.log(generateMarkdownReport(report));
      } else {
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify(report, null, 2));
          console.log(`\n📄 Report saved to: ${options.output}`);
        } else {
          console.log(JSON.stringify(report, null, 2));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`\n⏱️  Analysis completed in ${duration}ms`);
      console.log(
        `📊 Overall Score: ${report.score.overall}/100 (Grade: ${report.score.grade})`
      );

      if (report.recommendations.length > 0) {
        const critical = report.recommendations.filter(
          (r) => r.priority === 'critical'
        ).length;
        const high = report.recommendations.filter(
          (r) => r.priority === 'high'
        ).length;
        console.log(
          `\n⚠️  ${critical} critical, ${high} high priority recommendations`
        );
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

function generateMarkdownReport(report: HealthReport): string {
  const lines: string[] = [];

  lines.push('# Codebase Health Report');
  lines.push(`\n**Generated:** ${report.timestamp}`);
  lines.push(`**Duration:** ${report.metadata.duration}ms`);

  lines.push('\n## Overall Score');
  lines.push(
    `\n**${report.score.overall}/100** (Grade: **${report.score.grade}**)`
  );

  lines.push('\n### Score Breakdown');
  lines.push('| Category | Score |');
  lines.push('|----------|-------|');
  lines.push(`| Vendor Adoption | ${report.score.breakdown.vendorAdoption} |`);
  lines.push(`| API Coverage | ${report.score.breakdown.apiCoverage} |`);
  lines.push(`| Database Health | ${report.score.breakdown.databaseHealth} |`);
  lines.push(
    `| Infrastructure Maturity | ${report.score.breakdown.infrastructureMaturity} |`
  );
  lines.push(`| Code Quality | ${report.score.breakdown.codeQuality} |`);

  lines.push('\n## Vendor Analysis');
  lines.push(`\n**Adoption Rate:** ${report.vendors.adoptionRate}%`);
  lines.push(`**Templates:** ${report.vendors.templates.length}`);
  lines.push(
    `**Tools Installed:** ${report.vendors.tools.filter((t) => t.installed).length}/${report.vendors.tools.length}`
  );

  if (report.vendors.missingVendors.length > 0) {
    lines.push(
      `\n⚠️ **Missing Vendors:** ${report.vendors.missingVendors.join(', ')}`
    );
  }

  lines.push('\n## API Analysis');
  lines.push(`\n**Total Endpoints:** ${report.apis.totalEndpoints}`);
  lines.push(`**GraphQL Schemas:** ${report.apis.graphql.schemas.length}`);
  lines.push(
    `**GraphQL Operations:** ${report.apis.graphql.queries} queries, ${report.apis.graphql.mutations} mutations`
  );
  lines.push(`**REST Endpoints:** ${report.apis.rest.endpoints.length}`);
  lines.push(
    `**Federation:** ${report.apis.federation.enabled ? 'Enabled' : 'Disabled'}`
  );

  lines.push('\n## Database Analysis');
  lines.push(`\n**Total Models:** ${report.databases.totalModels}`);
  lines.push(`**Prisma Schemas:** ${report.databases.prisma.schemas.length}`);
  lines.push(
    `**Database Connections:** ${report.databases.connections.length}`
  );
  lines.push(
    `**Migrations:** ${report.databases.migrations.applied} applied, ${report.databases.migrations.pending} pending`
  );

  lines.push('\n## Infrastructure Analysis');
  lines.push(
    `\n**Docker Compose Files:** ${report.infrastructure.docker.composeFiles.length}`
  );
  lines.push(
    `**Docker Services:** ${report.infrastructure.docker.services.length}`
  );
  lines.push(
    `**Helm Charts:** ${report.infrastructure.kubernetes.helmCharts.length}`
  );
  lines.push(`**CI/CD Provider:** ${report.infrastructure.cicd.provider}`);
  lines.push(
    `**Monitoring:** Prometheus: ${report.infrastructure.monitoring.prometheus ? '✅' : '❌'}, Grafana: ${report.infrastructure.monitoring.grafana ? '✅' : '❌'}`
  );

  lines.push('\n## Code Quality');
  lines.push(`\n**Total Code Smells:** ${report.codeSmells.totalSmells}`);

  if (report.codeSmells.categories.length > 0) {
    lines.push('\n### Code Smell Categories');
    lines.push('| Type | Count | Severity |');
    lines.push('|------|-------|----------|');
    for (const cat of report.codeSmells.categories) {
      lines.push(`| ${cat.type} | ${cat.count} | ${cat.severity} |`);
    }
  }

  if (report.recommendations.length > 0) {
    lines.push('\n## Recommendations');
    for (const rec of report.recommendations) {
      const emoji =
        rec.priority === 'critical'
          ? '🔴'
          : rec.priority === 'high'
            ? '🟠'
            : rec.priority === 'medium'
              ? '🟡'
              : '🟢';
      lines.push(`\n### ${emoji} ${rec.title}`);
      lines.push(
        `\n**Priority:** ${rec.priority} | **Category:** ${rec.category} | **Effort:** ${rec.effort}`
      );
      lines.push(`\n${rec.description}`);
      lines.push(`\n**Impact:** ${rec.impact}`);
      lines.push('\n**Actions:**');
      for (const action of rec.actions) {
        lines.push(`- ${action}`);
      }
    }
  }

  return lines.join('\n');
}

program
  .command('fix')
  .description('Auto-fix detected code smells')
  .option('-p, --path <path>', 'Base path to analyze', process.cwd())
  .option('--dry-run', 'Preview changes without applying them', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option(
    '--severity <levels>',
    'Filter by severity (comma-separated: critical,high,medium,low)'
  )
  .option('--types <types>', 'Filter by smell types (comma-separated)')
  .option('-o, --output <file>', 'Output remediation report to file')
  .action(async (options) => {
    const startTime = Date.now();

    console.log('\n🔧 Codebase Remediation Tool v1.0.0');
    console.log('═'.repeat(50));

    if (options.dryRun) {
      console.log('🔍 DRY RUN mode - no changes will be applied\n');
    }

    const severityFilter = options.severity
      ? (options.severity.split(',') as CodeSmell['severity'][])
      : undefined;

    const typeFilter = options.types
      ? (options.types.split(',') as CodeSmellType[])
      : undefined;

    try {
      const report = await runRemediation({
        path: options.path,
        dryRun: options.dryRun,
        verbose: options.verbose,
        severity: severityFilter,
        types: typeFilter,
        output: options.output,
      });

      console.log('\n📊 Remediation Summary');
      console.log('─'.repeat(30));
      console.log(`Total Smells Found: ${report.totalSmellsFound}`);
      console.log(`✅ Fixed: ${report.fixed}`);
      console.log(`⏭️  Skipped: ${report.skipped}`);
      console.log(`❌ Failed: ${report.failed}`);

      if (report.filesModified.length > 0) {
        console.log(`\n📁 Files Modified: ${report.filesModified.length}`);
        for (const file of report.filesModified.slice(0, 5)) {
          console.log(`   - ${file}`);
        }
        if (report.filesModified.length > 5) {
          console.log(`   ... and ${report.filesModified.length - 5} more`);
        }
      }

      if (report.packagesToInstall.length > 0) {
        console.log('\n📦 Install required packages:');
        console.log(`   npm install ${report.packagesToInstall.join(' ')}`);
      }

      if (options.output) {
        console.log(`\n📄 Full report saved to: ${options.output}`);
      }

      const duration = Date.now() - startTime;
      console.log(`\n⏱️  Completed in ${duration}ms`);

      if (options.dryRun) {
        console.log('\n💡 Run without --dry-run to apply changes');
      }
    } catch (error) {
      console.error('❌ Remediation failed:', error);
      process.exit(1);
    }
  });

program.parse();
