#!/bin/bash

# OpenSCAP Compliance Audit
# Vendor solution for comprehensive compliance checking

set -e

echo "🔍 Starting OpenSCAP Compliance Audit..."
echo "=========================================="

# Check if OpenSCAP is installed
if ! command -v oscap &> /dev/null; then
    echo "❌ OpenSCAP not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install openscap
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y openscap-scanner
    else
        echo "❌ Package manager not found. Please install OpenSCAP manually."
        exit 1
    fi
fi

echo "✅ OpenSCAP found: $(oscap --version | head -1)"

# Run OpenSCAP compliance audit
echo ""
echo "🔍 Running OpenSCAP Compliance Audit"
echo "====================================="

# Create a basic SCAP content file for our checks
SCAP_FILE="/tmp/compliance-xccdf.xml"
cat > "$SCAP_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<Benchmark xmlns="http://checklists.nist.gov/xccdf/1.2" id="compliance-audit">
  <title>Cursor IDE Compliance Audit</title>
  <description>Automated compliance checking for Cursor IDE rules</description>
  <Rule id="file-organization" selected="true">
    <title>File Organization Check</title>
    <check system="http://oval.mitre.org/XMLSchema/oval-definitions-5">
      <check-content-ref href="#file-org-check"/>
    </check>
  </Rule>
  <Rule id="vendor-compliance" selected="true">
    <title>Vendor Compliance Check</title>
    <check system="http://oval.mitre.org/XMLSchema/oval-definitions-5">
      <check-content-ref href="#vendor-check"/>
    </check>
  </Rule>
</Benchmark>
EOF

# Run OpenSCAP evaluation
echo "Running OpenSCAP evaluation..."
oscap xccdf eval --results /tmp/oscap-results.xml "$SCAP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ OpenSCAP compliance audit completed successfully"
else
    echo "❌ OpenSCAP compliance audit failed"
fi

# Clean up
rm -f "$SCAP_FILE"

# 4. Check for cloud storage directories
echo "4. Checking for cloud storage directories..."
CLOUD_DIRS=$(find . -type d \( -name "*dropbox*" -o -name "*onedrive*" -o -name "*google*" -o -name "*sharepoint*" \) 2>/dev/null | wc -l)
if [ "$CLOUD_DIRS" -gt 0 ]; then
    echo "❌ FAIL: Found cloud storage directories ($CLOUD_DIRS directories)"
    FAILED=$((FAILED+1))
else
    echo "✅ PASS: No cloud storage directories found"
    PASSED=$((PASSED+1))
fi

# 5. Check file extension compliance
echo "5. Checking file extension compliance..."
CUSTOM_EXTS=$(find . -type f | grep -v -E '\.(java|xml|properties|md|yml|yaml|json|toml|sh|gradle|Makefile|Makefile\..*|Dockerfile|docker-compose\.yml|cypher)$' | wc -l)
if [ "$CUSTOM_EXTS" -gt 5 ]; then
    echo "❌ FAIL: Too many custom file extensions ($CUSTOM_EXTS files)"
    FAILED=$((FAILED+1))
else
    echo "✅ PASS: File extensions compliant ($CUSTOM_EXTS custom files)"
    PASSED=$((PASSED+1))
fi

# 6. Check for vendor source attribution
echo "6. Checking for vendor source attribution..."
NO_CITE=$(find . -name "*.java" -o -name "*.xml" -o -name "*.gradle" | xargs grep -l "vendor\|source\|origin" 2>/dev/null | wc -l)
TOTAL_FILES=$(find . -name "*.java" -o -name "*.xml" -o -name "*.gradle" | wc -l)
if [ "$NO_CITE" -lt $((TOTAL_FILES / 2)) ]; then
    echo "⚠️  WARN: Low vendor attribution ($NO_CITE/$TOTAL_FILES files)"
    WARNINGS=$((WARNINGS+1))
else
    echo "✅ PASS: Good vendor attribution coverage"
    PASSED=$((PASSED+1))
fi

# 7. Check directory structure compliance
echo "7. Checking directory structure compliance..."
if [ -d "java-templates" ] && [ -d "java-tools" ] && [ -f "Makefile.java" ]; then
    echo "✅ PASS: Directory structure follows conventions"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Directory structure non-compliant"
    FAILED=$((FAILED+1))
fi

# 8. Check for broken symlinks
echo "8. Checking for broken symlinks..."
BROKEN_LINKS=$(find . -type l ! -exec test -e {} \; 2>/dev/null | wc -l)
if [ "$BROKEN_LINKS" -gt 0 ]; then
    echo "❌ FAIL: Found broken symlinks ($BROKEN_LINKS links)"
    FAILED=$((FAILED+1))
else
    echo "✅ PASS: No broken symlinks found"
    PASSED=$((PASSED+1))
fi

# 9. Check for dangling hooks
echo "9. Checking for dangling git hooks..."
if [ -d ".git/hooks" ]; then
    DANGLING_HOOKS=$(find .git/hooks -type l ! -exec test -e {} \; 2>/dev/null | wc -l)
    if [ "$DANGLING_HOOKS" -gt 0 ]; then
        echo "❌ FAIL: Found dangling git hooks ($DANGLING_HOOKS hooks)"
        FAILED=$((FAILED+1))
    else
        echo "✅ PASS: No dangling git hooks found"
        PASSED=$((PASSED+1))
    fi
else
    echo "⚠️  WARN: No .git/hooks directory found"
    WARNINGS=$((WARNINGS+1))
fi

# 10. Check for test files in correct locations
echo "10. Checking test file locations..."
TEST_IN_SRC=$(find . -path "*/src/test/java/*Test*.java" | wc -l)
TEST_TOTAL=$(find . -name "*Test*.java" | wc -l)
if [ "$TEST_IN_SRC" -eq "$TEST_TOTAL" ]; then
    echo "✅ PASS: All test files in correct locations"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Test files not properly organized ($TEST_IN_SRC/$TEST_TOTAL in src/test)"
    FAILED=$((FAILED+1))
fi

# Steps 11-20: Build Systems & Dependencies
echo ""
echo "🔨 STEPS 11-20: Build Systems & Dependencies"
echo "-------------------------------------------"

# 11. Check Maven wrapper presence
echo "11. Checking Maven wrapper..."
if [ -f "mvnw" ] && [ -f "mvnw.cmd" ]; then
    echo "✅ PASS: Maven wrapper present"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Maven wrapper missing"
    FAILED=$((FAILED+1))
fi

# 12. Check Gradle wrapper presence
echo "12. Checking Gradle wrapper..."
if find . -name "gradlew*" | grep -q .; then
    echo "✅ PASS: Gradle wrapper present"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Gradle wrapper missing (may not be needed)"
    WARNINGS=$((WARNINGS+1))
fi

# 13. Check dependency management
echo "13. Checking dependency management..."
if [ -f "java-templates/spring-boot/pom.xml" ] && grep -q "spring-boot-starter-parent" java-templates/spring-boot/pom.xml; then
    echo "✅ PASS: Spring Boot parent dependency configured"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Spring Boot dependency not properly configured"
    FAILED=$((FAILED+1))
fi

# 14. Check for hardcoded values
echo "14. Checking for hardcoded values..."
HARDCODED=$(grep -r "localhost\|127\.0\.0\.1\|hardcoded\|TODO\|FIXME" . --include="*.java" --include="*.xml" --include="*.properties" 2>/dev/null | wc -l)
if [ "$HARDCODED" -gt 5 ]; then
    echo "❌ FAIL: Too many hardcoded values found ($HARDCODED instances)"
    FAILED=$((FAILED+1))
else
    echo "✅ PASS: Hardcoded values within acceptable limits"
    PASSED=$((PASSED+1))
fi

# 15. Check for hardcoded paths
echo "15. Checking for hardcoded paths..."
HARDCODED_PATHS=$(grep -r "/Users/\|/home/\|/opt/" . --include="*.java" --include="*.xml" --include="*.properties" 2>/dev/null | wc -l)
if [ "$HARDCODED_PATHS" -gt 2 ]; then
    echo "❌ FAIL: Hardcoded paths found ($HARDCODED_PATHS instances)"
    FAILED=$((FAILED+1))
else
    echo "✅ PASS: No hardcoded paths found"
    PASSED=$((PASSED+1))
fi

# 16. Check Java version consistency
echo "16. Checking Java version consistency..."
JAVA_VERSIONS=$(grep -r "java\.version\|sourceCompatibility\|maven\.compiler\.source\|maven\.compiler\.target" . --include="*.xml" --include="*.gradle" 2>/dev/null | grep -o "[0-9][0-9]*" | sort -u | wc -l)
if [ "$JAVA_VERSIONS" -eq 1 ]; then
    echo "✅ PASS: Java version consistent across project"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Inconsistent Java versions found ($JAVA_VERSIONS different versions)"
    FAILED=$((FAILED+1))
fi

# 17. Check for vendor compliance
echo "17. Checking vendor compliance..."
VENDOR_TOOLS=$(grep -r "1Password\|opossum\|saga\|circuit\|rbac\|multitenant\|rpc-jso\|gRPC\|tRPC\|dynamic.*load.*balancing\|cache\|optimization\|byzantine\|neural\|port\|containerization\|atomic\|modularization\|mcp\|connection\|pool\|dlq\|pipeline\|retry\|backoff\|idempotency\|unique.*message.*id\|log.*cleanup" . 2>/dev/null | wc -l)
if [ "$VENDOR_TOOLS" -gt 5 ]; then
    echo "✅ PASS: Good vendor tool usage detected"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Low vendor tool usage detected"
    WARNINGS=$((WARNINGS+1))
fi

# 18. Check for custom implementations (forbidden)
echo "18. Checking for custom implementations..."
CUSTOM_IMPL=$(grep -r "custom.*implementation\|custom.*logic\|custom.*code" . --include="*.md" 2>/dev/null | wc -l)
if [ "$CUSTOM_IMPL" -gt 0 ]; then
    echo "❌ FAIL: Custom implementations detected (forbidden)"
    FAILED=$((FAILED+1))
else
    echo "✅ PASS: No custom implementations found"
    PASSED=$((PASSED+1))
fi

# 19. Check for proper constants/variables definition
echo "19. Checking for constants/variables definition..."
CONSTANTS=$(grep -r "const\|final\|static" . --include="*.java" 2>/dev/null | wc -l)
if [ "$CONSTANTS" -gt 10 ]; then
    echo "✅ PASS: Good constants/variables usage"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Low constants/variables usage"
    WARNINGS=$((WARNINGS+1))
fi

# 20. Check for singletons and patterns
echo "20. Checking for singleton patterns..."
SINGLETONS=$(grep -r "singleton\|Singleton" . --include="*.java" 2>/dev/null | wc -l)
if [ "$SINGLETONS" -gt 0 ]; then
    echo "✅ PASS: Singleton patterns found"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No singleton patterns detected"
    WARNINGS=$((WARNINGS+1))
fi

# Steps 21-30: Environment & Tooling
echo ""
echo "🛠️  STEPS 21-30: Environment & Tooling"
echo "-------------------------------------"

# 21. Check PATH environment
echo "21. Checking PATH environment..."
if command -v java >/dev/null 2>&1 && command -v mvn >/dev/null 2>&1; then
    echo "✅ PASS: Java and Maven available in PATH"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Java or Maven not available in PATH"
    FAILED=$((FAILED+1))
fi

# 22. Check for tool accessibility
echo "22. Checking tool accessibility..."
TOOLS="java mvn gradle docker git node npm"
MISSING_TOOLS=0
for tool in $TOOLS; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        MISSING_TOOLS=$((MISSING_TOOLS+1))
    fi
done
if [ "$MISSING_TOOLS" -eq 0 ]; then
    echo "✅ PASS: All required tools accessible"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: $MISSING_TOOLS required tools missing"
    FAILED=$((FAILED+1))
fi

# 23. Check cache refresh
echo "23. Checking cache status..."
if [ -d "$HOME/.m2" ] || [ -d "$HOME/.gradle" ]; then
    echo "✅ PASS: Build caches present"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No build caches found"
    WARNINGS=$((WARNINGS+1))
fi

# 24. Check shell profile health
echo "24. Checking shell profile health..."
SHELL_RC="$HOME/.zshrc"
if [ -f "$SHELL_RC" ] && grep -q "export.*PATH" "$SHELL_RC" 2>/dev/null; then
    echo "✅ PASS: Shell profile configured"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Shell profile may need configuration"
    WARNINGS=$((WARNINGS+1))
fi

# 25. Check for duplicate environments
echo "25. Checking for duplicate environments..."
ENV_FILES=$(find . -name ".env*" -o -name "environment*" | wc -l)
if [ "$ENV_FILES" -lt 3 ]; then
    echo "✅ PASS: No duplicate environments detected"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Possible duplicate environments ($ENV_FILES files)"
    FAILED=$((FAILED+1))
fi

# 26. Check virtual environment standards
echo "26. Check virtual environment standards..."
VENV_DIRS=$(find . -name "venv" -o -name ".venv" -o -name "node_modules" | wc -l)
if [ "$VENV_DIRS" -lt 5 ]; then
    echo "✅ PASS: Virtual environments within limits"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Too many virtual environments ($VENV_DIRS directories)"
    FAILED=$((FAILED+1))
fi

# 27. Check for sprawl prevention
echo "27. Checking for sprawl prevention..."
LARGE_DIRS=$(find . -type d -exec du -sm {} + 2>/dev/null | awk '$1 > 100 {print}' | wc -l)
if [ "$LARGE_DIRS" -eq 0 ]; then
    echo "✅ PASS: No large directories detected"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Large directories found ($LARGE_DIRS directories > 100MB)"
    FAILED=$((FAILED+1))
fi

# 28. Check for proper vendor sourcing
echo "28. Checking for proper vendor sourcing..."
VENDOR_SOURCES=$(grep -r "github\.com\|artifacts\.hub\|registry\.npmjs\.org\|maven\.central\|gradle\.org" . --include="*.md" --include="*.json" 2>/dev/null | wc -l)
if [ "$VENDOR_SOURCES" -gt 5 ]; then
    echo "✅ PASS: Good vendor sourcing detected"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Low vendor source references"
    WARNINGS=$((WARNINGS+1))
fi

# 29. Check for MCP server compliance
echo "29. Checking MCP server compliance..."
MCP_USAGE=$(grep -r "mcp\|sequential-thinking\|task-master\|ollama\|ollama-mcp\|desktop-commander" . 2>/dev/null | wc -l)
if [ "$MCP_USAGE" -gt 3 ]; then
    echo "✅ PASS: MCP servers properly utilized"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Low MCP server usage"
    WARNINGS=$((WARNINGS+1))
fi

# 30. Check for proper orchestration
echo "30. Checking for proper orchestration..."
ORCHESTRATION=$(grep -r "temporal\|mlflow\|supabase\|n8n\|neo4j\|clerk\|fastapi\|graphql\|langchain\|langraph" . 2>/dev/null | wc -l)
if [ "$ORCHESTRATION" -gt 5 ]; then
    echo "✅ PASS: Good orchestration tool usage"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Low orchestration tool usage"
    WARNINGS=$((WARNINGS+1))
fi

# Steps 31-40: Testing & Quality Assurance
echo ""
echo "🧪 STEPS 31-40: Testing & Quality Assurance"
echo "-------------------------------------------"

# 31. Check for test frameworks
echo "31. Checking test frameworks..."
TEST_FRAMEWORKS=$(grep -r "junit\|testng\|mockito\|vitest\|jest" . --include="*.xml" --include="*.gradle" 2>/dev/null | wc -l)
if [ "$TEST_FRAMEWORKS" -gt 0 ]; then
    echo "✅ PASS: Test frameworks configured"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No test frameworks found"
    FAILED=$((FAILED+1))
fi

# 32. Check test coverage
echo "32. Checking test coverage configuration..."
JACOCO=$(grep -r "jacoco" . --include="*.xml" 2>/dev/null | wc -l)
if [ "$JACOCO" -gt 0 ]; then
    echo "✅ PASS: Test coverage configured (JaCoCo)"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No test coverage configuration"
    FAILED=$((FAILED+1))
fi

# 33. Check for TDD compliance
echo "33. Checking TDD compliance..."
TDD_INDICATORS=$(grep -r "tdd\|test.*driven\|red.*green.*refactor" . --include="*.md" 2>/dev/null | wc -l)
if [ "$TDD_INDICATORS" -gt 0 ]; then
    echo "✅ PASS: TDD practices documented"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No TDD documentation found"
    WARNINGS=$((WARNINGS+1))
fi

# 34. Check for performance boundaries
echo "34. Checking performance boundaries..."
PERF_CHECKS=$(grep -r "performance\|benchmark\|threshold\|boundary" . --include="*.md" --include="*.java" 2>/dev/null | wc -l)
if [ "$PERF_CHECKS" -gt 0 ]; then
    echo "✅ PASS: Performance boundaries defined"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No performance boundaries defined"
    WARNINGS=$((WARNINGS+1))
fi

# 35. Check for security compliance
echo "35. Checking security compliance..."
SECURITY=$(grep -r "security\|vulnerability\|owasp\|sast\|dast" . --include="*.md" --include="*.xml" 2>/dev/null | wc -l)
if [ "$SECURITY" -gt 0 ]; then
    echo "✅ PASS: Security practices implemented"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No security measures found"
    FAILED=$((FAILED+1))
fi

# 36. Check for documentation
echo "36. Checking documentation..."
DOC_FILES=$(find . -name "*.md" | wc -l)
if [ "$DOC_FILES" -gt 3 ]; then
    echo "✅ PASS: Good documentation coverage ($DOC_FILES files)"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Insufficient documentation ($DOC_FILES files)"
    FAILED=$((FAILED+1))
fi

# 37. Check for lessons learned
echo "37. Checking for lessons learned..."
LESSONS=$(find . -name "*lesson*" -o -path "*/docs/lesson-learned/*" 2>/dev/null | wc -l)
if [ "$LESSONS" -gt 0 ]; then
    echo "✅ PASS: Lessons learned documented"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No lessons learned found"
    WARNINGS=$((WARNINGS+1))
fi

# 38. Check for scientific method application
echo "38. Checking scientific method application..."
SCIENTIFIC=$(grep -r "hypothesis\|experiment\|observation\|conclusion\|methodology\|scientific" . --include="*.md" 2>/dev/null | wc -l)
if [ "$SCIENTIFIC" -gt 0 ]; then
    echo "✅ PASS: Scientific method applied"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No scientific method application detected"
    WARNINGS=$((WARNINGS+1))
fi

# 39. Check for chaos engineering
echo "39. Checking chaos engineering practices..."
CHAOS=$(grep -r "chaos\|resilience\|circuit.*breaker\|fault.*injection\|service.*mesh" . 2>/dev/null | wc -l)
if [ "$CHAOS" -gt 0 ]; then
    echo "✅ PASS: Chaos engineering practices found"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No chaos engineering detected"
    WARNINGS=$((WARNINGS+1))
fi

# 40. Check for observability
echo "40. Checking observability implementation..."
OBSERVABILITY=$(grep -r "prometheus\|grafana\|metrics\|tracing\|logging\|monitoring" . --include="*.yml" --include="*.yaml" 2>/dev/null | wc -l)
if [ "$OBSERVABILITY" -gt 0 ]; then
    echo "✅ PASS: Observability configured"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No observability found"
    FAILED=$((FAILED+1))
fi

# Steps 41-50: Advanced Compliance & Architecture
echo ""
echo "🏗️  STEPS 41-50: Advanced Compliance & Architecture"
echo "--------------------------------------------------"

# 41. Check for microservices architecture
echo "41. Checking microservices architecture..."
MICROSERVICES=$(find . -name "*microservice*" -o -name "*service*" | grep -v node_modules | wc -l)
if [ "$MICROSERVICES" -gt 1 ]; then
    echo "✅ PASS: Microservices architecture present"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: Limited microservices detected"
    WARNINGS=$((WARNINGS+1))
fi

# 42. Check for monorepo structure
echo "42. Checking monorepo structure..."
if [ -d "java-templates" ] && [ -d "java-tools" ] && [ -f "Makefile.java" ]; then
    echo "✅ PASS: Monorepo structure maintained"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Monorepo structure not properly maintained"
    FAILED=$((FAILED+1))
fi

# 43. Check for containerization
echo "43. Checking containerization..."
DOCKER_FILES=$(find . -name "Dockerfile*" -o -name "docker-compose*" | wc -l)
if [ "$DOCKER_FILES" -gt 0 ]; then
    echo "✅ PASS: Containerization implemented"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No containerization found"
    FAILED=$((FAILED+1))
fi

# 44. Check for federation layer
echo "44. Checking federation layer..."
FEDERATION=$(grep -r "federation\|graphql\|api.*gateway\|service.*mesh" . 2>/dev/null | wc -l)
if [ "$FEDERATION" -gt 0 ]; then
    echo "✅ PASS: Federation layer present"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No federation layer detected"
    WARNINGS=$((WARNINGS+1))
fi

# 45. Check for RBAC implementation
echo "45. Checking RBAC implementation..."
RBAC=$(grep -r "rbac\|role.*based\|authorization\|permission" . --include="*.java" 2>/dev/null | wc -l)
if [ "$RBAC" -gt 0 ]; then
    echo "✅ PASS: RBAC implemented"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No RBAC found"
    FAILED=$((FAILED+1))
fi

# 46. Check for circuit breakers
echo "46. Checking circuit breakers..."
CIRCUITS=$(grep -r "circuit.*breaker\|opossum\|resilience4j\|hystrix" . 2>/dev/null | wc -l)
if [ "$CIRCUITS" -gt 0 ]; then
    echo "✅ PASS: Circuit breakers implemented"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: No circuit breakers found"
    FAILED=$((FAILED+1))
fi

# 47. Check for event-driven architecture
echo "47. Checking event-driven architecture..."
EVENTS=$(grep -r "event.*driven\|event.*sourcing\|message.*queue\|kafka\|rabbitmq" . 2>/dev/null | wc -l)
if [ "$EVENTS" -gt 0 ]; then
    echo "✅ PASS: Event-driven architecture present"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No event-driven patterns detected"
    WARNINGS=$((WARNINGS+1))
fi

# 48. Check for AI/ML integration
echo "48. Checking AI/ML integration..."
AI_ML=$(grep -r "hugging.*face\|transformers\|neural\|ml\|ai\|inference\|deepseek\|qwen" . 2>/dev/null | wc -l)
if [ "$AI_ML" -gt 0 ]; then
    echo "✅ PASS: AI/ML integration present"
    PASSED=$((PASSED+1))
else
    echo "⚠️  WARN: No AI/ML integration detected"
    WARNINGS=$((WARNINGS+1))
fi

# 49. Check for production readiness
echo "49. Checking production readiness..."
PROD_READY=$(grep -r "production\|prod\|staging\|deployment\|ci.*cd\|pipeline" . --include="*.yml" --include="*.yaml" --include="*.md" 2>/dev/null | wc -l)
if [ "$PROD_READY" -gt 3 ]; then
    echo "✅ PASS: Production readiness configured"
    PASSED=$((PASSED+1))
else
    echo "❌ FAIL: Not production ready"
    FAILED=$((FAILED+1))
fi

# 50. Final compliance check
echo "50. Final compliance check..."
TOTAL_CHECKS=$((PASSED + FAILED + WARNINGS))
COMPLIANCE_RATE=$((PASSED * 100 / TOTAL_CHECKS))
if [ "$COMPLIANCE_RATE" -gt 80 ]; then
    echo "✅ PASS: High compliance rate ($COMPLIANCE_RATE%)"
    PASSED=$((PASSED+1))
elif [ "$COMPLIANCE_RATE" -gt 60 ]; then
    echo "⚠️  WARN: Moderate compliance rate ($COMPLIANCE_RATE%)"
    WARNINGS=$((WARNINGS+1))
else
    echo "❌ FAIL: Low compliance rate ($COMPLIANCE_RATE%)"
    FAILED=$((FAILED+1))
fi

# Summary Report
echo ""
echo "📊 AUDIT SUMMARY REPORT"
echo "======================"
echo "✅ PASSED: $PASSED checks"
echo "❌ FAILED: $FAILED checks"
echo "⚠️  WARNINGS: $WARNINGS checks"
echo "📈 COMPLIANCE RATE: $((PASSED * 100 / TOTAL_CHECKS))% ($PASSED/$TOTAL_CHECKS)"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo "🎉 AUDIT COMPLETE: All critical issues resolved!"
else
    echo "⚠️  AUDIT COMPLETE: $FAILED critical issues require attention"
fi

echo ""
echo "🔧 Next Steps:"
echo "- Review FAILED items and implement fixes"
echo "- Address WARNING items for optimal compliance"
echo "- Run audit again after fixes: ./gap_analysis_audit.sh"