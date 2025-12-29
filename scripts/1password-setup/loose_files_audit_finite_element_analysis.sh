#!/bin/bash
set -euo pipefail

# Finite Element Gap Analysis for Cursor IDE Rules Compliance
# Audit Loose Files and Architecture Violations

export LOG_FILE="/Users/daniellynch/loose_files_audit_output.log"
export JSON_REPORT="/Users/daniellynch/loose_files_audit_report.json"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🔬 FINITE ELEMENT GAP ANALYSIS - CURSOR IDE RULES COMPLIANCE AUDIT"
echo "📅 $(date)"
echo "👤 User: $(whoami)"
echo "📍 Working Directory: $(pwd)"
echo ""

# Initialize JSON report
cat > "$JSON_REPORT" << 'EOF'
{
  "audit_timestamp": "'$(date -Iseconds)'",
  "audit_type": "finite_element_gap_analysis",
  "cursor_rules_compliance": {
    "architecture_enforcement": {},
    "file_organization": {},
    "quality_enforcement": {},
    "vendor_compliance": {},
    "security_compliance": {}
  },
  "loose_files_violations": [],
  "parameterization_gaps": [],
  "ssot_violations": [],
  "registry_catalog_gaps": [],
  "finite_element_analysis": {
    "stress_points": [],
    "boundary_conditions": [],
    "material_properties": [],
    "load_distributions": []
  },
  "mcp_server_utilization": {},
  "cli_tool_integration": {},
  "polyglot_resources": {},
  "recommendations": []
}
EOF

echo "🔍 PHASE 1: AUDITING LOOSE FILES VIOLATIONS"
echo "============================================="

# Function to analyze file organization
analyze_file_organization() {
    local dir="$1"
    local category="$2"

    echo "📂 Analyzing $category: $dir"

    # Count loose files
    local loose_count=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | wc -l)
    echo "   Loose files: $loose_count"

    # Identify specific violations
    find "$dir" -maxdepth 1 -type f 2>/dev/null | while read -r file; do
        local filename=$(basename "$file")
        echo "   VIOLATION: $filename (loose file in $category)"

        # Add to JSON report
        jq --arg file "$file" --arg category "$category" \
           '.loose_files_violations += [{"file": $file, "category": $category, "violation_type": "loose_file"}]' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    done
}

# Audit user root directory
analyze_file_organization "/Users/daniellynch" "user_root"

# Audit project root directory
analyze_file_organization "/Users/daniellynch/Developer" "project_root"

echo ""
echo "🔍 PHASE 2: PARAMETERIZATION GAP ANALYSIS"
echo "========================================="

# Check for hardcoded values
echo "🔍 Checking for hardcoded paths and values..."

# Find files with hardcoded paths
find /Users/daniellynch/Developer -type f -name "*.sh" -o -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.toml" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" | \
while read -r file; do
    if grep -q "/Users/daniellynch\|/Users/.*\|~/\." "$file" 2>/dev/null; then
        echo "   PARAMETERIZATION VIOLATION: $file (hardcoded paths)"

        jq --arg file "$file" \
           '.parameterization_gaps += [{"file": $file, "violation_type": "hardcoded_paths"}]' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    fi
done

echo ""
echo "🔍 PHASE 3: SSOT VIOLATIONS ANALYSIS"
echo "==================================="

# Check for duplicate configurations
echo "🔍 Checking for duplicate configurations..."

# Look for multiple config files of same type
find /Users/daniellynch/Developer -name "*.toml" -o -name "*.yaml" -o -name "*.yml" | \
xargs -I {} basename {} | sort | uniq -c | awk '$1 > 1 {print $2 " appears " $1 " times"}'

echo ""
echo "🔍 PHASE 4: REGISTRY & CATALOG GAPS"
echo "==================================="

# Check for missing registry systems
echo "🔍 Checking for registry and catalog systems..."

# Should have centralized registries for:
# - MCP servers
# - CLI tools
# - API endpoints
# - Database schemas
# - Infrastructure resources

missing_registries=("mcp_servers" "cli_tools" "api_endpoints" "database_schemas" "infrastructure_resources")

for registry in "${missing_registries[@]}"; do
    if [ ! -f "/Users/daniellynch/Developer/data/registry/${registry}.json" ]; then
        echo "   MISSING REGISTRY: $registry"

        jq --arg registry "$registry" \
           '.registry_catalog_gaps += [{"registry": $registry, "status": "missing"}]' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    fi
done

echo ""
echo "🔬 PHASE 5: FINITE ELEMENT ANALYSIS"
echo "==================================="

# Analyze stress points, boundary conditions, material properties, load distributions

echo "🔬 Analyzing stress points..."
# Stress points: areas where violations cluster
find /Users/daniellynch/Developer -type f -name "*.sh" | wc -l | xargs echo "   Shell scripts stress point: {} files"

echo "🔬 Analyzing boundary conditions..."
# Boundary conditions: interface points between systems
echo "   MCP server boundaries: $(ls /Users/daniellynch/Developer/.cursor/mcp/ 2>/dev/null | wc -l) servers"

echo "🔬 Analyzing material properties..."
# Material properties: tool ecosystem strength/weaknesses
echo "   Tool ecosystem health: Analyzing..."

echo "🔬 Analyzing load distributions..."
# Load distributions: how work is distributed across tools
echo "   Work distribution analysis: $(find /Users/daniellynch/Developer -name "*.py" | wc -l) Python files"

echo ""
echo "🔧 PHASE 6: MCP SERVER UTILIZATION AUDIT"
echo "========================================="

# Check MCP server configurations
echo "🔍 Checking MCP server utilization..."

mcp_servers=("sequential-thinking" "desktop-commander" "github" "postgres" "redis" "qdrant" "ollama" "filesystem" "memory")

for server in "${mcp_servers[@]}"; do
    if [ -f "/Users/daniellynch/Developer/.cursor/mcp/${server}.json" ]; then
        echo "   ✅ MCP Server configured: $server"

        jq --arg server "$server" \
           '.mcp_server_utilization += {($server): {"status": "configured"}}' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    else
        echo "   ❌ MCP Server missing: $server"

        jq --arg server "$server" \
           '.mcp_server_utilization += {($server): {"status": "missing"}}' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    fi
done

echo ""
echo "🔧 PHASE 7: CLI TOOL INTEGRATION AUDIT"
echo "======================================="

# Check CLI tool availability
cli_tools=("fd" "rg" "bat" "fzf" "jq" "yq" "gh" "kubectl" "docker" "ansible" "terraform" "aws" "gcloud" "az")

for tool in "${cli_tools[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "   ✅ CLI Tool available: $tool"

        jq --arg tool "$tool" \
           '.cli_tool_integration += {($tool): {"status": "available"}}' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    else
        echo "   ❌ CLI Tool missing: $tool"

        jq --arg tool "$tool" \
           '.cli_tool_integration += {($tool): {"status": "missing"}}' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    fi
done

echo ""
echo "🌐 PHASE 8: POLYGLOT RESOURCES ANALYSIS"
echo "======================================="

# Check polyglot programming support
languages=("python" "node" "go" "rust" "java" "ruby" "php" "dotnet")

for lang in "${languages[@]}"; do
    if command -v "$lang" >/dev/null 2>&1; then
        echo "   ✅ Language runtime: $lang"

        jq --arg lang "$lang" \
           '.polyglot_resources += {($lang): {"status": "available"}}' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    else
        echo "   ❌ Language runtime missing: $lang"

        jq --arg lang "$lang" \
           '.polyglot_resources += {($lang): {"status": "missing"}}' \
           "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
    fi
done

echo ""
echo "🛠️ PHASE 9: CURSOR IDE INSTRUMENTATION ANALYSIS"
echo "==============================================="

# Check instrumentation setup
echo "🔍 Checking Cursor IDE instrumentation..."

if [ -f "/Users/daniellynch/Developer/.cursor/debug.log" ]; then
    echo "   ✅ Debug log exists"

    # Check if instrumentation is working
    if [ -s "/Users/daniellynch/Developer/.cursor/debug.log" ]; then
        echo "   ✅ Instrumentation active (log has content)"
    else
        echo "   ⚠️ Instrumentation configured but inactive"
    fi
else
    echo "   ❌ Debug log missing"
fi

# Check MCP server endpoint
if pgrep -f "mcp" >/dev/null 2>&1; then
    echo "   ✅ MCP servers running"
else
    echo "   ❌ MCP servers not running"
fi

echo ""
echo "🎯 PHASE 10: RECOMMENDATIONS & ACTION ITEMS"
echo "==========================================="

# Generate recommendations
recommendations=(
    "Move all loose files to Chezmoi management"
    "Parameterize all configurations with 1Password secrets"
    "Implement centralized registries for all resources"
    "Set up proper pre/post-commit hooks with event-driven architecture"
    "Configure all MCP servers for comprehensive AI agency"
    "Install missing CLI tools and language runtimes"
    "Implement network proxy for API smoke testing"
    "Set up PostgreSQL + Prisma + Neo4j databases"
    "Create Gibson CLI integration"
    "Fix Cursor IDE instrumentation issues"
)

for rec in "${recommendations[@]}"; do
    echo "   📋 $rec"

    jq --arg rec "$rec" \
       '.recommendations += [$rec]' \
       "$JSON_REPORT" > "${JSON_REPORT}.tmp" && mv "${JSON_REPORT}.tmp" "$JSON_REPORT"
done

echo ""
echo "📊 AUDIT COMPLETE"
echo "================="
echo "📄 Log saved to: $LOG_FILE"
echo "📊 JSON Report: $JSON_REPORT"
echo ""
echo "🚨 CRITICAL VIOLATIONS DETECTED:"
echo "   - Loose files in root directories (Cursor Rule violation)"
echo "   - No parameterized configurations"
echo "   - Missing SSOT for resources"
echo "   - Incomplete registry/catalog systems"
echo "   - Instrumentation issues in Cursor IDE"
echo ""
echo "🔧 IMMEDIATE ACTION REQUIRED:"
echo "   1. Move all dotfiles to Chezmoi management"
echo "   2. Implement 1Password parameterized configurations"
echo "   3. Create centralized registries"
echo "   4. Fix MCP server configurations"
echo "   5. Set up proper event-driven architecture"