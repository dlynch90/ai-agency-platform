#!/bin/bash
# Start the complete E-commerce Personalization Engine

echo "🛒 Starting E-commerce Personalization Engine..."

# Start databases
echo "Starting databases..."
cd deployment
docker-compose up -d postgres neo4j redis

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 30

# Start backend
echo "Starting backend API..."
cd ../backend
npm run dev &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🎉 E-commerce Personalization Engine is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 GraphQL API: http://localhost:4000/graphql"
echo "🐘 PostgreSQL: localhost:5432"
echo "🕸️ Neo4j: http://localhost:7474"
echo "🔴 Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cd deployment && docker-compose down; exit 0' INT

wait
