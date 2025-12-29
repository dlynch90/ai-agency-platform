#!/bin/bash
# Stop all E-commerce Personalization Engine services

echo "🛑 Stopping E-commerce Personalization Engine..."

# Stop Docker services
cd deployment
docker-compose down

# Kill Node.js processes
pkill -f "node.*dev" 2>/dev/null || true

echo "✅ All services stopped."
