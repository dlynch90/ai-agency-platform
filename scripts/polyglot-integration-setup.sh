#!/bin/bash
# Polyglot Integration Setup for AI Agency Development
# Sets up network proxy, API smoke tests, GraphQL federation, and cross-language communication

set -e

echo "=== POLYGLOT INTEGRATION SETUP ==="
echo "Setting up network proxy, API smoke tests, and GraphQL federation"
echo

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# 1. NETWORK PROXY SETUP
setup_network_proxy() {
    log "Setting up network proxy infrastructure..."

    # Install proxy tools
    brew install nginx
    brew install caddy
    brew install traefik
    npm install -g http-proxy-middleware
    npm install -g express-http-proxy

    # Create proxy configuration
    mkdir -p ~/Developer/proxy/{configs,logs,certs}

    # Nginx configuration for API gateway
    cat > ~/Developer/proxy/configs/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        server localhost:3000;
        server localhost:8000;
        server localhost:4000;
    }

    upstream graphql_backend {
        server localhost:4000;
    }

    upstream database_backend {
        server localhost:5432;
        server localhost:7474;
    }

    server {
        listen 8080;
        server_name api.localhost;

        location /api/ {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /graphql {
            proxy_pass http://graphql_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    server {
        listen 8443 ssl;
        server_name secure-api.localhost;

        ssl_certificate ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/proxy/certs/localhost.crt;
        ssl_certificate_key ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/proxy/certs/localhost.key;

        location / {
            proxy_pass http://api_backend;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
EOF

    # Caddy configuration for modern reverse proxy
    cat > ~/Developer/proxy/configs/Caddyfile << 'EOF'
api.localhost {
    reverse_proxy localhost:3000 localhost:8000 localhost:4000 {
        lb_policy round_robin
    }
}

graphql.localhost {
    reverse_proxy localhost:4000
}

db.localhost {
    reverse_proxy localhost:5432 localhost:7474
}

# Auto HTTPS for production domains
*.ai-agency.app {
    tls {
        protocols tls1.2 tls1.3
    }
    reverse_proxy localhost:3000
}
EOF

    log "Network proxy setup completed"
}

# 2. GRAPHQL FEDERATION SETUP
setup_graphql_federation() {
    log "Setting up GraphQL federation infrastructure..."

    # Install Apollo Federation tools
    npm install -g @apollo/federation
    npm install -g @apollo/gateway
    npm install -g @apollo/rover

    # Create federated schema structure
    mkdir -p ~/Developer/graphql/{gateway,subgraphs/{users,posts,analytics},supergraph}

    # User subgraph
    cat > ~/Developer/graphql/subgraphs/users/package.json << 'EOF'
{
  "name": "users-subgraph",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@apollo/subgraph": "^2.5.5",
    "apollo-server": "^4.9.5",
    "graphql": "^16.8.1"
  }
}
EOF

    cat > ~/Developer/graphql/subgraphs/users/index.js << 'EOF'
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');

const typeDefs = gql`
  type User @key(fields: "id") {
    id: ID!
    username: String!
    email: String!
    posts: [Post]
  }

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    author: User
  }

  type Query {
    users: [User]
    user(id: ID!): User
  }
`;

const resolvers = {
  Query: {
    users: () => [
      { id: '1', username: 'john_doe', email: 'john@example.com' },
      { id: '2', username: 'jane_smith', email: 'jane@example.com' }
    ],
    user: (_, { id }) => ({ id, username: 'john_doe', email: 'john@example.com' })
  },
  User: {
    posts: (user) => [
      { id: '1', title: 'Hello World', author: user }
    ]
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

server.listen({ port: 4001 }).then(({ url }) => {
  // CONSOLE_LOG_VIOLATION: console.log(`Users subgraph ready at ${url}`);
});
EOF

    # Posts subgraph
    cat > ~/Developer/graphql/subgraphs/posts/package.json << 'EOF'
{
  "name": "posts-subgraph",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@apollo/subgraph": "^2.5.5",
    "apollo-server": "^4.9.5",
    "graphql": "^16.8.1"
  }
}
EOF

    cat > ~/Developer/graphql/subgraphs/posts/index.js << 'EOF'
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');

const typeDefs = gql`
  type User @key(fields: "id") @extends {
    id: ID! @external
    posts: [Post]
  }

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    content: String!
    author: User @provides(fields: "username")
  }

  type Query {
    posts: [Post]
    post(id: ID!): Post
  }
`;

const resolvers = {
  Query: {
    posts: () => [
      { id: '1', title: 'Hello World', content: 'This is my first post', author: { id: '1', username: 'john_doe' } }
    ],
    post: (_, { id }) => ({ id, title: 'Hello World', content: 'This is my first post', author: { id: '1', username: 'john_doe' } })
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

server.listen({ port: 4002 }).then(({ url }) => {
  // CONSOLE_LOG_VIOLATION: console.log(`Posts subgraph ready at ${url}`);
});
EOF

    # Gateway
    cat > ~/Developer/graphql/gateway/package.json << 'EOF'
{
  "name": "federation-gateway",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@apollo/gateway": "^2.5.5",
    "apollo-server": "^4.9.5"
  }
}
EOF

    cat > ~/Developer/graphql/gateway/index.js << 'EOF'
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');
const { ApolloServer } = require('apollo-server');

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001' },
    { name: 'posts', url: 'http://localhost:4002' }
  ],
  buildService({ name, url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // Add authentication headers, etc.
      }
    });
  }
});

const server = new ApolloServer({
  gateway,
  subscriptions: false
});

server.listen({ port: 4000 }).then(({ url }) => {
  // CONSOLE_LOG_VIOLATION: console.log(`Federated GraphQL API ready at ${url}`);
});
EOF

    # Supergraph configuration
    cat > ~/Developer/graphql/supergraph/supergraph.yaml << 'EOF'
federation_version: 2
subgraphs:
  users:
    routing_url: http://localhost:4001
    schema:
      file: ./subgraphs/users/schema.graphql
  posts:
    routing_url: http://localhost:4002
    schema:
      file: ./subgraphs/posts/schema.graphql
EOF

    log "GraphQL federation setup completed"
}

# 3. API SMOKE TESTS
setup_api_smoke_tests() {
    log "Setting up API smoke tests..."

    # Create smoke test suite
    mkdir -p ~/Developer/tests/{smoke,integration,e2e}

    cat > ~/Developer/tests/smoke/api-smoke-tests.js << 'EOF'
const axios = require('axios');

const API_ENDPOINTS = [
  'http://localhost:3000/health',
  'http://localhost:8000/docs',
  'http://localhost:4000/graphql',
  'http://localhost:5432',
  'http://localhost:7474'
];

const GRAPHQL_QUERIES = [
  {
    query: '{ users { id username email } }',
    endpoint: 'http://localhost:4000/graphql'
  },
  {
    query: '{ posts { id title author { username } } }',
    endpoint: 'http://localhost:4000/graphql'
  }
];

async function runSmokeTests() {
  // CONSOLE_LOG_VIOLATION: console.log('🚀 Starting API Smoke Tests...\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test basic endpoints
  for (const endpoint of API_ENDPOINTS) {
    results.total++;
    try {
      const response = await axios.get(endpoint, { timeout: 5000 });
      if (response.status >= 200 && response.status < 300) {
        // CONSOLE_LOG_VIOLATION: console.log(`✅ ${endpoint} - Status: ${response.status}`);
        results.passed++;
      } else {
        // CONSOLE_LOG_VIOLATION: console.log(`❌ ${endpoint} - Status: ${response.status}`);
        results.failed++;
      }
    } catch (error) {
      // CONSOLE_LOG_VIOLATION: console.log(`❌ ${endpoint} - Error: ${error.code || error.message}`);
      results.failed++;
    }
  }

  // Test GraphQL endpoints
  for (const { query, endpoint } of GRAPHQL_QUERIES) {
    results.total++;
    try {
      const response = await axios.post(endpoint, { query }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && !response.data.errors) {
        // CONSOLE_LOG_VIOLATION: console.log(`✅ GraphQL ${endpoint} - Query successful`);
        results.passed++;
      } else {
        // CONSOLE_LOG_VIOLATION: console.log(`❌ GraphQL ${endpoint} - Query failed: ${JSON.stringify(response.data.errors)}`);
        results.failed++;
      }
    } catch (error) {
      // CONSOLE_LOG_VIOLATION: console.log(`❌ GraphQL ${endpoint} - Error: ${error.message}`);
      results.failed++;
    }
  }

  // CONSOLE_LOG_VIOLATION: console.log(`\n📊 Smoke Test Results:`);
  // CONSOLE_LOG_VIOLATION: console.log(`Total Tests: ${results.total}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Passed: ${results.passed}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Failed: ${results.failed}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    // CONSOLE_LOG_VIOLATION: console.log('\n❌ Some smoke tests failed. Check your services.');
    process.exit(1);
  } else {
    // CONSOLE_LOG_VIOLATION: console.log('\n✅ All smoke tests passed!');
  }
}

runSmokeTests().catch(console.error);
EOF

    cat > ~/Developer/tests/smoke/database-smoke-tests.py << 'EOF'
#!/usr/bin/env python3
"""
Database Smoke Tests for AI Agency Platform
Tests PostgreSQL, Neo4j, and Redis connectivity
"""

import asyncio
import asyncpg
import redis.asyncio as redis
from neo4j import AsyncGraphDatabase
import sys

async def test_postgresql():
    """Test PostgreSQL connection"""
    try:
        conn = await asyncpg.connect(
            user='postgres',
            password='',
            database='ai_agency_db',
            host='localhost'
        )
        result = await conn.fetchval('SELECT version()')
        await conn.close()
        return True, f"PostgreSQL connected: {result[:50]}..."
    except Exception as e:
        return False, f"PostgreSQL failed: {str(e)}"

async def test_neo4j():
    """Test Neo4j connection"""
    try:
        driver = AsyncGraphDatabase.driver(
            "neo4j://localhost:7687",
            auth=("neo4j", "password")
        )
        async with driver.session() as session:
            result = await session.run("RETURN 'Hello Neo4j' as message")
            record = await result.single()
            message = record["message"]
        await driver.close()
        return True, f"Neo4j connected: {message}"
    except Exception as e:
        return False, f"Neo4j failed: {str(e)}"

async def test_redis():
    """Test Redis connection"""
    try:
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        await r.set('smoke_test', 'Hello Redis')
        value = await r.get('smoke_test')
        await r.delete('smoke_test')
        await r.close()
        return True, f"Redis connected: {value}"
    except Exception as e:
        return False, f"Redis failed: {str(e)}"

async def main():
    print("🚀 Starting Database Smoke Tests...\n")

    tests = [
        ("PostgreSQL", test_postgresql),
        ("Neo4j", test_neo4j),
        ("Redis", test_redis)
    ]

    results = {"passed": 0, "failed": 0, "total": len(tests)}

    for name, test_func in tests:
        print(f"Testing {name}...")
        try:
            success, message = await test_func()
            if success:
                print(f"✅ {name}: {message}")
                results["passed"] += 1
            else:
                print(f"❌ {name}: {message}")
                results["failed"] += 1
        except Exception as e:
            print(f"❌ {name}: Unexpected error: {str(e)}")
            results["failed"] += 1
        print()

    print("📊 Database Smoke Test Results:")
    print(f"Total Tests: {results['total']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(".1f")

    if results["failed"] > 0:
        print("\n❌ Some database tests failed. Check your database services.")
        sys.exit(1)
    else:
        print("\n✅ All database tests passed!")

if __name__ == "__main__":
    asyncio.run(main())
EOF

    # Make Python script executable
    chmod +x ~/Developer/tests/smoke/database-smoke-tests.py

    log "API smoke tests setup completed"
}

# 4. CROSS-LANGUAGE COMMUNICATION
setup_polyglot_communication() {
    log "Setting up polyglot communication infrastructure..."

    # gRPC setup
    brew install grpc
    npm install -g grpc-tools
    pipx install grpcio-tools

    # Protocol Buffers
    brew install protobuf
    npm install -g protobufjs

    # Message queues
    brew install rabbitmq
    brew services start rabbitmq || warn "RabbitMQ service start failed"

    # Apache Kafka (via Docker for development)
    cat > ~/Developer/docker-compose.yml << 'EOF'
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_agency_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  neo4j:
    image: neo4j:5.15
    environment:
      NEO4J_AUTH: neo4j/password
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j_data:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  neo4j_data:
  redis_data:
EOF

    # Cross-language build tools
    brew install bazel
    npm install -g lerna
    pipx install poetry

    log "Polyglot communication setup completed"
}

# 5. MCP SERVER INTEGRATION
setup_mcp_integration() {
    log "Setting up MCP server integrations..."

    # Create MCP configuration
    mkdir -p ~/Developer/mcp/{servers,configs}

    cat > ~/Developer/mcp/configs/mcp-settings.json << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres:password@localhost:5432/ai_agency_db"]
    },
    "web": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-web", "https://api.github.com"]
    }
  }
}
EOF

    # MCP client utilities
    cat > ~/Developer/mcp/mcp-client.js << 'EOF'
const { Client } = require('@modelcontextprotocol/sdk');

class MCPClientManager {
  constructor() {
    this.clients = new Map();
  }

  async connectToServer(serverName, config) {
    const client = new Client({
      name: serverName,
      version: '1.0.0'
    });

    await client.connect(config);
    this.clients.set(serverName, client);
    return client;
  }

  async queryServer(serverName, method, params = {}) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }

    return await client.request(method, params);
  }

  async disconnectServer(serverName) {
    const client = this.clients.get(serverName);
    if (client) {
      await client.disconnect();
      this.clients.delete(serverName);
    }
  }

  async disconnectAll() {
    for (const [name, client] of this.clients) {
      await client.disconnect();
    }
    this.clients.clear();
  }
}

module.exports = MCPClientManager;
EOF

    log "MCP integration setup completed"
}

# 6. INTEGRATION TEST SUITE
create_integration_tests() {
    log "Creating comprehensive integration test suite..."

    cat > ~/Developer/tests/integration/full-stack-test.js << 'EOF'
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function runFullStackIntegrationTest() {
  // CONSOLE_LOG_VIOLATION: console.log('🚀 Running Full Stack Integration Test...\n');

  const results = {
    frontend: false,
    backend: false,
    database: false,
    graphql: false,
    total: 4
  };

  try {
    // Test frontend
    // CONSOLE_LOG_VIOLATION: console.log('Testing Frontend (Next.js)...');
    const frontendResponse = await axios.get('http://localhost:3000', { timeout: 10000 });
    if (frontendResponse.status === 200) {
      // CONSOLE_LOG_VIOLATION: console.log('✅ Frontend is responding');
      results.frontend = true;
    }
  } catch (error) {
    // CONSOLE_LOG_VIOLATION: console.log('❌ Frontend test failed:', error.message);
  }

  try {
    // Test backend API
    // CONSOLE_LOG_VIOLATION: console.log('Testing Backend API (FastAPI)...');
    const backendResponse = await axios.get('http://localhost:8000/docs', { timeout: 10000 });
    if (backendResponse.status === 200) {
      // CONSOLE_LOG_VIOLATION: console.log('✅ Backend API is responding');
      results.backend = true;
    }
  } catch (error) {
    // CONSOLE_LOG_VIOLATION: console.log('❌ Backend API test failed:', error.message);
  }

  try {
    // Test database connectivity
    // CONSOLE_LOG_VIOLATION: console.log('Testing Database Connectivity...');
    const { stdout } = await execAsync('psql -h localhost -U postgres -d ai_agency_db -c "SELECT 1"', { timeout: 5000 });
    if (stdout.includes('1')) {
      // CONSOLE_LOG_VIOLATION: console.log('✅ Database is accessible');
      results.database = true;
    }
  } catch (error) {
    // CONSOLE_LOG_VIOLATION: console.log('❌ Database test failed:', error.message);
  }

  try {
    // Test GraphQL federation
    // CONSOLE_LOG_VIOLATION: console.log('Testing GraphQL Federation...');
    const graphqlResponse = await axios.post('http://localhost:4000/graphql',
      { query: '{ users { id username } }' },
      { timeout: 10000 }
    );
    if (graphqlResponse.data && !graphqlResponse.data.errors) {
      // CONSOLE_LOG_VIOLATION: console.log('✅ GraphQL federation is working');
      results.graphql = true;
    }
  } catch (error) {
    // CONSOLE_LOG_VIOLATION: console.log('❌ GraphQL test failed:', error.message);
  }

  // Calculate results
  const passed = Object.values(results).filter(Boolean).length - 1; // Subtract total
  const successRate = ((passed / results.total) * 100).toFixed(1);

  // CONSOLE_LOG_VIOLATION: console.log('\n📊 Integration Test Results:');
  // CONSOLE_LOG_VIOLATION: console.log(`Frontend: ${results.frontend ? '✅' : '❌'}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Backend: ${results.backend ? '✅' : '❌'}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Database: ${results.database ? '✅' : '❌'}`);
  // CONSOLE_LOG_VIOLATION: console.log(`GraphQL: ${results.graphql ? '✅' : '❌'}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Success Rate: ${successRate}%`);

  if (passed === results.total) {
    // CONSOLE_LOG_VIOLATION: console.log('\n🎉 All integration tests passed!');
    return true;
  } else {
    // CONSOLE_LOG_VIOLATION: console.log('\n⚠️ Some integration tests failed. Check your services.');
    return false;
  }
}

runFullStackIntegrationTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(console.error);
EOF

    log "Integration test suite created"
}

# MAIN EXECUTION
main() {
    setup_network_proxy
    setup_graphql_federation
    setup_api_smoke_tests
    setup_polyglot_communication
    setup_mcp_integration
    create_integration_tests

    log "Polyglot integration setup completed!"
    echo
    echo "🎉 Setup Complete!"
    echo
    echo "Next steps:"
    echo "1. Start databases: docker-compose up -d"
    echo "2. Start GraphQL services: cd ~/Developer/graphql && npm install && npm start"
    echo "3. Run smoke tests: node ~/Developer/tests/smoke/api-smoke-tests.js"
    echo "4. Run integration tests: node ~/Developer/tests/integration/full-stack-test.js"
    echo
    echo "Happy integrating! 🚀"
}

main "$@"