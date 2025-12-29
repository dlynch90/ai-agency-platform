import type {
  HealthReport,
  HealthScore,
  Recommendation,
  AnalyzerConfig,
} from './types.js';
import { VendorAnalyzer } from './analyzers/vendor.js';
import { ApiAnalyzer } from './analyzers/api.js';
import { DatabaseAnalyzer } from './analyzers/database.js';
import { InfrastructureAnalyzer } from './analyzers/infrastructure.js';
import { CodeSmellAnalyzer } from './analyzers/codesmells.js';

export class CodebaseHealthAnalyzer {
  private vendorAnalyzer = new VendorAnalyzer();
  private apiAnalyzer = new ApiAnalyzer();
  private databaseAnalyzer = new DatabaseAnalyzer();
  private infrastructureAnalyzer = new InfrastructureAnalyzer();
  private codeSmellAnalyzer = new CodeSmellAnalyzer();

  async analyze(
    basePath: string,
    config: Partial<AnalyzerConfig> = {}
  ): Promise<HealthReport> {
    const startTime = Date.now();
    const errors: string[] = [];

    const fullConfig: AnalyzerConfig = {
      basePath,
      excludePaths: config.excludePaths || [
        'node_modules',
        '.git',
        'dist',
        'build',
      ],
      includeVendorTemplates: config.includeVendorTemplates ?? true,
      includeApiAnalysis: config.includeApiAnalysis ?? true,
      includeDatabaseAnalysis: config.includeDatabaseAnalysis ?? true,
      includeInfrastructureAnalysis:
        config.includeInfrastructureAnalysis ?? true,
      includeCodeSmellDetection: config.includeCodeSmellDetection ?? true,
      outputFormat: config.outputFormat || 'json',
    };

    const results = await Promise.allSettled([
      this.vendorAnalyzer.analyze(basePath, fullConfig),
      this.apiAnalyzer.analyze(basePath, fullConfig),
      this.databaseAnalyzer.analyze(basePath, fullConfig),
      this.infrastructureAnalyzer.analyze(basePath, fullConfig),
      this.codeSmellAnalyzer.analyze(basePath, fullConfig),
    ]);

    const [vendorResult, apiResult, dbResult, infraResult, smellResult] =
      results;

    const vendors =
      vendorResult.status === 'fulfilled'
        ? vendorResult.value
        : this.getDefaultVendorAnalysis();
    const apis =
      apiResult.status === 'fulfilled'
        ? apiResult.value
        : this.getDefaultApiAnalysis();
    const databases =
      dbResult.status === 'fulfilled'
        ? dbResult.value
        : this.getDefaultDatabaseAnalysis();
    const infrastructure =
      infraResult.status === 'fulfilled'
        ? infraResult.value
        : this.getDefaultInfrastructureAnalysis();
    const codeSmells =
      smellResult.status === 'fulfilled'
        ? smellResult.value
        : this.getDefaultCodeSmellAnalysis();

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const names = [
          'vendor',
          'api',
          'database',
          'infrastructure',
          'codesmell',
        ];
        errors.push(`${names[i]} analyzer failed: ${r.reason}`);
      }
    });

    const score = this.calculateOverallScore(
      vendors.score,
      apis.score,
      databases.score,
      infrastructure.score,
      codeSmells.score
    );
    const recommendations = this.generateRecommendations(
      vendors,
      apis,
      databases,
      infrastructure,
      codeSmells
    );

    const duration = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      score,
      vendors,
      apis,
      databases,
      infrastructure,
      codeSmells,
      recommendations,
      metadata: {
        analyzedAt: new Date().toISOString(),
        duration,
        filesScanned: this.estimateFilesScanned(
          vendors,
          apis,
          databases,
          infrastructure,
          codeSmells
        ),
        errorsEncountered: errors,
      },
    };
  }

  private calculateOverallScore(
    vendorScore: number,
    apiScore: number,
    dbScore: number,
    infraScore: number,
    codeScore: number
  ): HealthScore {
    const weights = {
      vendorAdoption: 0.25,
      apiCoverage: 0.2,
      databaseHealth: 0.2,
      infrastructureMaturity: 0.15,
      codeQuality: 0.2,
    };

    const overall = Math.round(
      vendorScore * weights.vendorAdoption +
        apiScore * weights.apiCoverage +
        dbScore * weights.databaseHealth +
        infraScore * weights.infrastructureMaturity +
        codeScore * weights.codeQuality
    );

    const grade =
      overall >= 90
        ? 'A'
        : overall >= 80
          ? 'B'
          : overall >= 70
            ? 'C'
            : overall >= 60
              ? 'D'
              : 'F';

    return {
      overall,
      breakdown: {
        vendorAdoption: vendorScore,
        apiCoverage: apiScore,
        databaseHealth: dbScore,
        infrastructureMaturity: infraScore,
        codeQuality: codeScore,
      },
      grade,
    };
  }

  private generateRecommendations(
    vendors: ReturnType<VendorAnalyzer['analyze']> extends Promise<infer T>
      ? T
      : never,
    apis: ReturnType<ApiAnalyzer['analyze']> extends Promise<infer T>
      ? T
      : never,
    databases: ReturnType<DatabaseAnalyzer['analyze']> extends Promise<infer T>
      ? T
      : never,
    infrastructure: ReturnType<
      InfrastructureAnalyzer['analyze']
    > extends Promise<infer T>
      ? T
      : never,
    codeSmells: ReturnType<CodeSmellAnalyzer['analyze']> extends Promise<
      infer T
    >
      ? T
      : never
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let id = 1;

    if (vendors.missingVendors.length > 0) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'vendor',
        priority: 'high',
        title: 'Install Missing Vendor Tools',
        description: `${vendors.missingVendors.length} required vendor tools are not installed`,
        impact: 'Improved development workflow and compliance',
        effort: '1-2 hours',
        actions: vendors.missingVendors.map((v) => `Install ${v}`),
      });
    }

    if (vendors.adoptionRate < 70) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'vendor',
        priority: 'medium',
        title: 'Increase Vendor Template Usage',
        description: `Current vendor adoption rate is ${vendors.adoptionRate}%`,
        impact: 'Reduced custom code, better maintainability',
        effort: '1 sprint',
        actions: [
          'Review templates/vendor directory',
          'Migrate custom implementations to vendor solutions',
        ],
      });
    }

    if (!apis.federation.enabled && apis.graphql.schemas.length > 1) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'api',
        priority: 'medium',
        title: 'Consider GraphQL Federation',
        description: 'Multiple GraphQL schemas detected without federation',
        impact: 'Unified API surface, better schema composition',
        effort: '2-3 sprints',
        actions: [
          'Evaluate Apollo Federation',
          'Create federation gateway',
          'Convert schemas to subgraphs',
        ],
      });
    }

    if (apis.rest.undocumented > apis.rest.documented) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'api',
        priority: 'low',
        title: 'Document REST Endpoints',
        description: `${apis.rest.undocumented} undocumented endpoints found`,
        impact: 'Better API discoverability and developer experience',
        effort: '2-4 hours per endpoint',
        actions: [
          'Add OpenAPI/Swagger annotations',
          'Generate API documentation',
        ],
      });
    }

    if (databases.migrations.pending > 0) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'database',
        priority: 'high',
        title: 'Apply Pending Migrations',
        description: `${databases.migrations.pending} pending database migrations`,
        impact: 'Database schema consistency',
        effort: '30 minutes',
        actions: ['Run prisma migrate deploy', 'Verify schema state'],
      });
    }

    if (!infrastructure.monitoring.prometheus) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'infrastructure',
        priority: 'medium',
        title: 'Add Prometheus Monitoring',
        description: 'No Prometheus integration detected',
        impact: 'Better observability and alerting',
        effort: '4-8 hours',
        actions: [
          'Add prom-client dependency',
          'Expose /metrics endpoint',
          'Configure Prometheus scraping',
        ],
      });
    }

    if (infrastructure.cicd.provider === 'none') {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'infrastructure',
        priority: 'high',
        title: 'Set Up CI/CD Pipeline',
        description: 'No CI/CD configuration detected',
        impact: 'Automated testing and deployment',
        effort: '1-2 days',
        actions: [
          'Create .github/workflows directory',
          'Add CI workflow for testing',
          'Add CD workflow for deployment',
        ],
      });
    }

    const criticalSmells = codeSmells.categories.filter(
      (c) => c.severity === 'critical'
    );
    if (criticalSmells.length > 0) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'code-quality',
        priority: 'critical',
        title: 'Address Critical Code Issues',
        description: `${criticalSmells.reduce((sum, c) => sum + c.count, 0)} critical code issues detected`,
        impact: 'Security and reliability improvements',
        effort: '1-2 sprints',
        actions: criticalSmells.map((c) => `Fix ${c.count} ${c.type} issues`),
      });
    }

    if (codeSmells.vendorReplacements.length > 0) {
      recommendations.push({
        id: `rec-${id++}`,
        category: 'code-quality',
        priority: 'medium',
        title: 'Replace Custom Code with Vendor Solutions',
        description: `${codeSmells.vendorReplacements.length} custom implementations can be replaced`,
        impact: 'Reduced maintenance, better security',
        effort: '2-4 sprints',
        actions: codeSmells.vendorReplacements
          .slice(0, 5)
          .map(
            (r) => `Replace ${r.currentCode.slice(0, 30)}... with ${r.package}`
          ),
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private estimateFilesScanned(...analyses: { score: number }[]): number {
    return analyses.length * 100;
  }

  private getDefaultVendorAnalysis() {
    return {
      score: 0,
      templates: [],
      tools: [],
      configurations: [],
      adoptionRate: 0,
      missingVendors: [],
    };
  }

  private getDefaultApiAnalysis() {
    return {
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
    };
  }

  private getDefaultDatabaseAnalysis() {
    return {
      score: 0,
      prisma: { schemas: [], totalModels: 0, totalEnums: 0, totalRelations: 0 },
      connections: [],
      migrations: { pending: 0, applied: 0 },
      totalModels: 0,
    };
  }

  private getDefaultInfrastructureAnalysis() {
    return {
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
      cicd: { workflows: [], provider: 'none' as const },
    };
  }

  private getDefaultCodeSmellAnalysis() {
    return {
      score: 100,
      totalSmells: 0,
      smells: [],
      categories: [],
      vendorReplacements: [],
    };
  }
}

export * from './types.js';
export { VendorAnalyzer } from './analyzers/vendor.js';
export { ApiAnalyzer } from './analyzers/api.js';
export { DatabaseAnalyzer } from './analyzers/database.js';
export { InfrastructureAnalyzer } from './analyzers/infrastructure.js';
export { CodeSmellAnalyzer } from './analyzers/codesmells.js';
