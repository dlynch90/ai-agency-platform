#!/bin/bash
set -euo pipefail

echo "🔍 AUTOMATED TYPE CHECKING - $(date)"
echo "==================================="

# Function to log actions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a type-check.log
}

# Function to check tool availability
check_tool() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "✅ $1 available"
        return 0
    else
        echo "❌ $1 not available"
        return 1
    fi
}

log "Starting automated type checking..."

# 1. Check TypeScript availability
log "Checking TypeScript toolchain..."
if ! check_tool tsc; then
    log "❌ TypeScript not available"
    exit 1
fi

# 2. Run type checking
log "Running TypeScript compilation check..."
if npx tsc --noEmit --pretty 2>&1; then
    log "✅ TypeScript compilation successful"
    ERROR_COUNT=0
else
    ERROR_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
    ERROR_COUNT=$(echo "$ERROR_OUTPUT" | grep -c "error TS" || echo "0")
    log "❌ TypeScript compilation failed with $ERROR_COUNT errors"

    # Log top 10 errors for debugging
    echo "$ERROR_OUTPUT" | grep "error TS" | head -10 | tee -a type-errors.log

    # Exit with error if critical
    if [ "$ERROR_COUNT" -gt 50 ]; then
        log "🚨 CRITICAL: Too many TypeScript errors ($ERROR_COUNT)"
        exit 1
    fi
fi

# 3. Check type coverage (if available)
log "Checking type coverage..."
if command -v type-coverage >/dev/null 2>&1; then
    type-coverage --detail | head -20 | tee -a type-coverage.log
else
    log "⚠️ type-coverage tool not available"
fi

# 4. Check for any type assertion issues
log "Checking for type assertion issues..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | head -20 | \
    xargs grep -l "as any\|as unknown" | wc -l | xargs echo "Files with type assertions:"

# 5. Validate package type exports
log "Validating package type exports..."
if [ -d "packages" ]; then
    for package in packages/*; do
        if [ -f "$package/package.json" ]; then
            PACKAGE_NAME=$(jq -r '.name' "$package/package.json" 2>/dev/null || echo "unknown")
            if [ -f "$package/src/index.ts" ]; then
                log "✅ Package $PACKAGE_NAME has proper type exports"
            else
                log "⚠️ Package $PACKAGE_NAME missing type exports"
            fi
        fi
    done
fi

# 6. Check for missing dependencies
log "Checking for missing type dependencies..."
MISSING_TYPES=$(npx tsc --noEmit 2>&1 | grep "Cannot find module" | wc -l)
if [ "$MISSING_TYPES" -gt 0 ]; then
    log "⚠️ Found $MISSING_TYPES missing module errors"
    npx tsc --noEmit 2>&1 | grep "Cannot find module" | head -5
fi

# 7. Performance metrics
log "Collecting type checking metrics..."
TOTAL_TS_FILES=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)
log "📊 Total TypeScript files: $TOTAL_TS_FILES"
log "📊 TypeScript errors: $ERROR_COUNT"
log "📊 Error rate: $((ERROR_COUNT * 100 / (TOTAL_TS_FILES > 0 ? TOTAL_TS_FILES : 1)))%"

# 8. Generate report
REPORT_FILE="reports/type-check-$(date +%Y%m%d-%H%M%S).json"
mkdir -p reports
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "total_files": $TOTAL_TS_FILES,
  "errors": $ERROR_COUNT,
  "error_rate": $((ERROR_COUNT * 100 / (TOTAL_TS_FILES > 0 ? TOTAL_TS_FILES : 1))),
  "status": "$([ "$ERROR_COUNT" -eq 0 ] && echo "success" || echo "failed")",
  "missing_modules": $MISSING_TYPES
}
EOF

log "📄 Report generated: $REPORT_FILE"
log "Automated type checking completed"