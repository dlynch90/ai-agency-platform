#!/bin/bash

# POLYGLOT STACK SETUP
# PostgreSQL + Prisma + Neo4j + Gibson CLI Integration

set -euo pipefail

WORKSPACE="${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}"
LOG_DIR="$WORKSPACE/logs/polyglot"
PID_DIR="$WORKSPACE/.polyglot/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$1] $2" | tee -a "$LOG_DIR/setup.log"
}

# Setup PostgreSQL
setup_postgres() {
    log "INFO" "Setting up PostgreSQL..."

    # Create database if it doesn't exist
    if ! psql -h localhost -p 5432 -U postgres -l | grep -q "ai_agency_db"; then
        createdb -h localhost -p 5432 -U postgres ai_agency_db
        log "INFO" "Created ai_agency_db database"
    fi

    # Run Prisma migrations
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        npx prisma db push
        log "INFO" "Prisma schema deployed to PostgreSQL"
    fi
}

# Setup Neo4j
setup_neo4j() {
    log "INFO" "Setting up Neo4j..."

    # Wait for Neo4j to be ready
    local retries=30
    while [ $retries -gt 0 ]; do
        if cypher-shell -a "bolt://localhost:7687" -u neo4j -p password "MATCH () RETURN count(*) LIMIT 1" >/dev/null 2>&1; then
            log "INFO" "Neo4j is ready"
            break
        fi
        sleep 2
        ((retries--))
    done

    if [ $retries -eq 0 ]; then
        log "ERROR" "Neo4j failed to start"
        return 1
    fi

    # Create initial schema
    cypher-shell -a "bolt://localhost:7687" -u neo4j -p password << EOF
CREATE CONSTRAINT unique_tenant_id IF NOT EXISTS FOR (t:Tenant) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT unique_client_id IF NOT EXISTS FOR (c:Client) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT unique_campaign_id IF NOT EXISTS FOR (camp:Campaign) REQUIRE camp.id IS UNIQUE;

// Create indexes for performance
CREATE INDEX tenant_domain IF NOT EXISTS FOR (t:Tenant) ON (t.domain);
CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email);
CREATE INDEX campaign_status IF NOT EXISTS FOR (c:Campaign) ON (c.status);
EOF

    log "INFO" "Neo4j schema initialized"
}

# Setup Gibson CLI (if available)
setup_gibson() {
    log "INFO" "Setting up Gibson CLI..."

    # Gibson CLI would be installed here if available
    # For now, we'll use standard database clients
    if ! command -v pgcli >/dev/null 2>&1; then
        pip3 install pgcli 2>/dev/null || log "WARN" "Failed to install pgcli"
    fi

    if ! command -v litecli >/dev/null 2>&1; then
        pip3 install litecli 2>/dev/null || log "WARN" "Failed to install litecli"
    fi

    log "INFO" "Database CLI tools configured"
}

# Setup environment variables
setup_environment() {
    log "INFO" "Setting up environment variables..."

    cat > ".env.polyglot" << EOF
# Database URLs
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_agency_db"
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password"
REDIS_URL="redis://localhost:6379"
QDRANT_URL="http://localhost:6333"

# Authentication
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"

# AI/ML
OPENAI_API_KEY="your-openai-key"
HUGGINGFACE_API_TOKEN="your-huggingface-token"

# Monitoring
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"
EOF

    log "INFO" "Environment file created: .env.polyglot"
}

# Test connections
test_connections() {
    log "INFO" "Testing database connections..."

    # Test PostgreSQL
    if psql -h localhost -p 5432 -U postgres -d ai_agency_db -c "SELECT 1" >/dev/null 2>&1; then
        log "INFO" "✓ PostgreSQL connection successful"
    else
        log "ERROR" "✗ PostgreSQL connection failed"
    fi

    # Test Neo4j
    if cypher-shell -a "bolt://localhost:7687" -u neo4j -p password "RETURN 'Hello Neo4j!'" >/dev/null 2>&1; then
        log "INFO" "✓ Neo4j connection successful"
    else
        log "ERROR" "✗ Neo4j connection failed"
    fi

    # Test Redis
    if redis-cli ping | grep -q "PONG"; then
        log "INFO" "✓ Redis connection successful"
    else
        log "WARN" "✗ Redis connection failed"
    fi

    # Test Qdrant
    if curl -s http://localhost:6333/health >/dev/null 2>&1; then
        log "INFO" "✓ Qdrant connection successful"
    else
        log "WARN" "✗ Qdrant connection failed"
    fi
}

# Main setup
main() {
    log "INFO" "=== POLYGLOT STACK SETUP ==="

    setup_environment
    setup_postgres
    setup_neo4j
    setup_gibson
    test_connections

    log "INFO" "=== POLYGLOT STACK SETUP COMPLETE ==="
    log "INFO" "Databases: PostgreSQL, Neo4j, Redis, Qdrant"
    log "INFO" "ORM: Prisma"
    log "INFO" "CLI Tools: pgcli, litecli"
    log "INFO" "Environment: .env.polyglot"
}

main "$@"