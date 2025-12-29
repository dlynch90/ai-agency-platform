#!/bin/bash

# Deep Infinitesimal Gap Analysis
# Infinitesimal-level analysis of warning items and compliance gaps

set -e

echo "🔬 Starting Deep Infinitesimal Gap Analysis..."
echo "=============================================="

# Initialize analysis counters
ANALYZED=0
DEEP_ISSUES=0
MICRO_ISSUES=0
NANO_ISSUES=0

# Function to analyze vendor attribution in depth
analyze_vendor_attribution() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Vendor Attribution"
    echo "-----------------------------------"

    JAVA_FILES=$(find . -name "*.java" | wc -l)
    echo "Total Java files: $JAVA_FILES"

    # Check for vendor mentions in comments and documentation
    VENDOR_COMMENTS=$(grep -r "vendor\|source\|origin\|Spring\|Oracle\|Eclipse\|Apache\|OWASP" . --include="*.java" --include="*.md" 2>/dev/null | wc -l)
    echo "Vendor mentions in comments/docs: $VENDOR_COMMENTS"

    # Check for import statements from vendor packages
    VENDOR_IMPORTS=$(grep -r "^import org\.springframework\|^import io\.jsonwebtoken\|^import org\.owasp" . --include="*.java" 2>/dev/null | wc -l)
    echo "Vendor package imports: $VENDOR_IMPORTS"

    # Check for @author tags
    AUTHOR_TAGS=$(grep -r "@author" . --include="*.java" 2>/dev/null | wc -l)
    echo "Author tags: $AUTHOR_TAGS"

    # Check for license headers
    LICENSE_HEADERS=$(grep -r "Copyright\|License\|Apache License" . --include="*.java" 2>/dev/null | wc -l)
    echo "License headers: $LICENSE_HEADERS"

    ATTRIBUTION_SCORE=$((VENDOR_COMMENTS + VENDOR_IMPORTS + AUTHOR_TAGS + LICENSE_HEADERS))
    echo "Total attribution score: $ATTRIBUTION_SCORE"

    if [ "$ATTRIBUTION_SCORE" -lt 50 ]; then
        echo "❌ CRITICAL: Extremely low vendor attribution (score: $ATTRIBUTION_SCORE)"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$ATTRIBUTION_SCORE" -lt 100 ]; then
        echo "⚠️  MODERATE: Low vendor attribution (score: $ATTRIBUTION_SCORE)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good vendor attribution (score: $ATTRIBUTION_SCORE)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze Git infrastructure in depth
analyze_git_infrastructure() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Git Infrastructure"
    echo "----------------------------------"

    if [ -d ".git" ]; then
        echo "✅ Git repository initialized"

        # Check hooks directory
        if [ -d ".git/hooks" ]; then
            HOOK_FILES=$(ls .git/hooks/*.sample 2>/dev/null | wc -l)
            ACTIVE_HOOKS=$(find .git/hooks -type f ! -name "*.sample" | wc -l)
            echo "Sample hooks: $HOOK_FILES, Active hooks: $ACTIVE_HOOKS"

            if [ "$ACTIVE_HOOKS" -eq 0 ]; then
                echo "❌ CRITICAL: No active Git hooks configured"
                DEEP_ISSUES=$((DEEP_ISSUES+1))
            fi
        else
            echo "❌ CRITICAL: Git hooks directory missing"
            DEEP_ISSUES=$((DEEP_ISSUES+1))
        fi

        # Check Git configuration
        GIT_CONFIG_ISSUES=0
        if ! git config user.name >/dev/null 2>&1; then
            echo "❌ MICRO: Git user.name not configured"
            MICRO_ISSUES=$((MICRO_ISSUES+1))
            GIT_CONFIG_ISSUES=$((GIT_CONFIG_ISSUES+1))
        fi

        if ! git config user.email >/dev/null 2>&1; then
            echo "❌ MICRO: Git user.email not configured"
            MICRO_ISSUES=$((MICRO_ISSUES+1))
            GIT_CONFIG_ISSUES=$((GIT_CONFIG_ISSUES+1))
        fi

        # Check for .gitignore
        if [ -f ".gitignore" ]; then
            IGNORED_PATTERNS=$(wc -l < .gitignore)
            echo "✅ .gitignore exists with $IGNORED_PATTERNS patterns"

            # Check for common patterns
            ESSENTIAL_PATTERNS=("*.class" "*.jar" ".gradle/" "node_modules/" ".idea/" "*.tmp")
            MISSING_PATTERNS=0
            for pattern in "${ESSENTIAL_PATTERNS[@]}"; do
                if ! grep -q "$pattern" .gitignore; then
                    MISSING_PATTERNS=$((MISSING_PATTERNS+1))
                fi
            done

            if [ "$MISSING_PATTERNS" -gt 0 ]; then
                echo "⚠️  MICRO: $MISSING_PATTERNS essential patterns missing from .gitignore"
                MICRO_ISSUES=$((MICRO_ISSUES+1))
            fi
        else
            echo "❌ CRITICAL: .gitignore file missing"
            DEEP_ISSUES=$((DEEP_ISSUES+1))
        fi

        # Check commit history
        COMMIT_COUNT=$(git log --oneline 2>/dev/null | wc -l)
        echo "Total commits: $COMMIT_COUNT"

        if [ "$COMMIT_COUNT" -eq 0 ]; then
            echo "⚠️  MICRO: No commits in repository"
            MICRO_ISSUES=$((MICRO_ISSUES+1))
        fi

    else
        echo "❌ CRITICAL: Not a Git repository"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze constants and variables usage in depth
analyze_constants_variables() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Constants & Variables Usage"
    echo "--------------------------------------------"

    JAVA_FILES=$(find . -name "*.java" | wc -l)
    echo "Analyzing $JAVA_FILES Java files..."

    # Count different types of constants/variables
    FINAL_VARS=$(grep -r "final " . --include="*.java" 2>/dev/null | wc -l)
    STATIC_VARS=$(grep -r "static " . --include="*.java" 2>/dev/null | grep -v "final static" | wc -l)
    CONSTANTS=$(grep -r "static final" . --include="*.java" 2>/dev/null | wc -l)
    ENUMS=$(grep -r "^enum " . --include="*.java" 2>/dev/null | wc -l)

    echo "Final variables: $FINAL_VARS"
    echo "Static variables: $STATIC_VARS"
    echo "Constants (static final): $CONSTANTS"
    echo "Enums: $ENUMS"

    TOTAL_CONSTANTS=$((FINAL_VARS + STATIC_VARS + CONSTANTS + ENUMS))
    AVERAGE_PER_FILE=$((TOTAL_CONSTANTS / JAVA_FILES))

    echo "Total constants/variables: $TOTAL_CONSTANTS"
    echo "Average per file: $AVERAGE_PER_FILE"

    if [ "$AVERAGE_PER_FILE" -lt 5 ]; then
        echo "❌ CRITICAL: Extremely low constants/variables usage (avg: $AVERAGE_PER_FILE per file)"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$AVERAGE_PER_FILE" -lt 10 ]; then
        echo "⚠️  MODERATE: Low constants/variables usage (avg: $AVERAGE_PER_FILE per file)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good constants/variables usage (avg: $AVERAGE_PER_FILE per file)"
    fi

    # Check for magic numbers
    MAGIC_NUMBERS=$(grep -r "[^a-zA-Z_][0-9][0-9]*[^a-zA-Z_0-9.]" . --include="*.java" 2>/dev/null | grep -v "final\|static\|import\|package" | wc -l)
    echo "Potential magic numbers: $MAGIC_NUMBERS"

    if [ "$MAGIC_NUMBERS" -gt 10 ]; then
        echo "⚠️  MICRO: High number of potential magic numbers ($MAGIC_NUMBERS)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze singleton patterns
analyze_singleton_patterns() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Singleton Patterns"
    echo "-----------------------------------"

    SINGLETON_INDICATORS=("Singleton" "getInstance" "INSTANCE" "EAGER_SINGLETON" "LAZY_SINGLETON")
    SINGLETON_COUNT=0

    for indicator in "${SINGLETON_INDICATORS[@]}"; do
        COUNT=$(grep -r "$indicator" . --include="*.java" 2>/dev/null | wc -l)
        echo "$indicator patterns: $COUNT"
        SINGLETON_COUNT=$((SINGLETON_COUNT + COUNT))
    done

    echo "Total singleton indicators: $SINGLETON_COUNT"

    # Check for proper singleton implementation patterns
    PROPER_SINGLETONS=$(grep -r "private static.*INSTANCE\|private static.*instance" . --include="*.java" 2>/dev/null | wc -l)
    echo "Proper singleton implementations: $PROPER_SINGLETONS"

    if [ "$SINGLETON_COUNT" -eq 0 ]; then
        echo "❌ CRITICAL: No singleton patterns detected"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$PROPER_SINGLETONS" -eq 0 ]; then
        echo "⚠️  MODERATE: Singleton patterns exist but may not be properly implemented"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Singleton patterns properly implemented"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze vendor source references
analyze_vendor_sources() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Vendor Source References"
    echo "-----------------------------------------"

    VENDOR_DOMAINS=("github.com" "mvnrepository.com" "maven.org" "gradle.org" "artifacts.hub" "registry.npmjs.org")
    VENDOR_REFS=0

    for domain in "${VENDOR_DOMAINS[@]}"; do
        COUNT=$(grep -r "$domain" . --include="*.md" --include="*.json" --include="*.yml" --include="*.yaml" 2>/dev/null | wc -l)
        echo "$domain references: $COUNT"
        VENDOR_REFS=$((VENDOR_REFS + COUNT))
    done

    echo "Total vendor source references: $VENDOR_REFS"

    # Check for specific vendor tools
    VENDOR_TOOLS=("Spring Boot" "Maven" "Gradle" "Docker" "PostgreSQL" "Redis" "Prometheus" "Grafana" "JWT" "OWASP")
    VENDOR_TOOL_REFS=0

    for tool in "${VENDOR_TOOLS[@]}"; do
        COUNT=$(grep -r "$tool" . --include="*.md" --include="*.json" 2>/dev/null | wc -l)
        VENDOR_TOOL_REFS=$((VENDOR_TOOL_REFS + COUNT))
    done

    echo "Vendor tool references: $VENDOR_TOOL_REFS"

    TOTAL_VENDOR_REFS=$((VENDOR_REFS + VENDOR_TOOL_REFS))
    echo "Total vendor references: $TOTAL_VENDOR_REFS"

    if [ "$TOTAL_VENDOR_REFS" -lt 20 ]; then
        echo "❌ CRITICAL: Extremely low vendor source references ($TOTAL_VENDOR_REFS)"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$TOTAL_VENDOR_REFS" -lt 50 ]; then
        echo "⚠️  MODERATE: Low vendor source references ($TOTAL_VENDOR_REFS)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good vendor source references ($TOTAL_VENDOR_REFS)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze orchestration tools
analyze_orchestration() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Orchestration Tools"
    echo "------------------------------------"

    ORCHESTRATION_TOOLS=("temporal" "mlflow" "supabase" "n8n" "neo4j" "clerk" "fastapi" "graphql" "langchain" "langraph" "kubernetes" "docker-compose")
    ORCHESTRATION_REFS=0

    for tool in "${ORCHESTRATION_TOOLS[@]}"; do
        COUNT=$(grep -r "$tool" . 2>/dev/null | wc -l)
        echo "$tool references: $COUNT"
        ORCHESTRATION_REFS=$((ORCHESTRATION_REFS + COUNT))
    done

    echo "Total orchestration tool references: $ORCHESTRATION_REFS"

    # Check for actual integration files
    INTEGRATION_FILES=0
    INTEGRATION_FILES=$((INTEGRATION_FILES + $(find . -name "*temporal*" -o -name "*mlflow*" -o -name "*supabase*" -o -name "*n8n*" -o -name "*neo4j*" 2>/dev/null | wc -l)))

    echo "Integration files found: $INTEGRATION_FILES"

    TOTAL_ORCHESTRATION=$((ORCHESTRATION_REFS + INTEGRATION_FILES))
    echo "Total orchestration score: $TOTAL_ORCHESTRATION"

    if [ "$TOTAL_ORCHESTRATION" -eq 0 ]; then
        echo "❌ CRITICAL: No orchestration tools detected"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$TOTAL_ORCHESTRATION" -lt 10 ]; then
        echo "⚠️  MODERATE: Limited orchestration tool usage ($TOTAL_ORCHESTRATION)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good orchestration tool integration ($TOTAL_ORCHESTRATION)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze TDD compliance
analyze_tdd_compliance() {
    echo ""
    echo "🔍 DEEP ANALYSIS: TDD Compliance"
    echo "-------------------------------"

    TDD_INDICATORS=("TDD" "Test Driven Development" "Red-Green-Refactor" "test.*first" "write.*test.*first")
    TDD_REFS=0

    for indicator in "${TDD_INDICATORS[@]}"; do
        COUNT=$(grep -r -i "$indicator" . --include="*.md" 2>/dev/null | wc -l)
        echo "$indicator references: $COUNT"
        TDD_REFS=$((TDD_REFS + COUNT))
    done

    echo "Total TDD references: $TDD_REFS"

    # Check for test files vs implementation files ratio
    TEST_FILES=$(find . -name "*Test.java" | wc -l)
    IMPL_FILES=$(find . -name "*.java" | grep -v "Test.java" | wc -l)

    echo "Test files: $TEST_FILES"
    echo "Implementation files: $IMPL_FILES"

    if [ "$IMPL_FILES" -gt 0 ]; then
        TEST_RATIO=$((TEST_FILES * 100 / IMPL_FILES))
        echo "Test to implementation ratio: $TEST_RATIO%"

        if [ "$TEST_RATIO" -lt 50 ]; then
            echo "⚠️  MICRO: Low test coverage ratio ($TEST_RATIO%)"
            MICRO_ISSUES=$((MICRO_ISSUES+1))
        fi
    fi

    if [ "$TDD_REFS" -eq 0 ]; then
        echo "❌ CRITICAL: No TDD documentation or practices detected"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$TDD_REFS" -lt 5 ]; then
        echo "⚠️  MODERATE: Limited TDD documentation ($TDD_REFS references)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good TDD compliance ($TDD_REFS references)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze lessons learned
analyze_lessons_learned() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Lessons Learned"
    echo "---------------------------------"

    LESSONS_INDICATORS=("lesson.*learned" "retrospective" "post.*mortem" "what.*went.*wrong" "improvement.*area")
    LESSONS_REFS=0

    for indicator in "${LESSONS_INDICATORS[@]}"; do
        COUNT=$(grep -r -i "$indicator" . --include="*.md" 2>/dev/null | wc -l)
        echo "$indicator references: $COUNT"
        LESSONS_REFS=$((LESSONS_REFS + COUNT))
    done

    echo "Total lessons learned references: $LESSONS_REFS"

    # Check for lessons learned directory structure
    if [ -d "docs/lessons-learned" ] || [ -d "docs/lesson-learned" ]; then
        LESSONS_FILES=$(find docs/lessons-learned docs/lesson-learned -name "*.md" 2>/dev/null | wc -l 2>/dev/null || echo 0)
        echo "Lessons learned files: $LESSONS_FILES"
    else
        LESSONS_FILES=0
        echo "Lessons learned directory: MISSING"
    fi

    TOTAL_LESSONS=$((LESSONS_REFS + LESSONS_FILES))
    echo "Total lessons learned score: $TOTAL_LESSONS"

    if [ "$TOTAL_LESSONS" -eq 0 ]; then
        echo "❌ CRITICAL: No lessons learned documentation"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$TOTAL_LESSONS" -lt 3 ]; then
        echo "⚠️  MODERATE: Limited lessons learned ($TOTAL_LESSONS items)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good lessons learned documentation ($TOTAL_LESSONS items)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze scientific method application
analyze_scientific_method() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Scientific Method Application"
    echo "----------------------------------------------"

    SCIENTIFIC_INDICATORS=("hypothesis" "experiment" "observation" "conclusion" "methodology" "scientific" "analyze" "measure" "validate" "verify")
    SCIENTIFIC_REFS=0

    for indicator in "${SCIENTIFIC_INDICATORS[@]}"; do
        COUNT=$(grep -r -i "$indicator" . --include="*.md" 2>/dev/null | wc -l)
        echo "$indicator references: $COUNT"
        SCIENTIFIC_REFS=$((SCIENTIFIC_REFS + COUNT))
    done

    echo "Total scientific method references: $SCIENTIFIC_REFS"

    # Check for experimental data or metrics
    METRICS_FILES=$(find . -name "*metric*" -o -name "*benchmark*" -o -name "*performance*" -o -name "*report*" | wc -l)
    echo "Metrics/benchmark files: $METRICS_FILES"

    # Check for data analysis
    DATA_ANALYSIS=$(grep -r -i "data.*analysis\|statistical\|correlation\|trend\|pattern" . --include="*.md" 2>/dev/null | wc -l)
    echo "Data analysis references: $DATA_ANALYSIS"

    TOTAL_SCIENTIFIC=$((SCIENTIFIC_REFS + METRICS_FILES + DATA_ANALYSIS))
    echo "Total scientific method score: $TOTAL_SCIENTIFIC"

    if [ "$TOTAL_SCIENTIFIC" -eq 0 ]; then
        echo "❌ CRITICAL: No scientific method application detected"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$TOTAL_SCIENTIFIC" -lt 10 ]; then
        echo "⚠️  MODERATE: Limited scientific method application ($TOTAL_SCIENTIFIC items)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good scientific method application ($TOTAL_SCIENTIFIC items)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Function to analyze microservices architecture
analyze_microservices() {
    echo ""
    echo "🔍 DEEP ANALYSIS: Microservices Architecture"
    echo "-------------------------------------------"

    MICROSERVICES_INDICATORS=("microservice" "service.*discovery" "api.*gateway" "circuit.*breaker" "service.*mesh" "distributed")
    MICROSERVICES_REFS=0

    for indicator in "${MICROSERVICES_INDICATORS[@]}"; do
        COUNT=$(grep -r -i "$indicator" . 2>/dev/null | wc -l)
        echo "$indicator references: $COUNT"
        MICROSERVICES_REFS=$((MICROSERVICES_REFS + COUNT))
    done

    echo "Total microservices references: $MICROSERVICES_REFS"

    # Check for service separation
    SERVICE_DIRS=$(find . -type d -name "*service*" | wc -l)
    API_ENDPOINTS=$(grep -r "@RestController\|@Controller" . --include="*.java" 2>/dev/null | wc -l)

    echo "Service directories: $SERVICE_DIRS"
    echo "API endpoints: $API_ENDPOINTS"

    TOTAL_MICROSERVICES=$((MICROSERVICES_REFS + SERVICE_DIRS + API_ENDPOINTS))
    echo "Total microservices score: $TOTAL_MICROSERVICES"

    if [ "$TOTAL_MICROSERVICES" -lt 5 ]; then
        echo "❌ CRITICAL: Extremely limited microservices architecture ($TOTAL_MICROSERVICES indicators)"
        DEEP_ISSUES=$((DEEP_ISSUES+1))
    elif [ "$TOTAL_MICROSERVICES" -lt 15 ]; then
        echo "⚠️  MODERATE: Limited microservices architecture ($TOTAL_MICROSERVICES indicators)"
        MICRO_ISSUES=$((MICRO_ISSUES+1))
    else
        echo "✅ ACCEPTABLE: Good microservices architecture ($TOTAL_MICROSERVICES indicators)"
    fi

    ANALYZED=$((ANALYZED+1))
}

# Run all deep analyses
analyze_vendor_attribution
analyze_git_infrastructure
analyze_constants_variables
analyze_singleton_patterns
analyze_vendor_sources
analyze_orchestration
analyze_tdd_compliance
analyze_lessons_learned
analyze_scientific_method
analyze_microservices

# Final infinitesimal analysis summary
echo ""
echo "🔬 DEEP INFINITESIMAL ANALYSIS COMPLETE"
echo "======================================"
echo "Areas analyzed: $ANALYZED"
echo "Deep issues (critical): $DEEP_ISSUES"
echo "Micro issues (moderate): $MICRO_ISSUES"
echo "Nano issues (minor): $NANO_ISSUES"
echo ""

TOTAL_INFINITESIMAL_ISSUES=$((DEEP_ISSUES + MICRO_ISSUES + NANO_ISSUES))
if [ "$DEEP_ISSUES" -gt 0 ]; then
    echo "🚨 CRITICAL: $DEEP_ISSUES deep-level issues require immediate attention"
elif [ "$MICRO_ISSUES" -gt 0 ]; then
    echo "⚠️  MODERATE: $MICRO_ISSUES micro-level issues should be addressed"
else
    echo "✅ ACCEPTABLE: No significant infinitesimal gaps detected"
fi

echo ""
echo "📋 Next Steps for Infinitesimal Compliance:"
echo "- Address deep issues first (highest priority)"
echo "- Implement micro improvements incrementally"
echo "- Monitor nano-level optimizations continuously"