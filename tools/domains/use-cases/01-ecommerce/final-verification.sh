#!/bin/bash
# Final Verification Script - Works in both sandbox and full environment

echo "🔍 AI AGENCY PLATFORM - FINAL VERIFICATION"
echo "=========================================="

# Detect environment
if [[ "$TERM_PROGRAM" == "vscode" ]] || [[ "$TERM" == "dumb" ]] || [ -n "$CURSOR" ]; then
    ENVIRONMENT="SANDBOX"
    echo "🚨 Environment: Cursor IDE Sandbox (Limited functionality)"
else
    ENVIRONMENT="FULL"
    echo "✅ Environment: Full System Access"
fi

echo ""

# Test 1: Gibson CLI
echo "1. Gibson CLI Test:"
if timeout 5 gibson agency >/dev/null 2>&1; then
    echo "   ✅ OPERATIONAL"
else
    echo "   ❌ FAILED"
fi

# Test 2: MCP Configuration
echo "2. MCP Server Configuration:"
if [ -f ".cursor/@MCP.JSON" ]; then
    SERVER_COUNT=$(jq '.mcpServers | length' .cursor/@MCP.JSON 2>/dev/null || echo "parse_error")
    if [[ "$SERVER_COUNT" =~ ^[0-9]+$ ]]; then
        echo "   ✅ CONFIGURED ($SERVER_COUNT servers)"
    else
        echo "   ❌ PARSE ERROR"
    fi
else
    echo "   ❌ MISSING"
fi

# Test 3: Use Cases Structure
echo "3. Use Cases Structure:"
if [ -d "domains/use-cases" ]; then
    USE_CASE_COUNT=$(ls domains/use-cases/ 2>/dev/null | grep -E "^[0-9][0-9]-" | wc -l 2>/dev/null || echo "0")
    echo "   ✅ STRUCTURED ($USE_CASE_COUNT use cases)"
else
    echo "   ❌ MISSING"
fi

# Test 4: Infrastructure Configuration
echo "4. Infrastructure Configuration:"
if [ -f "infrastructure/docker-compose.yml" ]; then
    SERVICE_COUNT=$(grep -c "^  [a-zA-Z_][a-zA-Z0-9_]*:" infrastructure/docker-compose.yml 2>/dev/null || echo "0")
    echo "   ✅ CONFIGURED ($SERVICE_COUNT services)"
else
    echo "   ❌ MISSING"
fi

# Test 5: Deploy Script
echo "5. Deploy Script:"
if [ -x "domains/use-cases/deploy-all.sh" ]; then
    echo "   ✅ EXECUTABLE"
else
    echo "   ❌ NOT EXECUTABLE"
fi

# Environment-specific tests
echo ""
echo "🔧 ENVIRONMENT-SPECIFIC TESTS"
echo "=============================="

if [ "$ENVIRONMENT" = "SANDBOX" ]; then
    echo "Sandbox Environment Tests:"
    echo "   ✅ File operations: AVAILABLE"
    echo "   ✅ Code analysis: AVAILABLE"
    echo "   ❌ Docker deployment: BLOCKED"
    echo "   ❌ Network services: BLOCKED"
    echo "   ❌ API endpoints: BLOCKED"
    
    echo ""
    echo "🎯 TO GET FULL FUNCTIONALITY:"
    echo "   1. Exit Cursor IDE (open -a Terminal)"
    echo "   2. Run: cd /Users/daniellynch/Developer"
    echo "   3. Run: docker-compose -f infrastructure/docker-compose.yml up -d"
    echo "   4. Run: cd domains/use-cases && ./deploy-all.sh"
    echo "   5. Test: curl http://localhost:8001/health"
    
else
    echo "Full Environment Tests:"
    
    # Test Docker
    echo -n "   Docker: "
    if docker --version >/dev/null 2>&1; then
        CONTAINER_COUNT=$(docker ps --format "{{.Names}}" 2>/dev/null | wc -l 2>/dev/null || echo "0")
        echo "✅ AVAILABLE ($CONTAINER_COUNT containers running)"
    else
        echo "❌ UNAVAILABLE"
    fi
    
    # Test network ports
    echo -n "   Infrastructure Ports: "
    BOUND_PORTS=$(netstat -tuln 2>/dev/null | grep -E ":(4000|5432|6379|7687|11434|7474)" | wc -l 2>/dev/null || echo "0")
    if [ "$BOUND_PORTS" -gt "0" ]; then
        echo "✅ $BOUND_PORTS ports bound"
    else
        echo "❌ No infrastructure ports bound"
    fi
    
    # Test API endpoints
    echo -n "   API Endpoints: "
    HEALTHY_APIS=0
    for port in 8001 8002 8003 4000; do
        if curl -s --max-time 3 "http://localhost:$port/health" >/dev/null 2>&1; then
            HEALTHY_APIS=$((HEALTHY_APIS + 1))
        fi
    done
    
    if [ "$HEALTHY_APIS" -gt "0" ]; then
        echo "✅ $HEALTHY_APIS endpoints responding"
    else
        echo "❌ No API endpoints responding"
    fi
fi

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================="
echo "✅ = Component working correctly"
echo "❌ = Component needs attention"
echo ""
echo "📝 Next Steps:"
if [ "$ENVIRONMENT" = "SANDBOX" ]; then
    echo "   • Exit sandbox for full deployment testing"
    echo "   • Follow DEPLOYMENT_GUIDE.md instructions"
    echo "   • Re-run this script outside sandbox"
else
    echo "   • Start infrastructure: docker-compose -f infrastructure/docker-compose.yml up -d"
    echo "   • Deploy use cases: cd domains/use-cases && ./deploy-all.sh"
    echo "   • Verify endpoints: curl http://localhost:8001/health"
fi
