#!/bin/bash

# Pre-workflow Validation Hook
# Validates workflow execution prerequisites

set -e

echo "🔍 Running pre-workflow validation..."

# Get workflow information from environment
WORKFLOW_ID="${TEMPORAL_WORKFLOW_ID}"
WORKFLOW_TYPE="${TEMPORAL_WORKFLOW_TYPE}"
INPUT_DATA="${TEMPORAL_WORKFLOW_INPUT}"

echo "Workflow ID: $WORKFLOW_ID"
echo "Workflow Type: $WORKFLOW_TYPE"

# Validate environment
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not configured"
    exit 1
fi

if [ -z "$REDIS_URL" ]; then
    echo "❌ REDIS_URL not configured"
    exit 1
fi

# Validate workflow-specific requirements
case "$WORKFLOW_TYPE" in
    "project-creation-workflow")
        # Validate project creation prerequisites
        if ! echo "$INPUT_DATA" | jq -e '.projectId and .agencyId and .clientId' >/dev/null; then
            echo "❌ Invalid project creation input: missing required fields"
            exit 1
        fi

        # Check if project already exists
        PROJECT_ID=$(echo "$INPUT_DATA" | jq -r '.projectId')
        if curl -s "http://localhost:3000/api/projects/$PROJECT_ID" | jq -e '.id' >/dev/null 2>&1; then
            echo "❌ Project $PROJECT_ID already exists"
            exit 1
        fi
        ;;

    "ai-model-training-workflow")
        # Validate AI training prerequisites
        if ! echo "$INPUT_DATA" | jq -e '.modelType and .datasetId' >/dev/null; then
            echo "❌ Invalid AI training input: missing required fields"
            exit 1
        fi

        # Check dataset availability
        DATASET_ID=$(echo "$INPUT_DATA" | jq -r '.datasetId')
        if ! curl -s "http://localhost:3000/api/datasets/$DATASET_ID" | jq -e '.id' >/dev/null 2>&1; then
            echo "❌ Dataset $DATASET_ID not found"
            exit 1
        fi
        ;;

    "user-onboarding-workflow")
        # Validate user onboarding prerequisites
        if ! echo "$INPUT_DATA" | jq -e '.userId and .email' >/dev/null; then
            echo "❌ Invalid user onboarding input: missing required fields"
            exit 1
        fi
        ;;
esac

# Check system resources
MEMORY_USAGE=$(ps aux --no-headers -o pmem | awk '{sum+=$1} END {print sum}')
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "⚠️ High memory usage detected: ${MEMORY_USAGE}%"
    # Could implement circuit breaker logic here
fi

# Validate external service availability
echo "🔍 Checking external service availability..."

# Check database connectivity
if ! timeout 5 bash -c "</dev/tcp/localhost/5432" 2>/dev/null; then
    echo "❌ PostgreSQL not accessible"
    exit 1
fi

# Check Redis connectivity
if ! timeout 5 bash -c "</dev/tcp/localhost/6379" 2>/dev/null; then
    echo "❌ Redis not accessible"
    exit 1
fi

# Check Neo4j connectivity (if required)
if [[ "$WORKFLOW_TYPE" == *"ai"* ]] || [[ "$WORKFLOW_TYPE" == *"graph"* ]]; then
    if ! timeout 5 bash -c "</dev/tcp/localhost/7687" 2>/dev/null; then
        echo "❌ Neo4j not accessible"
        exit 1
    fi
fi

echo "✅ Pre-workflow validation passed"
exit 0