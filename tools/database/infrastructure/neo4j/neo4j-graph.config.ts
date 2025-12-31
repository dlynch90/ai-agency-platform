/**
 * Neo4j Knowledge Graph Configuration
 * Production-ready graph database for relationships, recommendations, and knowledge graphs
 */

import neo4j, {
  Driver,
  Session,
  Record as Neo4jRecord,
  Integer,
  Node,
  Relationship,
  Path,
} from 'neo4j-driver';

// Neo4j configuration interface
export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionAcquisitionTimeoutMs?: number;
  connectionTimeoutMs?: number;
  maxTransactionRetryTimeMs?: number;
  encrypted?: boolean;
  trustStrategy?: 'TRUST_ALL_CERTIFICATES' | 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES';
}

// Production configuration
export const productionNeo4jConfig: Neo4jConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
  maxConnectionPoolSize: parseInt(process.env.NEO4J_POOL_SIZE || '100', 10),
  connectionAcquisitionTimeoutMs: 60000,
  connectionTimeoutMs: 30000,
  maxTransactionRetryTimeMs: 30000,
  encrypted: process.env.NEO4J_ENCRYPTED === 'true',
  trustStrategy: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
};

// Development configuration
export const developmentNeo4jConfig: Neo4jConfig = {
  ...productionNeo4jConfig,
  maxConnectionPoolSize: 20,
  encrypted: false,
};

// Node type definitions for knowledge graph
export interface KnowledgeNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface KnowledgeRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
}

// Query result types
export interface GraphQueryResult<T = any> {
  records: T[];
  summary: {
    counters: {
      nodesCreated: number;
      nodesDeleted: number;
      relationshipsCreated: number;
      relationshipsDeleted: number;
      propertiesSet: number;
    };
    queryTime: number;
  };
}

/**
 * Neo4j Graph Manager
 * Provides high-level graph operations for knowledge management
 */
export class Neo4jGraphManager {
  private driver: Driver | null = null;
  private config: Neo4jConfig;
  private isConnected: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Neo4jConfig = productionNeo4jConfig) {
    this.config = config;
  }

  /**
   * Initialize Neo4j connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    console.log('[Neo4j] Connecting to Neo4j...');

    this.driver = neo4j.driver(
      this.config.uri,
      neo4j.auth.basic(this.config.username, this.config.password),
      {
        maxConnectionPoolSize: this.config.maxConnectionPoolSize,
        connectionAcquisitionTimeout: this.config.connectionAcquisitionTimeoutMs,
        connectionTimeout: this.config.connectionTimeoutMs,
        maxTransactionRetryTime: this.config.maxTransactionRetryTimeMs,
        encrypted: this.config.encrypted,
        trust: this.config.trustStrategy,
        logging: {
          level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
          logger: (level: string, message: string) => console.log(`[Neo4j] [${level}] ${message}`),
        },
      }
    );

    // Verify connectivity
    await this.driver.verifyConnectivity();

    // Get server info
    const serverInfo = await this.getServerInfo();
    console.log('[Neo4j] Connected to:', serverInfo);

    this.startHealthCheck();
    this.isConnected = true;
  }

  /**
   * Get a session for database operations
   */
  getSession(mode: 'READ' | 'WRITE' = 'WRITE'): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not connected. Call connect() first.');
    }

    return this.driver.session({
      database: this.config.database,
      defaultAccessMode: mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE,
    });
  }

  /**
   * Execute a Cypher query
   */
  async query<T = any>(
    cypher: string,
    parameters: Record<string, any> = {},
    mode: 'READ' | 'WRITE' = 'WRITE'
  ): Promise<GraphQueryResult<T>> {
    const session = this.getSession(mode);
    const startTime = Date.now();

    try {
      const result = await session.run(cypher, parameters);

      return {
        records: result.records.map((record: Neo4jRecord) => this.transformRecord<T>(record)),
        summary: {
          counters: {
            nodesCreated: result.summary.counters.updates().nodesCreated,
            nodesDeleted: result.summary.counters.updates().nodesDeleted,
            relationshipsCreated: result.summary.counters.updates().relationshipsCreated,
            relationshipsDeleted: result.summary.counters.updates().relationshipsDeleted,
            propertiesSet: result.summary.counters.updates().propertiesSet,
          },
          queryTime: Date.now() - startTime,
        },
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Transform Neo4j record to plain object
   */
  private transformRecord<T>(record: Neo4jRecord): T {
    const obj: Record<string, any> = {};

    for (const key of record.keys) {
      const value = record.get(key);
      obj[String(key)] = this.transformValue(value);
    }

    return obj as T;
  }

  private transformValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle Integer
    if (Integer.isInteger(value)) {
      return value.toNumber();
    }

    // Handle Node
    if (value instanceof Node) {
      return {
        id: value.identity.toNumber(),
        labels: value.labels,
        properties: this.transformProperties(value.properties),
      };
    }

    // Handle Relationship
    if (value instanceof Relationship) {
      return {
        id: value.identity.toNumber(),
        type: value.type,
        startNodeId: value.start.toNumber(),
        endNodeId: value.end.toNumber(),
        properties: this.transformProperties(value.properties),
      };
    }

    // Handle Path
    if (value instanceof Path) {
      return {
        start: this.transformValue(value.start),
        end: this.transformValue(value.end),
        segments: value.segments.map((seg: any) => ({
          start: this.transformValue(seg.start),
          relationship: this.transformValue(seg.relationship),
          end: this.transformValue(seg.end),
        })),
      };
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((v) => this.transformValue(v));
    }

    // Handle plain objects
    if (typeof value === 'object') {
      return this.transformProperties(value);
    }

    return value;
  }

  private transformProperties(props: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(props)) {
      result[key] = this.transformValue(value);
    }
    return result;
  }

  // ===== Knowledge Graph Operations =====

  /**
   * Create a node with labels and properties
   */
  async createNode(
    labels: string | string[],
    properties: Record<string, any>
  ): Promise<KnowledgeNode> {
    const labelStr = Array.isArray(labels) ? labels.join(':') : labels;
    const result = await this.query<{ n: KnowledgeNode }>(
      `CREATE (n:${labelStr} $props) RETURN n`,
      { props: properties }
    );
    return result.records[0].n;
  }

  /**
   * Find nodes by label and optional properties
   */
  async findNodes(
    label: string,
    properties?: Record<string, any>,
    limit: number = 100
  ): Promise<KnowledgeNode[]> {
    let cypher = `MATCH (n:${label})`;

    if (properties && Object.keys(properties).length > 0) {
      const conditions = Object.keys(properties)
        .map((key) => `n.${key} = $props.${key}`)
        .join(' AND ');
      cypher += ` WHERE ${conditions}`;
    }

    cypher += ` RETURN n LIMIT ${limit}`;

    const result = await this.query<{ n: KnowledgeNode }>(cypher, { props: properties || {} }, 'READ');
    return result.records.map((r) => r.n);
  }

  /**
   * Find or create a node (MERGE operation)
   */
  async mergeNode(
    labels: string | string[],
    matchProperties: Record<string, any>,
    setProperties?: Record<string, any>
  ): Promise<KnowledgeNode> {
    const labelStr = Array.isArray(labels) ? labels.join(':') : labels;

    let cypher = `MERGE (n:${labelStr} {`;
    cypher += Object.keys(matchProperties)
      .map((key) => `${key}: $matchProps.${key}`)
      .join(', ');
    cypher += '})';

    if (setProperties) {
      cypher += ' ON CREATE SET n += $setProps ON MATCH SET n += $setProps';
    }

    cypher += ' RETURN n';

    const result = await this.query<{ n: KnowledgeNode }>(cypher, {
      matchProps: matchProperties,
      setProps: setProperties || {},
    });

    return result.records[0].n;
  }

  /**
   * Create a relationship between nodes
   */
  async createRelationship(
    startNodeId: number,
    endNodeId: number,
    type: string,
    properties?: Record<string, any>
  ): Promise<KnowledgeRelationship> {
    const cypher = `
      MATCH (a), (b)
      WHERE id(a) = $startId AND id(b) = $endId
      CREATE (a)-[r:${type} $props]->(b)
      RETURN r
    `;

    const result = await this.query<{ r: KnowledgeRelationship }>(cypher, {
      startId: neo4j.int(startNodeId),
      endId: neo4j.int(endNodeId),
      props: properties || {},
    });

    return result.records[0].r;
  }

  /**
   * Find relationships
   */
  async findRelationships(
    startLabel?: string,
    relationType?: string,
    endLabel?: string,
    limit: number = 100
  ): Promise<Array<{ start: KnowledgeNode; rel: KnowledgeRelationship; end: KnowledgeNode }>> {
    const startPattern = startLabel ? `:${startLabel}` : '';
    const relPattern = relationType ? `:${relationType}` : '';
    const endPattern = endLabel ? `:${endLabel}` : '';

    const cypher = `
      MATCH (a${startPattern})-[r${relPattern}]->(b${endPattern})
      RETURN a as start, r as rel, b as end
      LIMIT ${limit}
    `;

    const result = await this.query<{ start: KnowledgeNode; rel: KnowledgeRelationship; end: KnowledgeNode }>(
      cypher,
      {},
      'READ'
    );

    return result.records;
  }

  // ===== Graph Algorithms (using GDS) =====

  /**
   * Find shortest path between nodes
   */
  async shortestPath(
    startNodeId: number,
    endNodeId: number,
    relationshipType?: string
  ): Promise<Array<{ nodes: KnowledgeNode[]; relationships: KnowledgeRelationship[] }>> {
    const relPattern = relationshipType ? `:${relationshipType}*` : '*';

    const cypher = `
      MATCH (start), (end), path = shortestPath((start)-[${relPattern}]-(end))
      WHERE id(start) = $startId AND id(end) = $endId
      RETURN nodes(path) as nodes, relationships(path) as relationships
    `;

    const result = await this.query<{ nodes: KnowledgeNode[]; relationships: KnowledgeRelationship[] }>(
      cypher,
      {
        startId: neo4j.int(startNodeId),
        endId: neo4j.int(endNodeId),
      },
      'READ'
    );

    return result.records;
  }

  /**
   * Get node neighbors with depth
   */
  async getNeighbors(
    nodeId: number,
    depth: number = 2,
    relationshipTypes?: string[]
  ): Promise<KnowledgeNode[]> {
    const relPattern = relationshipTypes?.length
      ? `:${relationshipTypes.join('|')}`
      : '';

    const cypher = `
      MATCH (start)-[${relPattern}*1..${depth}]-(neighbor)
      WHERE id(start) = $nodeId
      RETURN DISTINCT neighbor
    `;

    const result = await this.query<{ neighbor: KnowledgeNode }>(
      cypher,
      { nodeId: neo4j.int(nodeId) },
      'READ'
    );

    return result.records.map((r) => r.neighbor);
  }

  /**
   * PageRank algorithm for node importance
   */
  async pageRank(
    label: string,
    relationshipType: string,
    topK: number = 10
  ): Promise<Array<{ node: KnowledgeNode; score: number }>> {
    // This requires Neo4j GDS plugin
    const cypher = `
      CALL gds.pageRank.stream({
        nodeProjection: '${label}',
        relationshipProjection: '${relationshipType}'
      })
      YIELD nodeId, score
      WITH gds.util.asNode(nodeId) AS node, score
      RETURN node, score
      ORDER BY score DESC
      LIMIT ${topK}
    `;

    try {
      const result = await this.query<{ node: KnowledgeNode; score: number }>(cypher, {}, 'READ');
      return result.records;
    } catch (error) {
      console.warn('[Neo4j] PageRank requires GDS plugin:', error);
      return [];
    }
  }

  /**
   * Community detection
   */
  async detectCommunities(
    label: string,
    relationshipType: string
  ): Promise<Array<{ node: KnowledgeNode; communityId: number }>> {
    // This requires Neo4j GDS plugin
    const cypher = `
      CALL gds.louvain.stream({
        nodeProjection: '${label}',
        relationshipProjection: '${relationshipType}'
      })
      YIELD nodeId, communityId
      WITH gds.util.asNode(nodeId) AS node, communityId
      RETURN node, communityId
    `;

    try {
      const result = await this.query<{ node: KnowledgeNode; communityId: number }>(cypher, {}, 'READ');
      return result.records;
    } catch (error) {
      console.warn('[Neo4j] Community detection requires GDS plugin:', error);
      return [];
    }
  }

  // ===== Recommendation Patterns =====

  /**
   * Collaborative filtering - users who bought X also bought Y
   */
  async collaborativeRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Array<{ product: KnowledgeNode; score: number }>> {
    const cypher = `
      MATCH (u:User {id: $userId})-[:PURCHASED]->(p:Product)<-[:PURCHASED]-(other:User)
      MATCH (other)-[:PURCHASED]->(rec:Product)
      WHERE NOT (u)-[:PURCHASED]->(rec)
      RETURN rec as product, count(DISTINCT other) as score
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    const result = await this.query<{ product: KnowledgeNode; score: number }>(
      cypher,
      { userId },
      'READ'
    );

    return result.records;
  }

  /**
   * Content-based recommendations using similarity
   */
  async contentBasedRecommendations(
    nodeId: number,
    label: string,
    limit: number = 10
  ): Promise<Array<{ node: KnowledgeNode; similarity: number }>> {
    const cypher = `
      MATCH (source:${label})-[:HAS_FEATURE]->(f:Feature)<-[:HAS_FEATURE]-(similar:${label})
      WHERE id(source) = $nodeId AND id(similar) <> $nodeId
      WITH similar, count(DISTINCT f) as commonFeatures
      MATCH (source:${label})-[:HAS_FEATURE]->(sf:Feature)
      WHERE id(source) = $nodeId
      WITH similar, commonFeatures, count(DISTINCT sf) as sourceFeatures
      MATCH (similar)-[:HAS_FEATURE]->(tf:Feature)
      WITH similar, commonFeatures, sourceFeatures, count(DISTINCT tf) as targetFeatures
      WITH similar,
           toFloat(commonFeatures) / sqrt(toFloat(sourceFeatures * targetFeatures)) as similarity
      RETURN similar as node, similarity
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    const result = await this.query<{ node: KnowledgeNode; similarity: number }>(
      cypher,
      { nodeId: neo4j.int(nodeId) },
      'READ'
    );

    return result.records;
  }

  // ===== Schema Management =====

  /**
   * Create constraints for data integrity
   */
  async createConstraints(): Promise<void> {
    const constraints = [
      // User constraints
      'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',

      // Product constraints
      'CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT product_sku IF NOT EXISTS FOR (p:Product) REQUIRE p.sku IS UNIQUE',

      // Category constraints
      'CREATE CONSTRAINT category_name IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE',

      // Document constraints
      'CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE',

      // Entity constraints for knowledge graph
      'CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE',
    ];

    for (const constraint of constraints) {
      try {
        await this.query(constraint);
        console.log('[Neo4j] Created constraint:', constraint.split('FOR')[0]);
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          console.warn('[Neo4j] Constraint warning:', error.message);
        }
      }
    }
  }

  /**
   * Create indexes for query performance
   */
  async createIndexes(): Promise<void> {
    const indexes = [
      // User indexes
      'CREATE INDEX user_created IF NOT EXISTS FOR (u:User) ON (u.createdAt)',
      'CREATE INDEX user_name IF NOT EXISTS FOR (u:User) ON (u.name)',

      // Product indexes
      'CREATE INDEX product_category IF NOT EXISTS FOR (p:Product) ON (p.category)',
      'CREATE INDEX product_price IF NOT EXISTS FOR (p:Product) ON (p.price)',
      'CREATE INDEX product_name IF NOT EXISTS FOR (p:Product) ON (p.name)',

      // Entity indexes for knowledge graph
      'CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type)',
      'CREATE INDEX entity_name IF NOT EXISTS FOR (e:Entity) ON (e.name)',

      // Full-text search indexes
      'CREATE FULLTEXT INDEX product_search IF NOT EXISTS FOR (p:Product) ON EACH [p.name, p.description]',
      'CREATE FULLTEXT INDEX entity_search IF NOT EXISTS FOR (e:Entity) ON EACH [e.name, e.description]',
    ];

    for (const index of indexes) {
      try {
        await this.query(index);
        console.log('[Neo4j] Created index:', index.split('FOR')[0]);
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          console.warn('[Neo4j] Index warning:', error.message);
        }
      }
    }
  }

  // ===== Health Check & Monitoring =====

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('[Neo4j] Health check failed:', error);
      }
    }, 30000);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latencyMs: number;
    nodeCount?: number;
    relationshipCount?: number;
  }> {
    const startTime = Date.now();

    try {
      const result = await this.query<{ nodes: number; rels: number }>(
        'MATCH (n) WITH count(n) as nodes MATCH ()-[r]->() RETURN nodes, count(r) as rels LIMIT 1',
        {},
        'READ'
      );

      return {
        status: 'healthy',
        latencyMs: Date.now() - startTime,
        nodeCount: result.records[0]?.nodes,
        relationshipCount: result.records[0]?.rels,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async getServerInfo(): Promise<Record<string, any>> {
    const session = this.getSession('READ');
    try {
      const result = await session.run('CALL dbms.components()');
      return result.records[0]?.toObject() || {};
    } finally {
      await session.close();
    }
  }

  async getDatabaseStats(): Promise<{
    nodeCount: number;
    relationshipCount: number;
    labelCounts: Record<string, number>;
    relationshipTypeCounts: Record<string, number>;
  }> {
    const [nodeResult, relResult, labelResult, relTypeResult] = await Promise.all([
      this.query<{ count: number }>('MATCH (n) RETURN count(n) as count', {}, 'READ'),
      this.query<{ count: number }>('MATCH ()-[r]->() RETURN count(r) as count', {}, 'READ'),
      this.query<{ label: string; count: number }>(
        'CALL db.labels() YIELD label CALL { WITH label MATCH (n) WHERE label IN labels(n) RETURN count(n) as count } RETURN label, count',
        {},
        'READ'
      ),
      this.query<{ type: string; count: number }>(
        'CALL db.relationshipTypes() YIELD relationshipType as type CALL { WITH type MATCH ()-[r]->() WHERE type(r) = type RETURN count(r) as count } RETURN type, count',
        {},
        'READ'
      ),
    ]);

    const labelCounts: Record<string, number> = {};
    for (const record of labelResult.records) {
      labelCounts[record.label] = record.count;
    }

    const relationshipTypeCounts: Record<string, number> = {};
    for (const record of relTypeResult.records) {
      relationshipTypeCounts[record.type] = record.count;
    }

    return {
      nodeCount: nodeResult.records[0]?.count || 0,
      relationshipCount: relResult.records[0]?.count || 0,
      labelCounts,
      relationshipTypeCounts,
    };
  }

  // ===== Cleanup =====

  async disconnect(): Promise<void> {
    console.log('[Neo4j] Disconnecting...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }

    this.isConnected = false;
    console.log('[Neo4j] Disconnected');
  }
}

// Export singleton instance
export const neo4jGraph = new Neo4jGraphManager(
  process.env.NODE_ENV === 'production' ? productionNeo4jConfig : developmentNeo4jConfig
);

export default neo4jGraph;
