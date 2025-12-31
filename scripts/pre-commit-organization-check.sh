#!/bin/bash

# Pre-commit hook for monorepo organization enforcement
# Ensures no loose files or structural violations are committed

echo "🔍 Running monorepo organization check..."

# Run validation script
if [ -f "scripts/validate-monorepo-structure.sh" ]; then
    if ! bash scripts/validate-monorepo-structure.sh; then
        echo ""
        echo "❌ COMMIT BLOCKED: Monorepo structure violations detected"
        echo ""
        echo "To fix these issues:"
        echo "  1. Run: ./scripts/organize-monorepo.sh"
        echo "  2. Review and fix any remaining issues"
        echo "  3. Replace custom code with vendor solutions"
        echo "  4. Run validation again: ./scripts/validate-monorepo-structure.sh"
        echo ""
        exit 1
    fi
else
    echo "⚠️  Validation script not found, skipping organization check"
fi

echo "✅ Monorepo organization check passed"
exit 0