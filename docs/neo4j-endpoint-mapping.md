# Neo4j Endpoint Mapping & CRUD Operations

## Overview
Neo4j serves as the central knowledge graph database connecting all services in the AI Agency Platform ecosystem.

## Connection Endpoints

### Primary Neo4j Endpoints
- **Bolt Protocol**: `bolt://localhost:7687` (binary protocol for drivers)
- **HTTP API**: `http://localhost:7474` (REST API for browser/tools)
- **HTTPS**: `https://localhost:7473` (secure connections)

### Associated Service Endpoints

#### Redis Integration
- **Redis Endpoint**: `redis://localhost:6379`
- **Neo4j↔Redis Pattern**: Cache warming, session storage, ML model metadata
- **CRUD Operations**:
  - `CREATE (r:RedisCache {key: $key, value: $value})`
  - `MATCH (r:RedisCache {key: $key}) RETURN r.value`
  - `MATCH (r:RedisCache {key: $key}) SET r.value = $newValue`
  - `MATCH (r:RedisCache {key: $key}) DELETE r`

#### PostgreSQL Integration
- **PostgreSQL Endpoint**: `postgresql://localhost:5432`
- **Neo4j↔PostgreSQL Pattern**: Relational data enrichment, user profiles
- **CRUD Operations**:
  - `CREATE (u:User {id: $id, postgres_id: $pg_id})`
  - `MATCH (u:User)-[:STORED_IN]->(pg:PostgresTable)`
  - `MATCH (u:User {postgres_id: $pg_id}) SET u.last_login = $timestamp`

#### Qdrant Integration
- **Qdrant REST**: `http://localhost:6333`
- **Qdrant gRPC**: `localhost:6334`
- **Neo4j↔Qdrant Pattern**: Vector embeddings, semantic search
- **CRUD Operations**:
  - `CREATE (v:Vector {id: $id, qdrant_id: $qdrant_id, embedding: $vector})`
  - `MATCH (v:Vector)-[:EMBEDDED_BY]->(m:MLModel)`
  - `CALL db.create.setVectorProperty(v, 'embedding', $vector)`

#### Ollama Integration
- **Ollama API**: `http://localhost:11434`
- **Neo4j↔Ollama Pattern**: Model metadata, inference tracking
- **CRUD Operations**:
  - `CREATE (m:Model {name: $name, ollama_tag: $tag, type: 'LLM'})`
  - `MATCH (m:Model)-[:USED_FOR]->(t:Task)`
  - `MATCH (m:Model {ollama_tag: $tag}) SET m.last_used = $timestamp`

#### Elasticsearch Integration
- **Elasticsearch API**: `http://localhost:9200`
- **Neo4j↔Elasticsearch Pattern**: Full-text search, document indexing
- **CRUD Operations**:
  - `CREATE (d:Document {id: $id, es_index: $index, es_id: $es_id})`
  - `MATCH (d:Document)-[:INDEXED_IN]->(es:ElasticsearchIndex)`

#### MinIO Integration
- **MinIO API**: `http://localhost:9000`
- **MinIO Console**: `http://localhost:9001`
- **Neo4j↔MinIO Pattern**: File storage, model artifacts
- **CRUD Operations**:
  - `CREATE (f:File {path: $path, minio_bucket: $bucket, minio_key: $key})`
  - `MATCH (f:File)-[:STORED_IN]->(m:MinIOBucket)`

## Golden Path Mappings

### User Journey Flow
```
User Request → Redis Cache → Neo4j Graph → Vector Search → LLM Inference → Response
    ↓            ↓            ↓           ↓              ↓             ↓
  Session     Cache Hit    Knowledge    Semantic     Model Call    Formatted
  Tracking    /Miss        Query        Match        Inference      Output
```

### Data Pipeline Flow
```
Raw Data → PostgreSQL → Neo4j Graph → Qdrant Vectors → ML Training → Model Storage
    ↓          ↓            ↓             ↓               ↓             ↓
  Ingest    Structure    Relations    Embeddings    Training     MinIO
  Scripts   Tables       Entities      Index         Pipeline     Bucket
```

### Search & Discovery Flow
```
Query → Elasticsearch → Neo4j Graph → Qdrant Vectors → Ranked Results → Response
  ↓         ↓              ↓             ↓               ↓             ↓
Text     Full-text      Graph         Semantic       Score         JSON
Search   Results        Traversal     Similarity     Sort          Format
```

## CRUD Operation Patterns

### Create Operations
```cypher
// Create user with all service connections
CREATE (u:User {
  id: $user_id,
  email: $email,
  created_at: datetime()
})-[:USES_CACHE]->(r:RedisSession {
  session_id: $session_id,
  expires_at: datetime() + duration('PT1H')
})-[:STORED_IN]->(pg:PostgresTable {
  table: 'user_sessions',
  primary_key: $session_id
})
```

### Read Operations
```cypher
// Find user with all connected services
MATCH (u:User {id: $user_id})
OPTIONAL MATCH (u)-[:USES_CACHE]->(r:RedisSession)
OPTIONAL MATCH (u)-[:HAS_PROFILE]->(p:PostgresProfile)
OPTIONAL MATCH (u)-[:HAS_VECTORS]->(v:QdrantCollection)
RETURN u, r, p, v
```

### Update Operations
```cypher
// Update user across all services
MATCH (u:User {id: $user_id})
SET u.last_login = datetime(),
    u.login_count = u.login_count + 1
WITH u
MATCH (u)-[:USES_CACHE]->(r:RedisSession)
SET r.last_activity = datetime()
WITH u
MATCH (u)-[:HAS_PROFILE]->(p:PostgresProfile)
SET p.last_login = datetime()
```

### Delete Operations
```cypher
// Cascade delete user from all services
MATCH (u:User {id: $user_id})
OPTIONAL MATCH (u)-[:USES_CACHE]->(r:RedisSession)
OPTIONAL MATCH (u)-[:HAS_PROFILE]->(p:PostgresProfile)
OPTIONAL MATCH (u)-[:HAS_VECTORS]->(v:QdrantCollection)
DETACH DELETE u, r, p, v
```

## Service Interconnection Matrix

| Service | Neo4j Relationship | CRUD Pattern | Data Flow |
|---------|-------------------|--------------|-----------|
| Redis | `:USES_CACHE` | Session management | User sessions, cache metadata |
| PostgreSQL | `:STORED_IN` | Relational data | User profiles, structured data |
| Qdrant | `:HAS_VECTORS` | Vector operations | Embeddings, semantic search |
| Ollama | `:USES_MODEL` | Inference tracking | Model usage, performance |
| Elasticsearch | `:INDEXED_IN` | Search indexing | Full-text search, documents |
| MinIO | `:STORES_IN` | File management | Model artifacts, datasets |
| JupyterHub | `:ACCESSES_VIA` | Development | Notebooks, experiments |
| pgAdmin | `:MANAGES_VIA` | Database admin | Schema management |

## Monitoring & Health Checks

### Endpoint Health Queries
```cypher
// Check all service connections
MATCH (s:Service)
WHERE s.status = 'active'
RETURN s.name, s.endpoint, s.last_health_check
ORDER BY s.last_health_check DESC
```

### Performance Metrics
```cypher
// Query performance across services
MATCH (q:Query)-[:TOUCHES]->(s:Service)
RETURN s.name, avg(q.duration_ms) as avg_duration,
       max(q.duration_ms) as max_duration,
       count(q) as query_count
ORDER BY avg_duration DESC
```

This comprehensive mapping ensures Neo4j serves as the central orchestration point for all services in the AI Agency Platform ecosystem.