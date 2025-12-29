#!/bin/bash
# Deploy all 20 use cases for AI agency demonstration

echo "🚀 DEPLOYING ALL 20 AI AGENCY USE CASES"
echo "======================================="

# Start infrastructure
echo "Starting shared infrastructure..."
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait for services
sleep 30

# Deploy use cases in order
for i in {01..20}; do
    echo "Deploying Use Case $i..."
    cd "$(printf "%02d" $i)-*"
    docker-compose up -d
    cd ..
    sleep 5
done

echo ""
echo "🎯 ALL USE CASES DEPLOYED"
echo "=========================="
echo "Available endpoints:"
for i in {01..20}; do
    echo "• Use Case $i: http://localhost:800$i"
done
echo ""
echo "GraphQL Federation: http://localhost:4000/graphql"
echo "Monitoring: http://localhost:9090"
