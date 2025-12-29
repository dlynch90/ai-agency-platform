/**
 * Codebase Health Analyzer - Type Definitions
 * Comprehensive types for vendor adoption, API discovery, and code health analysis
 */

import { z } from 'zod';

// ============================================================================
// CORE HEALTH METRICS
// ============================================================================

export interface HealthScore {
  overall: number; // 0-100
  breakdown: {
    vendorAdoption: number;
    apiCoverage: number;
    databaseHealth: number;
    infrastructureMaturity: number;
    codeQuality: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface HealthReport {
  timestamp: string;
  version: string;
  score: HealthScore;
  vendors: VendorAnalysis;
  apis: ApiAnalysis;
  databases: DatabaseAnalysis;
  infrastructure: InfrastructureAnalysis;
  codeSmells: CodeSmellAnalysis;
  recommendations: Recommendation[];
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  analyzedAt: string;
  duration: number; // milliseconds
  filesScanned: number;
  errorsEncountered: string[];
}

// ============================================================================
// VENDOR ANALYSIS
// ============================================================================

export interface VendorAnalysis {
  score: number;
  templates: VendorTemplate[];
  tools: VendorTool[];
  configurations: VendorConfig[];
  adoptionRate: number;
  missingVendors: string[];
}

export interface VendorTemplate {
  name: string;
  path: string;
  vendor: string;
  category:
    | 'ai-ml'
    | 'web-framework'
    | 'workflow'
    | 'database'
    | 'infrastructure';
  status: 'installed' | 'configured' | 'available';
  version?: string;
}

export interface VendorTool {
  name: string;
  command: string;
  vendor: string;
  category: string;
  installed: boolean;
  version?: string;
  configPath?: string;
}

export interface VendorConfig {
  path: string;
  vendor: string;
  type: 'json' | 'yaml' | 'toml' | 'env';
  valid: boolean;
  issues: string[];
}

// ============================================================================
// API ANALYSIS
// ============================================================================

export interface ApiAnalysis {
  score: number;
  graphql: GraphQLAnalysis;
  rest: RestApiAnalysis;
  federation: FederationAnalysis;
  totalEndpoints: number;
}

export interface GraphQLAnalysis {
  schemas: GraphQLSchema[];
  queries: number;
  mutations: number;
  subscriptions: number;
  types: number;
}

export interface GraphQLSchema {
  path: string;
  queries: string[];
  mutations: string[];
  subscriptions: string[];
  types: string[];
}

export interface RestApiAnalysis {
  endpoints: RestEndpoint[];
  servers: ApiServer[];
  documented: number;
  undocumented: number;
}

export interface RestEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  file: string;
  line: number;
  documented: boolean;
}

export interface ApiServer {
  name: string;
  port: number;
  framework: string;
  file: string;
}

export interface FederationAnalysis {
  enabled: boolean;
  gateway?: {
    port: number;
    file: string;
  };
  subgraphs: Subgraph[];
}

export interface Subgraph {
  name: string;
  url: string;
  schema?: string;
}

// ============================================================================
// DATABASE ANALYSIS
// ============================================================================

export interface DatabaseAnalysis {
  score: number;
  prisma: PrismaAnalysis;
  connections: DatabaseConnection[];
  migrations: MigrationStatus;
  totalModels: number;
}

export interface PrismaAnalysis {
  schemas: PrismaSchema[];
  totalModels: number;
  totalEnums: number;
  totalRelations: number;
}

export interface PrismaSchema {
  path: string;
  provider: string;
  models: string[];
  enums: string[];
  relations: number;
}

export interface DatabaseConnection {
  name: string;
  type:
    | 'postgresql'
    | 'neo4j'
    | 'redis'
    | 'qdrant'
    | 'elasticsearch'
    | 'mongodb';
  configured: boolean;
  envVar: string;
  host?: string;
  port?: number;
}

export interface MigrationStatus {
  pending: number;
  applied: number;
  lastApplied?: string;
}

// ============================================================================
// INFRASTRUCTURE ANALYSIS
// ============================================================================

export interface InfrastructureAnalysis {
  score: number;
  docker: DockerAnalysis;
  kubernetes: KubernetesAnalysis;
  monitoring: MonitoringAnalysis;
  cicd: CiCdAnalysis;
}

export interface DockerAnalysis {
  composeFiles: DockerComposeFile[];
  dockerfiles: Dockerfile[];
  services: DockerService[];
  networks: string[];
  volumes: string[];
}

export interface DockerComposeFile {
  path: string;
  environment: 'development' | 'production' | 'staging' | 'services';
  services: string[];
}

export interface Dockerfile {
  path: string;
  baseImage: string;
  stages: number;
}

export interface DockerService {
  name: string;
  image: string;
  ports: string[];
  composeFile: string;
}

export interface KubernetesAnalysis {
  helmCharts: HelmChart[];
  manifests: K8sManifest[];
  namespaces: string[];
}

export interface HelmChart {
  name: string;
  path: string;
  version: string;
  dependencies: string[];
}

export interface K8sManifest {
  path: string;
  kind: string;
  name: string;
}

export interface MonitoringAnalysis {
  prometheus: boolean;
  grafana: boolean;
  sentry: boolean;
  datadog: boolean;
  healthChecks: HealthCheck[];
  metricsEndpoints: string[];
}

export interface HealthCheck {
  path: string;
  type: 'liveness' | 'readiness' | 'startup';
  endpoint: string;
}

export interface CiCdAnalysis {
  workflows: CiCdWorkflow[];
  provider: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci' | 'none';
}

export interface CiCdWorkflow {
  name: string;
  path: string;
  triggers: string[];
  jobs: string[];
}

// ============================================================================
// CODE SMELL ANALYSIS
// ============================================================================

export interface CodeSmellAnalysis {
  score: number;
  totalSmells: number;
  smells: CodeSmell[];
  categories: CodeSmellCategory[];
  vendorReplacements: VendorReplacement[];
}

export interface CodeSmell {
  type: CodeSmellType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  vendorAlternative?: string;
  effort: string; // e.g., "2 hours", "1 sprint"
}

export type CodeSmellType =
  | 'custom-auth'
  | 'custom-http'
  | 'custom-logging'
  | 'custom-caching'
  | 'custom-validation'
  | 'custom-state-management'
  | 'vendor-wrapper'
  | 'console-log'
  | 'hardcoded-path'
  | 'hardcoded-secret';

export interface CodeSmellCategory {
  type: CodeSmellType;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface VendorReplacement {
  currentCode: string;
  file: string;
  vendorSolution: string;
  package: string;
  effort: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export interface Recommendation {
  id: string;
  category: 'vendor' | 'api' | 'database' | 'infrastructure' | 'code-quality';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
  actions: string[];
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const HealthScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  breakdown: z.object({
    vendorAdoption: z.number().min(0).max(100),
    apiCoverage: z.number().min(0).max(100),
    databaseHealth: z.number().min(0).max(100),
    infrastructureMaturity: z.number().min(0).max(100),
    codeQuality: z.number().min(0).max(100),
  }),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']),
});

export const ConfigSchema = z.object({
  basePath: z.string(),
  excludePaths: z
    .array(z.string())
    .default(['node_modules', '.git', 'dist', 'build']),
  includeVendorTemplates: z.boolean().default(true),
  includeApiAnalysis: z.boolean().default(true),
  includeDatabaseAnalysis: z.boolean().default(true),
  includeInfrastructureAnalysis: z.boolean().default(true),
  includeCodeSmellDetection: z.boolean().default(true),
  outputFormat: z.enum(['json', 'markdown', 'html']).default('json'),
});

export type AnalyzerConfig = z.infer<typeof ConfigSchema>;

// ============================================================================
// ANALYZER INTERFACE
// ============================================================================

export interface Analyzer<T> {
  name: string;
  analyze(basePath: string, config: AnalyzerConfig): Promise<T>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface FileMatch {
  path: string;
  content: string;
  lines: string[];
}

export interface PatternMatch {
  pattern: string;
  file: string;
  line: number;
  match: string;
  context: string;
}
