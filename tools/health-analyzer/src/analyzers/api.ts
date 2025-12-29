import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import type {
  Analyzer,
  AnalyzerConfig,
  ApiAnalysis,
  GraphQLAnalysis,
  GraphQLSchema,
  RestApiAnalysis,
  RestEndpoint,
  ApiServer,
  FederationAnalysis,
  Subgraph,
} from '../types.js';

const GRAPHQL_PATTERNS = ['**/*.graphql', '**/schema.graphql', '**/schema.gql'];

const REST_PATTERNS = [
  'app.get',
  'app.post',
  'app.put',
  'app.delete',
  'app.patch',
  'router.get',
  'router.post',
  'router.put',
  'router.delete',
  'router.patch',
  'hono.get',
  'hono.post',
  'hono.put',
  'hono.delete',
  'hono.patch',
  '@Get',
  '@Post',
  '@Put',
  '@Delete',
  '@Patch',
];

export class ApiAnalyzer implements Analyzer<ApiAnalysis> {
  name = 'ApiAnalyzer';

  async analyze(
    basePath: string,
    _config: AnalyzerConfig
  ): Promise<ApiAnalysis> {
    const [graphql, rest, federation] = await Promise.all([
      this.analyzeGraphQL(basePath),
      this.analyzeRest(basePath),
      this.analyzeFederation(basePath),
    ]);

    const totalEndpoints =
      graphql.queries +
      graphql.mutations +
      graphql.subscriptions +
      rest.endpoints.length;
    const score = this.calculateScore(graphql, rest, federation);

    return {
      score,
      graphql,
      rest,
      federation,
      totalEndpoints,
    };
  }

  private async analyzeGraphQL(basePath: string): Promise<GraphQLAnalysis> {
    const schemas: GraphQLSchema[] = [];
    let totalQueries = 0;
    let totalMutations = 0;
    let totalSubscriptions = 0;
    let totalTypes = 0;

    for (const pattern of GRAPHQL_PATTERNS) {
      const files = await glob(pattern, {
        cwd: basePath,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      });

      for (const file of files) {
        const fullPath = path.join(basePath, file);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const schema = this.parseGraphQLSchema(content, fullPath);
          schemas.push(schema);

          totalQueries += schema.queries.length;
          totalMutations += schema.mutations.length;
          totalSubscriptions += schema.subscriptions.length;
          totalTypes += schema.types.length;
        } catch {}
      }
    }

    return {
      schemas,
      queries: totalQueries,
      mutations: totalMutations,
      subscriptions: totalSubscriptions,
      types: totalTypes,
    };
  }

  private parseGraphQLSchema(content: string, filePath: string): GraphQLSchema {
    const queries: string[] = [];
    const mutations: string[] = [];
    const subscriptions: string[] = [];
    const types: string[] = [];

    const lines = content.split('\n');
    let currentBlock: 'query' | 'mutation' | 'subscription' | 'type' | null =
      null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('type Query')) {
        currentBlock = 'query';
      } else if (trimmed.startsWith('type Mutation')) {
        currentBlock = 'mutation';
      } else if (trimmed.startsWith('type Subscription')) {
        currentBlock = 'subscription';
      } else if (trimmed.startsWith('type ') && !trimmed.includes('{')) {
        const typeName = trimmed.split(' ')[1];
        if (
          typeName &&
          !['Query', 'Mutation', 'Subscription'].includes(typeName)
        ) {
          types.push(typeName);
        }
        currentBlock = 'type';
      } else if (trimmed === '}') {
        currentBlock = null;
      } else if (
        currentBlock &&
        trimmed.includes(':') &&
        !trimmed.startsWith('#')
      ) {
        const fieldName = trimmed.split(':')[0].split('(')[0].trim();
        if (fieldName && !fieldName.startsWith('_')) {
          if (currentBlock === 'query') queries.push(fieldName);
          else if (currentBlock === 'mutation') mutations.push(fieldName);
          else if (currentBlock === 'subscription')
            subscriptions.push(fieldName);
        }
      }
    }

    const typeMatches = content.match(/type\s+(\w+)\s*(?:@|{)/g) || [];
    for (const match of typeMatches) {
      const typeName = match.replace(/type\s+/, '').replace(/\s*(?:@|{)/, '');
      if (
        !['Query', 'Mutation', 'Subscription'].includes(typeName) &&
        !types.includes(typeName)
      ) {
        types.push(typeName);
      }
    }

    return { path: filePath, queries, mutations, subscriptions, types };
  }

  private async analyzeRest(basePath: string): Promise<RestApiAnalysis> {
    const endpoints: RestEndpoint[] = [];
    const servers: ApiServer[] = [];

    const jsFiles = await glob('**/*.{js,ts,jsx,tsx}', {
      cwd: basePath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts'],
    });

    for (const file of jsFiles) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const pattern of REST_PATTERNS) {
            if (line.includes(pattern)) {
              const endpoint = this.extractEndpoint(
                line,
                pattern,
                fullPath,
                i + 1
              );
              if (endpoint) endpoints.push(endpoint);
            }
          }

          const serverMatch = line.match(
            /\.listen\s*\(\s*(\d+|process\.env\.\w+)/
          );
          if (serverMatch) {
            const port = parseInt(serverMatch[1]) || 3000;
            const framework = this.detectFramework(content);
            servers.push({
              name: path.basename(file, path.extname(file)),
              port,
              framework,
              file: fullPath,
            });
          }
        }
      } catch {}
    }

    const documented = endpoints.filter((e) => e.documented).length;
    const undocumented = endpoints.length - documented;

    return { endpoints, servers, documented, undocumented };
  }

  private extractEndpoint(
    line: string,
    pattern: string,
    file: string,
    lineNum: number
  ): RestEndpoint | null {
    const methodMatch = pattern.match(
      /\.(get|post|put|delete|patch)|@(Get|Post|Put|Delete|Patch)/i
    );
    if (!methodMatch) return null;

    const method = (
      methodMatch[1] || methodMatch[2]
    ).toUpperCase() as RestEndpoint['method'];

    const pathMatch = line.match(/['"`]([^'"`]+)['"`]/);
    const endpointPath = pathMatch ? pathMatch[1] : '/unknown';

    const hasJsDoc =
      line.includes('/**') ||
      line.includes('@swagger') ||
      line.includes('@openapi');

    return {
      method,
      path: endpointPath,
      file,
      line: lineNum,
      documented: hasJsDoc,
    };
  }

  private detectFramework(content: string): string {
    if (content.includes("from 'hono'") || content.includes("require('hono')"))
      return 'hono';
    if (
      content.includes("from 'express'") ||
      content.includes("require('express')")
    )
      return 'express';
    if (
      content.includes("from 'fastify'") ||
      content.includes("require('fastify')")
    )
      return 'fastify';
    if (content.includes("from 'koa'") || content.includes("require('koa')"))
      return 'koa';
    if (content.includes('@nestjs')) return 'nestjs';
    return 'unknown';
  }

  private async analyzeFederation(
    basePath: string
  ): Promise<FederationAnalysis> {
    const subgraphs: Subgraph[] = [];
    let gateway: { port: number; file: string } | undefined;

    const federationFiles = await glob('**/federation/**/*.{js,ts,yaml,yml}', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    for (const file of federationFiles) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        if (content.includes('ApolloGateway') || content.includes('gateway')) {
          const portMatch = content.match(/port:\s*(\d+)|listen\s*\(\s*(\d+)/);
          gateway = {
            port: parseInt(portMatch?.[1] || portMatch?.[2] || '4000'),
            file: fullPath,
          };
        }

        const serviceMatches = content.matchAll(
          /name:\s*['"`](\w+)['"`].*?url:\s*['"`]([^'"`]+)['"`]/gs
        );
        for (const match of serviceMatches) {
          subgraphs.push({
            name: match[1],
            url: match[2],
          });
        }
      } catch {}
    }

    const configFiles = await glob('**/federation-config.{yaml,yml,json}', {
      cwd: basePath,
    });
    for (const file of configFiles) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const subgraphMatches = content.matchAll(
          /name:\s*(\w+)[\s\S]*?url:\s*([^\n]+)/g
        );
        for (const match of subgraphMatches) {
          if (!subgraphs.find((s) => s.name === match[1])) {
            subgraphs.push({ name: match[1], url: match[2].trim() });
          }
        }
      } catch {}
    }

    return {
      enabled: gateway !== undefined || subgraphs.length > 0,
      gateway,
      subgraphs,
    };
  }

  private calculateScore(
    graphql: GraphQLAnalysis,
    rest: RestApiAnalysis,
    federation: FederationAnalysis
  ): number {
    let score = 50;

    if (graphql.schemas.length > 0) score += 15;
    if (graphql.queries > 5) score += 10;
    if (graphql.mutations > 3) score += 5;

    if (rest.endpoints.length > 0) score += 10;
    if (rest.documented > rest.undocumented) score += 10;

    if (federation.enabled) score += 10;
    if (federation.subgraphs.length >= 3) score += 5;

    return Math.min(100, score);
  }
}
