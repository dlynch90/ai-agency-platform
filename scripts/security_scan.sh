#!/bin/bash
# Comprehensive Security Scanning using Snyk and Trivy
# Implements automated vulnerability assessment and compliance checking

set -e

echo "🔒 Comprehensive Security Scan"
echo "==============================="

# Initialize results
VULNERABILITIES=0
CRITICAL_ISSUES=0
COMPLIANCE_SCORE=0

# Function to run Snyk scan
run_snyk_scan() {
    echo "Running Snyk security scan..."

    if ! command -v snyk >/dev/null 2>&1; then
        echo "⚠️  Snyk not installed, skipping..."
        return 1
    fi

    # Run Snyk test
    if snyk test --json > snyk_results.json 2>/dev/null; then
        VULNS=$(jq '.vulnerabilities | length' snyk_results.json 2>/dev/null || echo "0")
        CRITICAL=$(jq '[.vulnerabilities[] | select(.severity == "critical")] | length' snyk_results.json 2>/dev/null || echo "0")

        echo "✅ Snyk scan completed: $VULNS vulnerabilities found, $CRITICAL critical"
        VULNERABILITIES=$((VULNERABILITIES + VULNS))
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + CRITICAL))
    else
        echo "⚠️  Snyk scan failed (possibly unauthenticated)"
    fi
}

# Function to run Trivy scan
run_trivy_scan() {
    echo "Running Trivy vulnerability scan..."

    if ! command -v trivy >/dev/null 2>&1; then
        echo "⚠️  Trivy not installed, skipping..."
        return 1
    fi

    # Run filesystem scan
    if trivy fs --exit-code 0 --format json . > trivy_fs_results.json 2>/dev/null; then
        TRIVY_VULNS=$(jq '.Results | length' trivy_fs_results.json 2>/dev/null || echo "0")
        echo "✅ Trivy filesystem scan completed: $TRIVY_VULNS issues found"
        VULNERABILITIES=$((VULNERABILITIES + TRIVY_VULNS))
    fi

    # Run container scan if Docker images exist
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -v "REPOSITORY:TAG" >/dev/null 2>&1; then
        echo "Scanning Docker images..."
        docker images --format "table {{.Repository}}:{{.Tag}}" | grep -v "REPOSITORY:TAG" | head -3 | while read image; do
            if [ -n "$image" ] && [ "$image" != "<none>" ]; then
                echo "Scanning image: $image"
                trivy image --exit-code 0 --format json "$image" > "trivy_${image//[:\/]/_}.json" 2>/dev/null || true
            fi
        done
    fi
}

# Function to run compliance checks
run_compliance_checks() {
    echo "Running compliance and configuration checks..."

    # Check for security headers in any web configs
    if find . -name "*.yml" -o -name "*.yaml" | xargs grep -l "security\|headers\|cors" >/dev/null 2>&1; then
        echo "✅ Security configurations found"
    else
        echo "⚠️  No security configurations detected"
    fi

    # Check for secrets in code
    SECRET_COUNT=$(grep -r -i -E "(api.*key|secret.*key|token|password)" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" 2>/dev/null | wc -l || echo "0")
    if [ "$SECRET_COUNT" -gt 0 ]; then
        echo "❌ Potential secrets found in code: $SECRET_COUNT instances"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + SECRET_COUNT))
    else
        echo "✅ No hardcoded secrets detected"
    fi

    # Check for proper file permissions
    WORLD_WRITABLE=$(find . -type f -perm -002 2>/dev/null | wc -l || echo "0")
    if [ "$WORLD_WRITABLE" -gt 0 ]; then
        echo "⚠️  World-writable files found: $WORLD_WRITABLE"
    fi
}

# Function to calculate compliance score
calculate_compliance_score() {
    TOTAL_CHECKS=10
    PASSED_CHECKS=0

    # Check if tools are available
    command -v snyk >/dev/null 2>&1 && ((PASSED_CHECKS++))
    command -v trivy >/dev/null 2>&1 && ((PASSED_CHECKS++))
    command -v docker >/dev/null 2>&1 && ((PASSED_CHECKS++))

    # Check for security configurations
    [ -f ".eslintrc*" ] || [ -f "eslint.config.*" ] && ((PASSED_CHECKS++))
    [ -f "package.json" ] && grep -q "scripts" package.json && ((PASSED_CHECKS++))
    [ -d ".git" ] && ((PASSED_CHECKS++))
    [ "$SECRET_COUNT" -eq 0 ] && ((PASSED_CHECKS++))

    COMPLIANCE_SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
}

# Run all security checks
run_snyk_scan
run_trivy_scan
run_compliance_checks
calculate_compliance_score

# Generate comprehensive report
echo ""
echo "📊 SECURITY SCAN REPORT"
echo "======================"
echo "🔍 Vulnerabilities Found: $VULNERABILITIES"
echo "🚨 Critical Issues: $CRITICAL_ISSUES"
echo "📈 Compliance Score: $COMPLIANCE_SCORE%"

if [ $CRITICAL_ISSUES -eq 0 ] && [ $COMPLIANCE_SCORE -ge 80 ]; then
    echo "✅ Security posture is GOOD"
elif [ $CRITICAL_ISSUES -le 5 ] && [ $COMPLIANCE_SCORE -ge 60 ]; then
    echo "⚠️  Security posture needs ATTENTION"
else
    echo "❌ Security posture requires IMMEDIATE ACTION"
fi

# Create detailed security report
cat > security_scan_report.md << REPORT_EOF
# Comprehensive Security Scan Report

## Executive Summary
- **Scan Date**: $(date)
- **Total Vulnerabilities**: $VULNERABILITIES
- **Critical Issues**: $CRITICAL_ISSUES
- **Compliance Score**: $COMPLIANCE_SCORE%

## Vulnerability Assessment

### Snyk Results
- **Tool Status**: $(command -v snyk >/dev/null 2>&1 && echo "✅ Available" || echo "❌ Not Available")
- **Vulnerabilities Found**: $(jq '.vulnerabilities | length' snyk_results.json 2>/dev/null || echo "N/A")
- **Critical Issues**: $(jq '[.vulnerabilities[] | select(.severity == "critical")] | length' snyk_results.json 2>/dev/null || echo "N/A")

### Trivy Results
- **Tool Status**: $(command -v trivy >/dev/null 2>&1 && echo "✅ Available" || echo "❌ Not Available")
- **Filesystem Issues**: $(jq '.Results | length' trivy_fs_results.json 2>/dev/null || echo "N/A")
- **Container Scans**: $(ls trivy_*.json 2>/dev/null | wc -l) images scanned

## Compliance Checks

### Security Configurations
- **ESLint**: $([ -f ".eslintrc*" ] || [ -f "eslint.config.*" ] && echo "✅ Configured" || echo "❌ Missing")
- **Scripts**: $([ -f "package.json" ] && grep -q "scripts" package.json && echo "✅ Defined" || echo "❌ Missing")
- **Version Control**: $([ -d ".git" ] && echo "✅ Git repository" || echo "❌ No Git")

### Secret Management
- **Hardcoded Secrets**: $([ "$SECRET_COUNT" -eq 0 ] && echo "✅ None found" || echo "❌ $SECRET_COUNT instances")
- **1Password Integration**: $(command -v op >/dev/null 2>&1 && echo "✅ CLI available" || echo "❌ Not installed")

## Recommendations

### Immediate Actions $([ $CRITICAL_ISSUES -gt 0 ] && echo "(REQUIRED)")
$(if [ $CRITICAL_ISSUES -gt 0 ]; then echo "- Address all critical security issues immediately"; fi)
$(if [ "$SECRET_COUNT" -gt 0 ]; then echo "- Remove all hardcoded secrets and use 1Password"; fi)
$(if ! command -v snyk >/dev/null 2>&1; then echo "- Install and configure Snyk for vulnerability scanning"; fi)

### Short-term Improvements
- Implement automated security scanning in CI/CD pipeline
- Set up dependency vulnerability monitoring
- Configure security headers and CORS policies
- Implement secret scanning pre-commit hooks

### Long-term Security
- Establish security champions and regular audits
- Implement threat modeling for new features
- Set up security monitoring and alerting
- Develop incident response procedures

## Security Tools Configuration

### Snyk Setup
\`\`\`bash
# Authenticate
snyk auth

# Run scans
snyk test
snyk monitor

# CI/CD integration
snyk test --severity-threshold=high
\`\`\`

### Trivy Setup
\`\`\`bash
# Filesystem scan
trivy fs .

# Container scan
trivy image myapp:latest

# SBOM generation
trivy fs --format spdx-json . > sbom.json
\`\`\`

### Automated Scanning
Add to CI/CD pipeline:
\`\`\`yaml
- name: Security Scan
  run: |
    ./scripts/security_scan.sh
    if [ \$? -ne 0 ]; then exit 1; fi
\`\`\`
REPORT_EOF

echo "📄 Detailed security report saved: security_scan_report.md"

# Exit with appropriate code
if [ $CRITICAL_ISSUES -gt 0 ] || [ $COMPLIANCE_SCORE -lt 60 ]; then
    exit 1
else
    exit 0
fi