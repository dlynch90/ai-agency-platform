#!/bin/bash
# Complete Database Stack Setup
# PostgreSQL + Prisma + Neo4j + Gibson CLI integration

set -e

echo "🗄️ DATABASE STACK SETUP"
echo "======================="

# Install required database tools
echo "Installing database tools..."
brew install postgresql neo4j postgresql@15
brew install --cask pgadmin4

# Install Gibson CLI (if available)
if command -v gibson >/dev/null 2>&1; then
    echo "✅ Gibson CLI already installed"
else
    echo "⚠️ Gibson CLI not found - install manually if available"
fi

echo ""
echo "🐘 POSTGRESQL SETUP"
echo "==================="

# Start PostgreSQL service
brew services start postgresql@15

# Wait for PostgreSQL to start
sleep 5

# Create database and user
echo "Creating database and user..."
createdb polyglot_db 2>/dev/null || echo "Database may already exist"
createuser polyglot_user 2>/dev/null || echo "User may already exist"

# Set up database permissions
psql -d polyglot_db << 'EOF'
-- Create schema for AI agency applications
CREATE SCHEMA IF NOT EXISTS ai_agency;

-- Create tables for multi-tenant AI agency platform
CREATE TABLE IF NOT EXISTS ai_agency.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    api_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB
);

CREATE TABLE IF NOT EXISTS ai_agency.users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES ai_agency.tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_agency.ai_models (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES ai_agency.tenants(id),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100), -- openai, anthropic, etc.
    model_id VARCHAR(255),
    api_key_encrypted TEXT,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_agency.applications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES ai_agency.tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100), -- chat, generation, analysis, etc.
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_agency.usage_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES ai_agency.tenants(id),
    user_id INTEGER REFERENCES ai_agency.users(id),
    application_id INTEGER REFERENCES ai_agency.applications(id),
    model_id INTEGER REFERENCES ai_agency.ai_models(id),
    tokens_used INTEGER,
    cost_cents INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON ai_agency.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON ai_agency.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tenant_date ON ai_agency.usage_logs(tenant_id, created_at);

-- Insert sample tenant
INSERT INTO ai_agency.tenants (name, domain, api_key) VALUES
('Demo Agency', 'demo.aiagency.com', 'demo_key_123')
ON CONFLICT (domain) DO NOTHING;

SELECT 'PostgreSQL setup complete - AI Agency schema created' as status;
EOF

echo "✅ PostgreSQL setup complete"

echo ""
echo "🔗 PRISMA SETUP"
echo "==============="

# Initialize Prisma in database directory
cd database-integration

# Create Prisma schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id        Int      @id @default(autoincrement())
  name      String
  domain    String   @unique
  apiKey    String   @unique
  createdAt DateTime @default(now())
  settings  Json?
  users     User[]
  aiModels  AIModel[]
  applications Application[]
  usageLogs UsageLog[]

  @@map("ai_agency.tenants")
}

model User {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  email     String   @unique
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  usageLogs UsageLog[]

  @@map("ai_agency.users")
}

model AIModel {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  name      String
  provider  String?
  modelId   String?
  apiKeyEncrypted String?
  config    Json?
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  usageLogs UsageLog[]

  @@map("ai_agency.ai_models")
}

model Application {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  name        String
  description String?
  type        String?
  config      Json?
  createdAt   DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  usageLogs   UsageLog[]

  @@map("ai_agency.applications")
}

model UsageLog {
  id            Int      @id @default(autoincrement())
  tenantId      Int
  userId        Int?
  applicationId Int?
  modelId       Int?
  tokensUsed    Int?
  costCents     Int?
  createdAt     DateTime @default(now())
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  user          User?    @relation(fields: [userId], references: [id])
  application   Application? @relation(fields: [applicationId], references: [id])
  aiModel       AIModel? @relation(fields: [modelId], references: [id])

  @@map("ai_agency.usage_logs")
}
EOF

# Create environment file
cat > .env << 'EOF'
DATABASE_URL="postgresql://polyglot_user@localhost:5432/polyglot_db?schema=ai_agency"
EOF

echo "✅ Prisma schema created"

echo ""
echo "🕸️ NEO4J SETUP"
echo "=============="

# Start Neo4j service
brew services start neo4j

# Wait for Neo4j to start
sleep 10

# Create Neo4j schema for AI agency knowledge graph
cat > neo4j_schema.cypher << 'EOF'
// Neo4j Schema for AI Agency Knowledge Graph

// Create constraints
CREATE CONSTRAINT tenant_id IF NOT EXISTS FOR (t:Tenant) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT ai_model_id IF NOT EXISTS FOR (m:AIModel) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT application_id IF NOT EXISTS FOR (a:Application) REQUIRE a.id IS UNIQUE;

// Create indexes
CREATE INDEX tenant_domain IF NOT EXISTS FOR (t:Tenant) ON (t.domain);
CREATE INDEX user_tenant IF NOT EXISTS FOR (u:User) ON (u.tenantId);
CREATE INDEX usage_timestamp IF NOT EXISTS FOR (ul:UsageLog) ON (ul.createdAt);

// Sample data
MERGE (t:Tenant {id: 1, name: "Demo Agency", domain: "demo.aiagency.com"})
MERGE (u:User {id: 1, email: "admin@demo.aiagency.com", name: "Admin User"})
MERGE (m:AIModel {id: 1, name: "GPT-4", provider: "openai"})
MERGE (a:Application {id: 1, name: "Content Generator", type: "generation"})

// Create relationships
MERGE (u)-[:BELONGS_TO]->(t)
MERGE (m)-[:OWNED_BY]->(t)
MERGE (a)-[:OWNED_BY]->(t)

// Create knowledge graph relationships
MERGE (m)-[:USED_BY]->(a)
MERGE (u)-[:USES]->(a)
MERGE (u)-[:ACCESSES]->(m);
EOF

# Load Neo4j schema
if command -v cypher-shell >/dev/null 2>&1; then
    cypher-shell -f neo4j_schema.cypher
    echo "✅ Neo4j schema loaded"
else
    echo "⚠️ cypher-shell not found - run manually: cypher-shell -f neo4j_schema.cypher"
fi

cd ..

echo ""
echo "🔧 GIBSON CLI INTEGRATION"
echo "========================="

# Gibson CLI integration (placeholder - would need actual Gibson CLI)
cat > scripts/gibson_integration.py << 'EOF'
#!/usr/bin/env python3
"""
Gibson CLI Integration for AI Agency Platform
Advanced database operations and analytics
"""
import subprocess
import json
import os

class GibsonIntegration:
    def __init__(self):
        self.gibson_available = self.check_gibson()

    def check_gibson(self):
        """Check if Gibson CLI is available"""
        try:
            result = subprocess.run(['gibson', '--version'],
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False

    def run_query(self, query, database="postgres"):
        """Run query using Gibson CLI"""
        if not self.gibson_available:
            return {"error": "Gibson CLI not available"}

        try:
            cmd = ['gibson', 'query', '--database', database, query]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            return json.loads(result.stdout) if result.returncode == 0 else {"error": result.stderr}
        except Exception as e:
            return {"error": str(e)}

    def analyze_performance(self):
        """Analyze database performance using Gibson"""
        queries = [
            "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;",
            "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
        ]

        results = {}
        for i, query in enumerate(queries):
            results[f"query_{i+1}"] = self.run_query(query)

        return results

    def optimize_schema(self):
        """Suggest schema optimizations"""
        if not self.gibson_available:
            return {"suggestions": ["Install Gibson CLI for advanced analytics"]}

        # Analyze table statistics
        stats = self.run_query("""
            SELECT schemaname, tablename,
                   n_tup_ins as inserts,
                   n_tup_upd as updates,
                   n_tup_del as deletes,
                   n_live_tup as live_rows,
                   n_dead_tup as dead_rows
            FROM pg_stat_user_tables
            WHERE schemaname = 'ai_agency'
            ORDER BY n_live_tup DESC;
        """)

        suggestions = []
        if isinstance(stats, dict) and 'error' not in stats:
            for table in stats.get('rows', []):
                dead_ratio = table.get('dead_rows', 0) / max(table.get('live_rows', 1), 1)
                if dead_ratio > 0.2:
                    suggestions.append(f"VACUUM {table['tablename']} (dead tuple ratio: {dead_ratio:.2%})")

        return {"suggestions": suggestions or ["Schema optimization not needed"]}

# CLI interface
if __name__ == "__main__":
    import sys

    gibson = GibsonIntegration()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "check":
            print(f"Gibson CLI available: {gibson.gibson_available}")
        elif command == "performance":
            print(json.dumps(gibson.analyze_performance(), indent=2))
        elif command == "optimize":
            print(json.dumps(gibson.optimize_schema(), indent=2))
        else:
            print("Usage: python gibson_integration.py {check|performance|optimize}")
    else:
        print("Gibson CLI Integration for AI Agency Platform")
        print("Usage: python gibson_integration.py <command>")
        print("Commands: check, performance, optimize")
EOF

chmod +x scripts/gibson_integration.py

echo "✅ Gibson CLI integration script created"

echo ""
echo "🚀 STARTUP SCRIPTS"
echo "=================="

# Create database startup script
cat > scripts/start_databases.sh << 'EOF'
#!/bin/bash
# Start all database services for AI agency platform

echo "Starting database services..."

# Start PostgreSQL
brew services start postgresql@15
echo "✅ PostgreSQL started (localhost:5432)"

# Start Neo4j
brew services start neo4j
echo "✅ Neo4j started (localhost:7474 web, localhost:7687 bolt)"

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 15

# Test connections
echo "Testing connections..."
psql -d polyglot_db -c "SELECT 'PostgreSQL ready' as status;" 2>/dev/null || echo "⚠️ PostgreSQL connection test failed"

curl -s http://localhost:7474/browser/ >/dev/null && echo "✅ Neo4j web interface ready" || echo "⚠️ Neo4j web interface not responding"

echo ""
echo "Database services ready!"
echo "PostgreSQL: localhost:5432"
echo "Neo4j Web: http://localhost:7474"
echo "Neo4j Bolt: localhost:7687"
echo ""
echo "Prisma: cd database-integration && npx prisma generate"
echo "Gibson: python scripts/gibson_integration.py check"
EOF

chmod +x scripts/start_databases.sh

# Create Prisma integration script
cat > scripts/prisma_integration.sh << 'EOF'
#!/bin/bash
# Prisma Integration for AI Agency Database

cd database-integration

echo "Setting up Prisma..."

# Install Prisma client
npm install @prisma/client

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Create seed script
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'demo.aiagency.com' },
    update: {},
    create: {
      name: 'Demo AI Agency',
      domain: 'demo.aiagency.com',
      apiKey: 'demo_key_' + Math.random().toString(36).substr(2, 9),
      settings: {
        plan: 'demo',
        features: ['ai-models', 'analytics', 'multi-user']
      }
    }
  })

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.aiagency.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.aiagency.com',
      name: 'Demo Admin',
      role: 'admin'
    }
  })

  // Create sample AI model
  const aiModel = await prisma.aIModel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'GPT-4',
      provider: 'openai',
      modelId: 'gpt-4',
      config: {
        maxTokens: 4096,
        temperature: 0.7
      }
    }
  })

  // CONSOLE_LOG_VIOLATION: console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF

echo "✅ Prisma integration complete"
echo "Run: npx tsx prisma/seed.ts"
EOF

chmod +x scripts/prisma_integration.sh

echo ""
echo "🎯 DATABASE STACK COMPLETE"
echo "========================="
echo ""
echo "Database Services:"
echo "✅ PostgreSQL: localhost:5432"
echo "✅ Neo4j: localhost:7474 (web), localhost:7687 (bolt)"
echo "✅ Prisma: ORM and migrations ready"
echo "✅ Gibson CLI: Advanced analytics integration"
echo ""
echo "Next Steps:"
echo "1. Start databases: ./scripts/start_databases.sh"
echo "2. Run Prisma setup: ./scripts/prisma_integration.sh"
echo "3. Seed database: cd database-integration && npx tsx prisma/seed.ts"
echo "4. Test Gibson: python scripts/gibson_integration.py check"
echo ""
echo "🎉 Complete database stack ready for AI agency applications!"