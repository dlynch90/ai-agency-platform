#!/bin/bash

# Comprehensive Database Integration Setup
# PostgreSQL + Prisma + Neo4j + Gibson CLI for AI Agency Platform

set -e

echo "🗄️ Setting up comprehensive database integrations..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Setup PostgreSQL
setup_postgresql() {
    log "Setting up PostgreSQL..."

    # Install PostgreSQL if not present
    if ! command_exists psql; then
        log "Installing PostgreSQL..."
        brew install postgresql@15
        brew services start postgresql@15
        sleep 3
    fi

    # Create databases for different environments
    log "Creating databases..."
    createdb ai_agency_dev 2>/dev/null || log "Database ai_agency_dev already exists"
    createdb ai_agency_test 2>/dev/null || log "Database ai_agency_test already exists"
    createdb ai_agency_prod 2>/dev/null || log "Database ai_agency_prod already exists"

    # Setup roles and permissions
    psql -d postgres -c "CREATE ROLE ai_user WITH LOGIN PASSWORD 'secure_password_123';" 2>/dev/null || log "Role ai_user already exists"
    psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ai_agency_dev TO ai_user;" 2>/dev/null || true
    psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ai_agency_test TO ai_user;" 2>/dev/null || true
    psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ai_agency_prod TO ai_user;" 2>/dev/null || true

    log "PostgreSQL setup completed"
}

# Setup Prisma integration
setup_prisma() {
    log "Setting up Prisma integration..."

    # Create Prisma project directory
    mkdir -p prisma-project
    cd prisma-project

    # Initialize Prisma
    if ! command_exists prisma; then
        npm install -g prisma
    fi

    # Create comprehensive schema
    cat > schema.prisma << 'EOF'
// Prisma schema for AI Agency Platform
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  role          UserRole  @default(USER)
  tenantId      String?
  tenant        Tenant?   @relation(fields: [tenantId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions      Session[]
  accounts      Account[]
  projects      Project[]
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Tenant {
  id          String   @id @default(cuid())
  name        String
  domain      String?  @unique
  plan        Plan     @default(FREE)
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  projects    Project[]
  apiKeys     ApiKey[]

  @@map("tenants")
}

// Authentication
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// API Management
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  key         String    @unique
  userId      String?
  tenantId    String?
  permissions Json
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())

  user   User?   @relation(fields: [userId], references: [id])
  tenant Tenant? @relation(fields: [tenantId], references: [id])

  @@map("api_keys")
}

// Project Management
model Project {
  id          String           @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus    @default(ACTIVE)
  type        ProjectType
  userId      String
  tenantId    String?
  settings    Json?
  metadata    Json?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user     User                @relation(fields: [userId], references: [id])
  tenant   Tenant?             @relation(fields: [tenantId], references: [id])
  tasks    Task[]
  files    File[]

  @@map("projects")
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  projectId   String
  assigneeId  String?
  parentId    String?
  dueDate     DateTime?
  estimatedHours Float?
  actualHours   Float?
  tags        String[]
  metadata    Json?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project   Project    @relation(fields: [projectId], references: [id])
  assignee  User?      @relation(fields: [assigneeId], references: [id])
  subtasks  Task[]     @relation("TaskHierarchy")
  parent    Task?      @relation("TaskHierarchy", fields: [parentId], references: [id])

  @@map("tasks")
}

model File {
  id          String   @id @default(cuid())
  name        String
  path        String
  size        Int
  mimeType    String
  checksum    String
  projectId   String
  uploadedBy  String
  metadata    Json?
  createdAt   DateTime @default(now())

  project    Project   @relation(fields: [projectId], references: [id])
  uploader   User      @relation(fields: [uploadedBy], references: [id])

  @@map("files")
}

// AI Service Integrations
model AIService {
  id          String        @id @default(cuid())
  name        String
  provider    AIProvider
  model       String
  apiKeyId    String?
  config      Json
  isActive    Boolean       @default(true)
  usage       Json?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  apiKey      ApiKey?       @relation(fields: [apiKeyId], references: [id])
  requests    AIRequest[]

  @@map("ai_services")
}

model AIRequest {
  id          String      @id @default(cuid())
  serviceId   String
  userId      String
  prompt      String
  response    String?
  tokens      Int?
  cost        Float?
  latency     Int?        // milliseconds
  status      RequestStatus @default(PENDING)
  metadata    Json?
  createdAt   DateTime    @default(now())
  completedAt DateTime?

  service     AIService   @relation(fields: [serviceId], references: [id])
  user        User        @relation(fields: [userId], references: [id])

  @@map("ai_requests")
}

// Audit & Logging
model AuditLog {
  id          String     @id @default(cuid())
  userId      String?
  action      String
  resource    String
  resourceId  String?
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime   @default(now())

  user        User?      @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}

// Enums
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

enum ProjectType {
  CONTENT_GENERATION
  ECOMMERCE
  CUSTOMER_SERVICE
  ANALYTICS
  CUSTOM
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AIProvider {
  OPENAI
  ANTHROPIC
  HUGGINGFACE
  COHERE
  REPLICATE
  CUSTOM
}

enum RequestStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
EOF

    # Create environment configuration
    cat > .env << EOF
DATABASE_URL="postgresql://ai_user:secure_password_123@localhost:5432/ai_agency_dev"
DIRECT_URL="postgresql://ai_user:secure_password_123@localhost:5432/ai_agency_dev"
EOF

    # Generate Prisma client
    npx prisma generate

    cd ..
    log "Prisma integration setup completed"
}

# Setup Neo4j integration
setup_neo4j() {
    log "Setting up Neo4j integration..."

    # Install Neo4j if not present
    if ! command_exists neo4j; then
        log "Installing Neo4j..."
        brew install neo4j
        brew services start neo4j
        sleep 5
    fi

    # Configure Neo4j for AI Agency use case
    mkdir -p neo4j-config

    # Create Neo4j configuration
    cat > neo4j-config/neo4j.conf << EOF
# Neo4j configuration for AI Agency Platform

# Network
dbms.connector.bolt.listen_address=:7687
dbms.connector.http.listen_address=:7474
dbms.connector.https.listen_address=:7473

# Security
dbms.security.auth_enabled=true
dbms.security.procedures.unrestricted=apoc.*
dbms.security.procedures.whitelist=apoc.*

# Memory
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=2G
dbms.memory.pagecache.size=1G

# Extensions
dbms.directories.plugins=/usr/local/opt/neo4j/libexec/plugins
EOF

    # Create Cypher scripts for schema setup
    cat > neo4j-config/init-schema.cypher << 'EOF'
// Neo4j schema for AI Agency Platform

// Create constraints
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT tenant_id IF NOT EXISTS FOR (t:Tenant) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE;

// Create indexes
CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email);
CREATE INDEX project_status IF NOT EXISTS FOR (p:Project) ON (p.status);
CREATE INDEX task_status IF NOT EXISTS FOR (t:Task) ON (t.status);

// Knowledge Graph Schema
// Core entities
CREATE (kg:KnowledgeGraph {name: "AI Agency KG", version: "1.0"})

// Domain concepts
MERGE (ai:Domain {name: "Artificial Intelligence"})
MERGE (ml:Domain {name: "Machine Learning"})
MERGE (nlp:Domain {name: "Natural Language Processing"})
MERGE (cv:Domain {name: "Computer Vision"})
MERGE (agency:Domain {name: "AI Agency Services"})

// Relationships
MERGE (ai)-[:CONTAINS]->(ml)
MERGE (ai)-[:CONTAINS]->(nlp)
MERGE (ai)-[:CONTAINS]->(cv)
MERGE (agency)-[:USES]->(ai)
MERGE (agency)-[:USES]->(ml)
MERGE (agency)-[:USES]->(nlp)
MERGE (agency)-[:USES]->(cv)

// Use case categories
MERGE (content:ContentGen {name: "Content Generation"})
MERGE (ecommerce:Ecommerce {name: "E-commerce Personalization"})
MERGE (support:Support {name: "Customer Service"})
MERGE (finance:Finance {name: "Financial Services"})
MERGE (healthcare:Healthcare {name: "Healthcare"})
MERGE (supply:SupplyChain {name: "Supply Chain"})
MERGE (realestate:RealEstate {name: "Real Estate"})
MERGE (education:Education {name: "Education"})
MERGE (legal:Legal {name: "Legal Services"})
MERGE (manufacturing:Manufacturing {name: "Manufacturing"})

// Connect to agency services
MERGE (agency)-[:PROVIDES]->(content)
MERGE (agency)-[:PROVIDES]->(ecommerce)
MERGE (agency)-[:PROVIDES]->(support)
MERGE (agency)-[:PROVIDES]->(finance)
MERGE (agency)-[:PROVIDES]->(healthcare)
MERGE (agency)-[:PROVIDES]->(supply)
MERGE (agency)-[:PROVIDES]->(realestate)
MERGE (agency)-[:PROVIDES]->(education)
MERGE (agency)-[:PROVIDES]->(legal)
MERGE (agency)-[:PROVIDES]->(manufacturing);

// Technology stack
MERGE (react:Technology {name: "React", category: "Frontend"})
MERGE (vue:Technology {name: "Vue.js", category: "Frontend"})
MERGE (nextjs:Technology {name: "Next.js", category: "Framework"})
MERGE (nodejs:Technology {name: "Node.js", category: "Backend"})
MERGE (python:Technology {name: "Python", category: "Backend"})
MERGE (postgres:Technology {name: "PostgreSQL", category: "Database"})
MERGE (neo4j:Technology {name: "Neo4j", category: "Database"})
MERGE (redis:Technology {name: "Redis", category: "Cache"})
MERGE (kafka:Technology {name: "Kafka", category: "Messaging"})
MERGE (kubernetes:Technology {name: "Kubernetes", category: "Infrastructure"})

// Connect technologies to use cases
MERGE (content)-[:USES_TECH]->(react)
MERGE (content)-[:USES_TECH]->(nodejs)
MERGE (content)-[:USES_TECH]->(postgres)
MERGE (ecommerce)-[:USES_TECH]->(nextjs)
MERGE (ecommerce)-[:USES_TECH]->(python)
MERGE (ecommerce)-[:USES_TECH]->(redis)
MERGE (support)-[:USES_TECH]->(vue)
MERGE (support)-[:USES_TECH]->(kafka)
MERGE (finance)-[:USES_TECH]->(python)
MERGE (finance)-[:USES_TECH]->(neo4j)
MERGE (healthcare)-[:USES_TECH]->(react)
MERGE (healthcare)-[:USES_TECH]->(kubernetes);
EOF

    # Setup APOC and Graph Data Science plugins (if available)
    log "Neo4j integration setup completed"
}

# Setup Gibson CLI (if available)
setup_gibson_cli() {
    log "Setting up Gibson CLI..."

    # Gibson CLI is a Redis-based database CLI
    # Install if available via npm or pip
    if command_exists npm; then
        npm install -g gibson-cli 2>/dev/null || log "Gibson CLI not available via npm"
    fi

    if command_exists pip; then
        pip install gibson-cli 2>/dev/null || log "Gibson CLI not available via pip"
    fi

    # Create Gibson configuration
    cat > gibson-config.json << EOF
{
  "connections": {
    "local": {
      "host": "localhost",
      "port": 6379,
      "password": null,
      "database": 0
    },
    "cache": {
      "host": "localhost",
      "port": 6379,
      "password": null,
      "database": 1
    },
    "sessions": {
      "host": "localhost",
      "port": 6379,
      "password": null,
      "database": 2
    }
  },
  "defaults": {
    "connection": "local",
    "format": "json",
    "timeout": 30
  }
}
EOF

    log "Gibson CLI setup completed"
}

# Create database management scripts
create_management_scripts() {
    log "Creating database management scripts..."

    # PostgreSQL management script
    cat > manage-postgres.sh << 'EOF'
#!/bin/bash
# PostgreSQL Management Script

case "$1" in
    start)
        brew services start postgresql@15
        echo "PostgreSQL started"
        ;;
    stop)
        brew services stop postgresql@15
        echo "PostgreSQL stopped"
        ;;
    restart)
        brew services restart postgresql@15
        echo "PostgreSQL restarted"
        ;;
    status)
        brew services list | grep postgresql
        ;;
    logs)
        tail -f /usr/local/var/log/postgresql@15.log
        ;;
    backup)
        pg_dump -U ai_user -h localhost ai_agency_dev > backup_$(date +%Y%m%d_%H%M%S).sql
        echo "Backup created"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "Usage: $0 restore <backup_file>"
            exit 1
        fi
        psql -U ai_user -h localhost ai_agency_dev < "$2"
        echo "Backup restored"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|backup|restore}"
        ;;
esac
EOF

    # Neo4j management script
    cat > manage-neo4j.sh << 'EOF'
#!/bin/bash
# Neo4j Management Script

case "$1" in
    start)
        brew services start neo4j
        echo "Neo4j started"
        ;;
    stop)
        brew services stop neo4j
        echo "Neo4j stopped"
        ;;
    restart)
        brew services restart neo4j
        echo "Neo4j restarted"
        ;;
    status)
        brew services list | grep neo4j
        ;;
    logs)
        tail -f /usr/local/var/log/neo4j/neo4j.log
        ;;
    cypher)
        cypher-shell -u neo4j -p password
        ;;
    import)
        if [ -z "$2" ]; then
            echo "Usage: $0 import <cypher_file>"
            exit 1
        fi
        cypher-shell -u neo4j -p password -f "$2"
        echo "Data imported"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|cypher|import}"
        ;;
esac
EOF

    # Make scripts executable
    chmod +x manage-postgres.sh manage-neo4j.sh

    log "Database management scripts created"
}

# Test database connections
test_connections() {
    log "Testing database connections..."

    # Test PostgreSQL
    if command_exists psql; then
        if psql -U ai_user -h localhost -d ai_agency_dev -c "SELECT version();" >/dev/null 2>&1; then
            log "✓ PostgreSQL connection successful"
        else
            log "✗ PostgreSQL connection failed"
        fi
    fi

    # Test Neo4j
    if command_exists cypher-shell; then
        if cypher-shell -u neo4j -p password "MATCH () RETURN count(*);" >/dev/null 2>&1; then
            log "✓ Neo4j connection successful"
        else
            log "✗ Neo4j connection failed"
        fi
    fi

    log "Database connection tests completed"
}

# Main setup function
main() {
    log "Starting comprehensive database integration setup..."

    setup_postgresql
    setup_prisma
    setup_neo4j
    setup_gibson_cli
    create_management_scripts
    test_connections

    log "Database integration setup completed!"
    log "Available commands:"
    log "  ./manage-postgres.sh {start|stop|restart|status|logs|backup|restore}"
    log "  ./manage-neo4j.sh {start|stop|restart|status|logs|cypher|import}"
    log "  cd prisma-project && npx prisma studio"
    log "  cd prisma-project && npx prisma db push"
}

# Run main function
main "$@"