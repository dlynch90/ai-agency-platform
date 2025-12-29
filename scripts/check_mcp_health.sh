#!/bin/bash

# Check health of all MCP servers

echo "🏥 Checking MCP Server Health..."

SERVERS=(
    "ollama:http://localhost:11434/api/tags"
    "redis:redis-cli ping"
    "neo4j:nc -z localhost 7687"
    "qdrant:http://localhost:6333/health"
)

for server in "${SERVERS[@]}"; do
    NAME=$(echo $server | cut -d: -f1)
    CHECK=$(echo $server | cut -d: -f2-)

    echo -n "Checking $NAME... "

    if [[ $CHECK == http* ]]; then
        if curl -s "$CHECK" > /dev/null 2>&1; then
            echo "✅ OK"
        else
            echo "❌ FAIL"
        fi
    elif [[ $CHECK == redis-cli* ]]; then
        if eval "$CHECK" 2>/dev/null | grep -q "PONG"; then
            echo "✅ OK"
        else
            echo "❌ FAIL"
        fi
    elif [[ $CHECK == nc* ]]; then
        if eval "$CHECK" 2>/dev/null; then
            echo "✅ OK"
        else
            echo "❌ FAIL"
        fi
    fi
done

echo "🏥 MCP health check completed"
