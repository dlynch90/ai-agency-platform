#!/bin/bash

# STREAMLINED FINITE ELEMENT ANALYSIS
# Fast gap analysis for enterprise compliance

set -euo pipefail

WORKSPACE="${DEVELOPER_DIR:-${HOME}/Developer}"

REPORT_FILE="$WORKSPACE/logs/fea_streamlined_report.json"
TIMESTAMP=$(date +%Y%m-%dT%H:%M:%S)

# Results accumulator
results=""
total_violations=0

log() {
    echo "$(date +%T) [$1] $2"
}

check_category() {
    local category="$1"
    local check_count=0
    local violations=0


    log "INFO" "=== $category ==="

    case "$category" in
        "ARCHITECTURE")
            # Fast file checks
            if [ $(find "$WORKSPACE" -maxdepth 1 -type f | wc -l) -gt 20 ]; then
                log "ERROR" "Excessive loose files in root"
                ((violations++))
            fi
            ((check_count += 1))

            for dir in docs logs testing infra api graphql federation data; do
                if [ ! -d "$WORKSPACE/$dir" ]; then
                    log "ERROR" "Missing directory: $dir"
                    ((violations++))
                fi
                ((check_count += 1))
            done
            ;;

        "SERVICES")
            # Check running services
            if ! lsof -i :5432 >/dev/null 2>&1; then
                log "WARN" "PostgreSQL not running"
                ((violations++))
            fi
            ((check_count += 1))

            if ! lsof -i :6379 >/dev/null 2>&1; then
                log "WARN" "Redis not running"
                ((violations++))
            fi
            ((check_count += 1))

            if ! lsof -i :7474 >/dev/null 2>&1; then
                log "WARN" "Neo4j not running"
                ((violations++))
            fi
            ((check_count += 1))

            if ! lsof -i :6333 >/dev/null 2>&1; then
                log "WARN" "Qdrant not running"
                ((violations++))
            fi
            ((check_count += 1))
            ;;

        "SECURITY")
            # Check security tools
            if ! command -v op >/dev/null 2>&1; then
                log "ERROR" "1Password CLI missing"
                ((violations++))
            fi
            ((check_count += 1))

            if ! grep -r "CLERK\|clerk" "$WORKSPACE/package.json" >/dev/null 2>&1; then
                log "WARN" "Clerk not detected"
                ((violations++))
            fi
            ((check_count += 1))
            ;;

        "DEVELOPMENT")
            # Check dev tools
            if ! command -v lefthook >/dev/null 2>&1; then
                log "ERROR" "Lefthook missing"
                ((violations++))
            fi
            ((check_count += 1))

            if [ ! -f "$WORKSPACE/lefthook.yml" ]; then
                log "ERROR" "Lefthook config missing"
                ((violations++))
            fi
            ((check_count += 1))
            ;;

        "INFRASTRUCTURE")
            # Check infra tools
            if ! command -v docker >/dev/null 2>&1; then
                log "ERROR" "Docker missing"
                ((violations++))
            fi
            ((check_count += 1))

            if ! command -v kubectl >/dev/null 2>&1; then
                log "WARN" "kubectl missing"
                ((violations++))
            fi
            ((check_count += 1))
            ;;
    esac

    results="${results:+$results, }\"$category\": \"$violations/$check_count\""
    ((total_violations += violations))

    log "INFO" "$category: $violations violations ($check_count checks)"
}

# Run all checks
main() {
    log "INFO" "Starting Streamlined FEA Analysis"

    categories=("ARCHITECTURE" "SERVICES" "SECURITY" "DEVELOPMENT" "INFRASTRUCTURE")

    for category in "${categories[@]}"; do
        check_category "$category"
    done

    # Generate report
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$TIMESTAMP",
    "analysis_type": "streamlined_finite_element_analysis",
    "total_violations": $total_violations,
    "categories_checked": ${#categories[@]},
    "results": {
        $results
    },
    "recommendations": [
        "Organize remaining loose files into appropriate directories",
        "Ensure all infrastructure services are running",
        "Install missing security and development tools",
        "Configure event-driven hooks and automation",
        "Implement comprehensive testing framework"
    ]
}
EOF

    log "INFO" "Analysis complete. Total violations: $total_violations"
    log "INFO" "Report saved to: $REPORT_FILE"

    return $total_violations
}

main "$@"