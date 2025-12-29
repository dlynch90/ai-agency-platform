import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import type {
  Analyzer,
  AnalyzerConfig,
  DatabaseAnalysis,
  PrismaAnalysis,
  PrismaSchema,
  DatabaseConnection,
  MigrationStatus,
} from '../types.js';

const DATABASE_ENV_VARS: Record<string, DatabaseConnection['type']> = {
  DATABASE_URL: 'postgresql',
  POSTGRES_URL: 'postgresql',
  NEO4J_URI: 'neo4j',
  NEO4J_URL: 'neo4j',
  REDIS_URL: 'redis',
  REDIS_HOST: 'redis',
  QDRANT_URL: 'qdrant',
  QDRANT_HOST: 'qdrant',
  ELASTICSEARCH_URL: 'elasticsearch',
  MONGODB_URI: 'mongodb',
};

export class DatabaseAnalyzer implements Analyzer<DatabaseAnalysis> {
  name = 'DatabaseAnalyzer';

  async analyze(
    basePath: string,
    _config: AnalyzerConfig
  ): Promise<DatabaseAnalysis> {
    const [prisma, connections, migrations] = await Promise.all([
      this.analyzePrisma(basePath),
      this.analyzeConnections(basePath),
      this.analyzeMigrations(basePath),
    ]);

    const totalModels = prisma.totalModels;
    const score = this.calculateScore(prisma, connections, migrations);

    return {
      score,
      prisma,
      connections,
      migrations,
      totalModels,
    };
  }

  private async analyzePrisma(basePath: string): Promise<PrismaAnalysis> {
    const schemas: PrismaSchema[] = [];
    let totalModels = 0;
    let totalEnums = 0;
    let totalRelations = 0;

    const prismaFiles = await glob('**/prisma/schema.prisma', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    for (const file of prismaFiles) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const schema = this.parsePrismaSchema(content, fullPath);
        schemas.push(schema);

        totalModels += schema.models.length;
        totalEnums += schema.enums.length;
        totalRelations += schema.relations;
      } catch {}
    }

    return { schemas, totalModels, totalEnums, totalRelations };
  }

  private parsePrismaSchema(content: string, filePath: string): PrismaSchema {
    const models: string[] = [];
    const enums: string[] = [];
    let relations = 0;
    let provider = 'postgresql';

    const providerMatch = content.match(/provider\s*=\s*"(\w+)"/);
    if (providerMatch) provider = providerMatch[1];

    const modelMatches = content.matchAll(/model\s+(\w+)\s*{/g);
    for (const match of modelMatches) {
      models.push(match[1]);
    }

    const enumMatches = content.matchAll(/enum\s+(\w+)\s*{/g);
    for (const match of enumMatches) {
      enums.push(match[1]);
    }

    const relationMatches = content.match(/@relation\s*\(/g);
    relations = relationMatches?.length || 0;

    return { path: filePath, provider, models, enums, relations };
  }

  private async analyzeConnections(
    basePath: string
  ): Promise<DatabaseConnection[]> {
    const connections: DatabaseConnection[] = [];
    const seen = new Set<string>();

    const envFiles = await glob('**/.env*', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    const configFiles = await glob('**/config*.{ts,js,json}', {
      cwd: basePath,
      ignore: ['**/node_modules/**', '**/dist/**'],
    });

    for (const file of [...envFiles, ...configFiles]) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        for (const [envVar, dbType] of Object.entries(DATABASE_ENV_VARS)) {
          if (content.includes(envVar) && !seen.has(envVar)) {
            seen.add(envVar);

            const valueMatch = content.match(
              new RegExp(`${envVar}\\s*[=:]\\s*['"\`]?([^'"\`\\n]+)`)
            );
            let host: string | undefined;
            let port: number | undefined;

            if (valueMatch) {
              const urlMatch = valueMatch[1].match(/:\/\/([^:@/]+)(?::(\d+))?/);
              if (urlMatch) {
                host = urlMatch[1];
                port = urlMatch[2] ? parseInt(urlMatch[2]) : undefined;
              }
            }

            connections.push({
              name: this.getDbName(dbType),
              type: dbType,
              configured: valueMatch !== null,
              envVar,
              host,
              port,
            });
          }
        }
      } catch {}
    }

    if (connections.length === 0) {
      for (const [envVar, dbType] of Object.entries(DATABASE_ENV_VARS)) {
        if (process.env[envVar]) {
          connections.push({
            name: this.getDbName(dbType),
            type: dbType,
            configured: true,
            envVar,
          });
        }
      }
    }

    return connections;
  }

  private getDbName(type: DatabaseConnection['type']): string {
    const names: Record<DatabaseConnection['type'], string> = {
      postgresql: 'PostgreSQL',
      neo4j: 'Neo4j',
      redis: 'Redis',
      qdrant: 'Qdrant',
      elasticsearch: 'Elasticsearch',
      mongodb: 'MongoDB',
    };
    return names[type];
  }

  private async analyzeMigrations(basePath: string): Promise<MigrationStatus> {
    let pending = 0;
    let applied = 0;
    let lastApplied: string | undefined;

    const migrationDirs = await glob('**/prisma/migrations/*/', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    for (const dir of migrationDirs) {
      const migrationName = path.basename(dir);
      if (migrationName.match(/^\d{14}_/)) {
        applied++;
        lastApplied = migrationName;
      }
    }

    const pendingMigrations = await glob('**/prisma/migrations/*_pending*/', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });
    pending = pendingMigrations.length;

    return { pending, applied, lastApplied };
  }

  private calculateScore(
    prisma: PrismaAnalysis,
    connections: DatabaseConnection[],
    migrations: MigrationStatus
  ): number {
    let score = 50;

    if (prisma.schemas.length > 0) score += 15;
    if (prisma.totalModels > 5) score += 10;
    if (prisma.totalModels > 15) score += 5;
    if (prisma.totalRelations > 3) score += 5;

    const configuredConnections = connections.filter(
      (c) => c.configured
    ).length;
    score += Math.min(15, configuredConnections * 5);

    if (migrations.applied > 0) score += 5;
    if (migrations.pending === 0) score += 5;

    return Math.min(100, score);
  }
}
