#!/bin/bash
# API Connectivity Test Script

echo "🔗 Testing API Connectivity"

# Test Ollama (local AI)
echo "Testing Ollama..."
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not accessible"
fi

# Test Neo4j (if running)
echo "Testing Neo4j..."
if curl -s http://localhost:7474 >/dev/null 2>&1; then
    echo "✅ Neo4j browser is accessible"
else
    echo "❌ Neo4j browser is not accessible"
fi

# Test PostgreSQL (if running)
echo "Testing PostgreSQL..."
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not accessible"
fi

echo "📊 API connectivity test complete"
