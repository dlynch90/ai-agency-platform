import { createSchema, createYoga } from 'graphql-yoga';
import { CodebaseHealthAnalyzer } from '../index.js';

const analyzer = new CodebaseHealthAnalyzer();
const DEFAULT_PATH = process.env.ANALYZE_PATH || process.cwd();

const typeDefs = `
  type Query {
    health: HealthStatus!
    analyze(path: String): HealthReport!
    score(path: String): HealthScore!
    vendors(path: String): VendorAnalysis!
    apis(path: String): ApiAnalysis!
    databases(path: String): DatabaseAnalysis!
    infrastructure(path: String): InfrastructureAnalysis!
    codeSmells(path: String): CodeSmellAnalysis!
    recommendations(path: String, priority: String): [Recommendation!]!
  }

  type HealthStatus {
    status: String!
    service: String!
    version: String!
  }

  type HealthReport {
    timestamp: String!
    version: String!
    score: HealthScore!
    vendors: VendorAnalysis!
    apis: ApiAnalysis!
    databases: DatabaseAnalysis!
    infrastructure: InfrastructureAnalysis!
    codeSmells: CodeSmellAnalysis!
    recommendations: [Recommendation!]!
    metadata: ReportMetadata!
  }

  type HealthScore {
    overall: Int!
    grade: String!
    breakdown: ScoreBreakdown!
  }

  type ScoreBreakdown {
    vendorAdoption: Int!
    apiCoverage: Int!
    databaseHealth: Int!
    infrastructureMaturity: Int!
    codeQuality: Int!
  }

  type VendorAnalysis {
    score: Int!
    adoptionRate: Int!
    templates: [VendorTemplate!]!
    tools: [VendorTool!]!
    missingVendors: [String!]!
  }

  type VendorTemplate {
    name: String!
    path: String!
    vendor: String!
    category: String!
    status: String!
  }

  type VendorTool {
    name: String!
    command: String!
    vendor: String!
    category: String!
    installed: Boolean!
    version: String
  }

  type ApiAnalysis {
    score: Int!
    totalEndpoints: Int!
    graphql: GraphQLAnalysis!
    rest: RestApiAnalysis!
    federation: FederationAnalysis!
  }

  type GraphQLAnalysis {
    schemas: [GraphQLSchema!]!
    queries: Int!
    mutations: Int!
    subscriptions: Int!
    types: Int!
  }

  type GraphQLSchema {
    path: String!
    queries: [String!]!
    mutations: [String!]!
  }

  type RestApiAnalysis {
    endpoints: [RestEndpoint!]!
    documented: Int!
    undocumented: Int!
  }

  type RestEndpoint {
    method: String!
    path: String!
    file: String!
    documented: Boolean!
  }

  type FederationAnalysis {
    enabled: Boolean!
    subgraphs: [Subgraph!]!
  }

  type Subgraph {
    name: String!
    url: String!
  }

  type DatabaseAnalysis {
    score: Int!
    totalModels: Int!
    prisma: PrismaAnalysis!
    connections: [DatabaseConnection!]!
    migrations: MigrationStatus!
  }

  type PrismaAnalysis {
    schemas: [PrismaSchema!]!
    totalModels: Int!
    totalEnums: Int!
    totalRelations: Int!
  }

  type PrismaSchema {
    path: String!
    provider: String!
    models: [String!]!
  }

  type DatabaseConnection {
    name: String!
    type: String!
    configured: Boolean!
    envVar: String!
  }

  type MigrationStatus {
    pending: Int!
    applied: Int!
    lastApplied: String
  }

  type InfrastructureAnalysis {
    score: Int!
    docker: DockerAnalysis!
    kubernetes: KubernetesAnalysis!
    monitoring: MonitoringAnalysis!
    cicd: CiCdAnalysis!
  }

  type DockerAnalysis {
    composeFiles: [DockerComposeFile!]!
    services: [DockerService!]!
  }

  type DockerComposeFile {
    path: String!
    environment: String!
    services: [String!]!
  }

  type DockerService {
    name: String!
    image: String!
    ports: [String!]!
  }

  type KubernetesAnalysis {
    helmCharts: [HelmChart!]!
    namespaces: [String!]!
  }

  type HelmChart {
    name: String!
    path: String!
    version: String!
  }

  type MonitoringAnalysis {
    prometheus: Boolean!
    grafana: Boolean!
    sentry: Boolean!
    datadog: Boolean!
    healthChecks: [HealthCheck!]!
  }

  type HealthCheck {
    path: String!
    type: String!
    endpoint: String!
  }

  type CiCdAnalysis {
    provider: String!
    workflows: [CiCdWorkflow!]!
  }

  type CiCdWorkflow {
    name: String!
    path: String!
    triggers: [String!]!
    jobs: [String!]!
  }

  type CodeSmellAnalysis {
    score: Int!
    totalSmells: Int!
    smells: [CodeSmell!]!
    categories: [CodeSmellCategory!]!
    vendorReplacements: [VendorReplacement!]!
  }

  type CodeSmell {
    type: String!
    severity: String!
    file: String!
    line: Int
    description: String!
    vendorAlternative: String
    effort: String!
  }

  type CodeSmellCategory {
    type: String!
    count: Int!
    severity: String!
    description: String!
  }

  type VendorReplacement {
    currentCode: String!
    file: String!
    vendorSolution: String!
    package: String!
    effort: String!
    priority: String!
  }

  type Recommendation {
    id: String!
    category: String!
    priority: String!
    title: String!
    description: String!
    impact: String!
    effort: String!
    actions: [String!]!
  }

  type ReportMetadata {
    analyzedAt: String!
    duration: Int!
    filesScanned: Int!
    errorsEncountered: [String!]!
  }
`;

const resolvers = {
  Query: {
    health: () => ({
      status: 'ok',
      service: 'codebase-health-analyzer',
      version: '1.0.0',
    }),

    analyze: async (_: unknown, { path }: { path?: string }) => {
      return analyzer.analyze(path || DEFAULT_PATH);
    },

    score: async (_: unknown, { path }: { path?: string }) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH);
      return report.score;
    },

    vendors: async (_: unknown, { path }: { path?: string }) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH, {
        includeVendorTemplates: true,
        includeApiAnalysis: false,
        includeDatabaseAnalysis: false,
        includeInfrastructureAnalysis: false,
        includeCodeSmellDetection: false,
      });
      return report.vendors;
    },

    apis: async (_: unknown, { path }: { path?: string }) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH, {
        includeVendorTemplates: false,
        includeApiAnalysis: true,
        includeDatabaseAnalysis: false,
        includeInfrastructureAnalysis: false,
        includeCodeSmellDetection: false,
      });
      return report.apis;
    },

    databases: async (_: unknown, { path }: { path?: string }) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH, {
        includeVendorTemplates: false,
        includeApiAnalysis: false,
        includeDatabaseAnalysis: true,
        includeInfrastructureAnalysis: false,
        includeCodeSmellDetection: false,
      });
      return report.databases;
    },

    infrastructure: async (_: unknown, { path }: { path?: string }) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH, {
        includeVendorTemplates: false,
        includeApiAnalysis: false,
        includeDatabaseAnalysis: false,
        includeInfrastructureAnalysis: true,
        includeCodeSmellDetection: false,
      });
      return report.infrastructure;
    },

    codeSmells: async (_: unknown, { path }: { path?: string }) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH, {
        includeVendorTemplates: false,
        includeApiAnalysis: false,
        includeDatabaseAnalysis: false,
        includeInfrastructureAnalysis: false,
        includeCodeSmellDetection: true,
      });
      return report.codeSmells;
    },

    recommendations: async (
      _: unknown,
      { path, priority }: { path?: string; priority?: string }
    ) => {
      const report = await analyzer.analyze(path || DEFAULT_PATH);
      if (priority) {
        return report.recommendations.filter((r) => r.priority === priority);
      }
      return report.recommendations;
    },
  },
};

export const schema = createSchema({ typeDefs, resolvers });

export const yoga = createYoga({ schema });
