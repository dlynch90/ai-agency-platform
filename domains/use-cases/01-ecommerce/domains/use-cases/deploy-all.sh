#!/bin/bash
# Deploy all 20 use cases for AI agency demonstration

echo "🚀 DEPLOYING ALL 20 AI AGENCY USE CASES"
echo "======================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Deploy use cases in order
for dir in "$SCRIPT_DIR"/*/; do
    if [ -d "$dir" ] && [[ "$(basename "$dir")" =~ ^[0-9][0-9]- ]]; then
        use_case_name=$(basename "$dir")
        echo "Deploying $use_case_name..."
        
        cd "$dir"
        
        # Try to start the service
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d --build 2>/dev/null || echo "Docker compose failed for $use_case_name"
        elif [ -f "main.py" ]; then
            # Start Python service directly
            python3 main.py &
            echo "Started Python service for $use_case_name (PID: $!)"
        fi
        
        cd "$SCRIPT_DIR"
        sleep 2
    fi
done

echo ""
echo "🎯 DEPLOYMENT COMPLETE"
echo "======================"
echo "Use cases deployed. Access them at:"
for i in {1..20}; do
    port=$((8000 + i))
    echo "  http://localhost:$port/ (Use Case $(printf "%02d" $i))"
done
echo ""
echo "Health checks available at /health endpoint"
