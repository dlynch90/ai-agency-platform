#!/bin/bash

# Docker Services Health Check Script
# Tests all configured services in docker-compose.services.yml

set -e

echo "🔍 DOCKER SERVICES HEALTH CHECK"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi

print_success "Docker is running"

# Check if fea-network exists
if docker network ls | grep -q fea-network; then
    print_success "fea-network exists"
else
    print_error "fea-network not found"
    exit 1
fi

# Service health checks
SERVICES=(
    "fea-neo4j:7474:Neo4j HTTP"
    "fea-qdrant:6333:Qdrant REST API"
    "fea-redis:6379:Redis"
    "fea-postgres:5432:PostgreSQL"
    "fea-ollama:11434:Ollama"
    "fea-elasticsearch:9200:Elasticsearch"
    "fea-jupyterhub:8000:JupyterHub"
    "fea-minio:9000:MinIO"
    "fea-pgadmin:80:pgAdmin"
)

TOTAL_SERVICES=${#SERVICES[@]}
HEALTHY_SERVICES=0

echo ""
echo "🔍 TESTING INDIVIDUAL SERVICES"
echo "==============================="

for service in "${SERVICES[@]}"; do
    IFS=':' read -r container port description <<< "$service"

    if docker ps | grep -q "$container"; then
        # Test if port is responding
        if nc -z localhost "$port" 2>/dev/null; then
            print_success "$description ($container:$port) is healthy"
            ((HEALTHY_SERVICES++))
        else
            print_warning "$description ($container:$port) is running but not responding"
        fi
    else
        print_error "$description ($container) is not running"
    fi
done

echo ""
echo "📊 HEALTH SUMMARY"
echo "================="
echo "Healthy services: $HEALTHY_SERVICES/$TOTAL_SERVICES"

if [ "$HEALTHY_SERVICES" -eq "$TOTAL_SERVICES" ]; then
    print_success "All services are healthy! 🎉"
    exit 0
elif [ "$HEALTHY_SERVICES" -gt 0 ]; then
    print_warning "Some services are healthy, others need attention"
    exit 1
else
    print_error "No services are healthy"
    exit 1
fi