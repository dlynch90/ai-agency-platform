#!/bin/bash
set -e

echo "=== Autonomous System Startup ==="
echo "Date: $(date)"

# 1. Prerequisite Check
echo "--- Checking Prerequisites ---"
command -v docker >/dev/null 2>&1 || { echo >&2 "Docker is not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is not installed."; exit 1; }
command -v pixi >/dev/null 2>&1 || { echo >&2 "Pixi is not installed."; exit 1; }
echo "All prerequisites met."

# 2. Start Infrastructure
echo "--- Starting Infrastructure ---"
docker compose -f infra/docker-compose.services.yml up -d
echo "Infrastructure started. Waiting for health checks..."
# Simple sleep for now, ideally wait-for-it scripts
sleep 10

# 3. Start Temporal/Event-Driven System
echo "--- Starting Event-Driven System ---"
# Assuming 'npm run start:worker' or similar exists, otherwise placeholder
if grep -q "start:worker" package.json; then
    npm run start:worker &
    echo "Temporal worker started in background."
else
    echo "No 'start:worker' script found in package.json. Skipping."
fi

# 4. Start API/Services
echo "--- Starting Services ---"
# Assuming 'pixi run start' or 'npm start'
if [ -f "pixi.toml" ]; then
    echo "Starting Pixi environment..."
    pixi run start &
elif [ -f "package.json" ]; then
    echo "Starting Node.js environment..."
    npm start &
fi

echo "=== System Autonomously Started ==="
