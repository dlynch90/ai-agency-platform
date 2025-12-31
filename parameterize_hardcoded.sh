#!/bin/bash
# Global Parameterization Script - Replace hardcoded values with chezmoi templates

echo "🔧 Starting global parameterization..."

# Replace hardcoded localhost URLs with parameterized values
find . -name "*.js" -o -name "*.py" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" | \
grep -v node_modules | grep -v __pycache__ | xargs -I {} bash -c '
    file="$1"
    # Skip if file contains template syntax already
    if grep -q "{{" "$file"; then
        echo "⏭️  Skipping $file (already templated)"
        exit 0
    fi
    
    echo "🔄 Processing $file"
    
    # Database ports
    sed -i "" "s/5434/{{ .postgres_port }}/g" "$file" 2>/dev/null || true
    sed -i "" "s/6380/{{ .redis_port }}/g" "$file" 2>/dev/null || true  
    sed -i "" "s/7234/{{ .temporal_port }}/g" "$file" 2>/dev/null || true
    
    # Service URLs - replace localhost with parameterized hosts
    sed -i "" "s|http://localhost:5432|{{ .postgres_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:6379|{{ .redis_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:7687|{{ .neo4j_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:6333|{{ .qdrant_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:8000|{{ .kong_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:7233|{{ .temporal_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:3000|{{ .grafana_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:9090|{{ .prometheus_url }}|g" "$file" 2>/dev/null || true
    sed -i "" "s|http://localhost:11434|{{ .ollama_url }}|g" "$file" 2>/dev/null || true
    
    echo "✅ Processed $file"
' -- {}

echo "🎉 Global parameterization complete!"
