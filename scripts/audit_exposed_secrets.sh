#!/bin/bash
# Audit for Exposed Secrets and API Keys
# Finds and reports potential security vulnerabilities

set -e

echo "🔍 Auditing for Exposed Secrets"
echo "==============================="

# Patterns to search for exposed secrets
SECRET_PATTERNS=(
    "api[_-]?key[=:].*[a-zA-Z0-9]{20,}"
    "secret[_-]?key[=:].*[a-zA-Z0-9]{20,}"
    "token[=:].*[a-zA-Z0-9]{20,}"
    "password[=:].*[a-zA-Z0-9]{8,}"
    "bearer.*[a-zA-Z0-9]{20,}"
    "authorization.*[a-zA-Z0-9]{20,}"
)

# Files to exclude from search
EXCLUDE_PATTERNS=(
    "*.log"
    "*.tmp"
    "*node_modules*"
    "*.git*"
    "*target*"
    "*build*"
    "*.class"
)

# Build find command exclude arguments
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS -not -path '*/$pattern/*'"
done

echo "Scanning for exposed secrets..."

# Search for each pattern
found_secrets=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    echo "Checking pattern: $pattern"

    # Use eval to properly handle the exclude arguments
    results=$(eval "grep -r -i -E '$pattern' . $EXCLUDE_ARGS 2>/dev/null || true")

    if [ -n "$results" ]; then
        echo "❌ POTENTIAL EXPOSED SECRETS FOUND:"
        echo "$results"
        echo "---"
        ((found_secrets++))
    fi
done

# Check for hardcoded URLs with secrets
echo "Checking for URLs with potential secrets..."
URL_RESULTS=$(eval "grep -r -E 'https?://[^/]*:[^/]*@' . $EXCLUDE_ARGS 2>/dev/null || true")
if [ -n "$URL_RESULTS" ]; then
    echo "❌ URLs with embedded credentials found:"
    echo "$URL_RESULTS"
    ((found_secrets++))
fi

# Check for common secret files
echo "Checking for common secret files..."
SECRET_FILES=(
    ".env.local"
    ".env.production"
    "secrets.json"
    "credentials.json"
    "config/secrets.*"
)

for file in "${SECRET_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "⚠️  Potential secret file found: $file"
        ((found_secrets++))
    fi
done

# Generate report
echo ""
echo "📊 SECRET AUDIT REPORT"
echo "======================"

if [ $found_secrets -eq 0 ]; then
    echo "✅ No exposed secrets detected"
    echo ""
    echo "🎉 Codebase appears secure!"
else
    echo "❌ $found_secrets security issues found"
    echo ""
    echo "🚨 IMMEDIATE ACTION REQUIRED:"
    echo "1. Remove all exposed secrets immediately"
    echo "2. Rotate any compromised API keys"
    echo "3. Use 1Password for secret management"
    echo "4. Implement automated secret scanning in CI/CD"
fi

# Recommendations
cat > secret_audit_report.md << REPORT_EOF
# Secret Audit Report

## Findings
- **Exposed Secrets**: $found_secrets issues detected
- **Scan Date**: $(date)
- **Scanner**: Custom regex patterns

## Recommendations

### Immediate Actions
1. **Remove Exposed Secrets**: Replace all hardcoded secrets with 1Password references
2. **Rotate Compromised Keys**: Generate new API keys for any exposed credentials
3. **Implement Secret Management**: Use 1Password CLI for all secret operations

### Long-term Security
1. **Automated Scanning**: Integrate secret scanning in CI/CD pipeline
2. **Pre-commit Hooks**: Prevent commits containing secrets
3. **Environment Separation**: Use different secrets for each environment
4. **Access Control**: Implement least-privilege access to secrets

### 1Password Integration
\`\`\`bash
# Setup 1Password
./scripts/setup_1password.sh

# Load secrets
./scripts/load_secrets.sh

# Validate configuration
./scripts/validate_secrets.sh
\`\`\`

## Security Best Practices
- Never commit secrets to version control
- Use environment-specific secret vaults
- Implement secret rotation policies
- Monitor secret access patterns
- Use short-lived tokens where possible
REPORT_EOF

echo "📄 Detailed report saved: secret_audit_report.md"