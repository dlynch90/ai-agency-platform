#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVELOPER_DIR="${DEVELOPER_DIR:-$(dirname "$SCRIPT_DIR")}"
HEALTH_ANALYZER_DIR="$DEVELOPER_DIR/tools/health-analyzer"

show_help() {
    echo "🏥 Codebase Health Analyzer"
    echo ""
    echo "Usage: codebase health [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --ultrathink      Enable deep analysis mode with comprehensive scanning"
    echo "  --format FORMAT   Output format: json (default), markdown"
    echo "  --path PATH       Path to analyze (default: current directory)"
    echo "  --output FILE     Save report to file"
    echo "  --api             Start the health analyzer API server"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  codebase health --ultrathink"
    echo "  codebase health --format markdown --output report.md"
    echo "  codebase health --api"
}

check_dependencies() {
    if ! command -v node &>/dev/null; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi

    if ! command -v pnpm &>/dev/null && ! command -v npm &>/dev/null; then
        echo "❌ npm or pnpm is required but not installed"
        exit 1
    fi
}

ensure_built() {
    if [[ ! -d "$HEALTH_ANALYZER_DIR/node_modules" ]]; then
        echo "📦 Installing dependencies..."
        cd "$HEALTH_ANALYZER_DIR"
        if command -v pnpm &>/dev/null; then
            pnpm install
        else
            npm install
        fi
    fi

    if [[ ! -d "$HEALTH_ANALYZER_DIR/dist" ]]; then
        echo "🔨 Building health analyzer..."
        cd "$HEALTH_ANALYZER_DIR"
        if command -v pnpm &>/dev/null; then
            pnpm run build
        else
            npm run build
        fi
    fi
}

run_analysis() {
    local args=("$@")

    cd "$HEALTH_ANALYZER_DIR"
    npx tsx src/cli.ts "${args[@]}"
}

run_api() {
    cd "$HEALTH_ANALYZER_DIR"
    npx tsx src/api/server.ts
}

main() {
    check_dependencies

    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi

    case "${1:-}" in
    --help | -h)
        show_help
        exit 0
        ;;
    --api)
        ensure_built
        run_api
        ;;
    *)
        ensure_built
        run_analysis "$@"
        ;;
    esac
}

main "$@"
