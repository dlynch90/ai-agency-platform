#!/bin/bash

# Database Setup Script for AI Agency Application
# Vendor-compliant database initialization

set -e

echo "🚀 Setting up databases for AI Agency Application..."

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | xargs)
fi

# PostgreSQL Setup
setup_postgresql() {
    echo "📊 Setting up PostgreSQL..."

    # Check if PostgreSQL is running
    if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} >/dev/null 2>&1; then
        echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
        return 1
    fi

    # Create database if it doesn't exist
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d postgres -c "CREATE DATABASE ${DB_NAME:-aiagency};" 2>/dev/null || true

    # Run Prisma migrations
    echo "🔄 Running Prisma migrations..."
    npx prisma migrate deploy

    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate

    echo "✅ PostgreSQL setup complete!"
}

# Neo4j Setup
setup_neo4j() {
    echo "🕸️ Setting up Neo4j..."

    # Check if Neo4j is running
    if ! curl -s http://localhost:7474 >/dev/null; then
        echo "❌ Neo4j is not running. Please start Neo4j service."
        return 1
    fi

    # Check Gibson CLI availability
    if ! command -v gibson >/dev/null 2>&1; then
        echo "⚠️ Gibson CLI not found. Installing..."
        npm install -g @gibson/cli
    fi

    # Initialize Gibson configuration
    echo "🔧 Initializing Gibson configuration..."
    gibson init --config gibson-config.yaml

    # Create constraints and indexes
    echo "🛡️ Creating Neo4j constraints and indexes..."
    gibson migrate up

    # Seed initial data
    echo "🌱 Seeding initial graph data..."
    gibson seed --file neo4j/seeds/initial.cypher

    echo "✅ Neo4j setup complete!"
}

# Environment validation
validate_environment() {
    echo "🔍 Validating environment..."

    # Check required environment variables
    required_vars=("DATABASE_URL" "NEO4J_URI" "NEO4J_USERNAME" "NEO4J_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Required environment variable $var is not set"
            return 1
        fi
    done

    echo "✅ Environment validation passed!"
}

# Main setup function
main() {
    echo "🎯 Starting database setup..."

    # Validate environment
    validate_environment

    # Setup databases
    setup_postgresql
    setup_neo4j

    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Run 'npx prisma studio' to explore PostgreSQL data"
    echo "  2. Run 'gibson console' to explore Neo4j graph"
    echo "  3. Start the application server"
}

# Run main function
main "$@"