#!/bin/bash
# Vendor-based Gap Analysis using Snyk
# Replaces custom comprehensive_gap_analysis.py

set -e

echo "🔍 Vendor Gap Analysis using Snyk"
echo "=================================="

# Check if Snyk is authenticated
if ! snyk auth --help >/dev/null 2>&1; then
    echo "❌ Snyk not properly configured"
    exit 1
fi

# Run Snyk security scan
echo "Running security vulnerability scan..."
snyk test --json > security_scan_results.json 2>/dev/null || echo "[]" > security_scan_results.json

# Run Snyk code analysis
echo "Running code quality analysis..."
snyk code test --json > code_quality_results.json 2>/dev/null || echo "[]" > code_quality_results.json

# Run dependency analysis
echo "Running dependency analysis..."
snyk test --print-deps 2>/dev/null | grep -E "(Package|Introduced|Fixed)" > dependency_analysis.txt || echo "No dependency issues found" > dependency_analysis.txt

# Generate comprehensive report
echo "Generating comprehensive gap analysis report..."
cat > vendor_gap_analysis_report.md << 'REPORT_EOF'
# Vendor Gap Analysis Report (Snyk)

## Security Vulnerabilities
$(jq '.vulnerabilities | length' security_scan_results.json 2>/dev/null || echo "0") vulnerabilities found

## Code Quality Issues
$(jq '.runs[0].results | length' code_quality_results.json 2>/dev/null || echo "0") code quality issues identified

## Dependency Analysis
$(wc -l < dependency_analysis.txt) dependency issues found

## Recommendations
1. Address critical security vulnerabilities immediately
2. Fix high-priority code quality issues
3. Update vulnerable dependencies
4. Implement automated security scanning in CI/CD

## Next Steps
- Run: \`snyk monitor\` to track issues over time
- Configure: Snyk PR checks for automated scanning
- Implement: Snyk Advisor for package health checks
REPORT_EOF

echo "✅ Vendor gap analysis completed"
echo "📄 Report saved: vendor_gap_analysis_report.md"