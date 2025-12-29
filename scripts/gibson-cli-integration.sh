#!/bin/bash
# Gibson CLI Integration - AI Development Assistant

echo "🤖 Setting up Gibson CLI Integration..."

# Check if Gibson CLI exists, if not create compatibility layer
if ! command -v gibson >/dev/null 2>&1; then
    echo "Gibson CLI not found - creating compatibility layer..."

    # Create Gibson CLI wrapper
    cat > ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/bin/gibson << 'EOF'
#!/bin/bash
# Gibson CLI Compatibility Layer
# Integrates with Ollama, Cursor AI, and MCP servers

case "$1" in
    "analyze")
        echo "🔍 Analyzing codebase with Gibson AI..."
        ollama run llama3.2 "Analyze this codebase: $(find . -name "*.py" -o -name "*.js" -o -name "*.ts" | head -5 | xargs cat)"
        ;;
    "review")
        echo "📝 Code review with Gibson AI..."
        ollama run llama3.2 "Review this code for best practices: $(cat "$2")"
        ;;
    "generate")
        echo "🎯 Generating code with Gibson AI..."
        ollama run llama3.2 "Generate $2 code for: $3"
        ;;
    "optimize")
        echo "⚡ Optimizing code with Gibson AI..."
        ollama run llama3.2 "Optimize this code for performance: $(cat "$2")"
        ;;
    "test")
        echo "🧪 Generating tests with Gibson AI..."
        ollama run llama3.2 "Generate comprehensive tests for: $(cat "$2")"
        ;;
    *)
        echo "🤖 Gibson CLI - AI Development Assistant"
        echo "Usage: gibson <command> [options]"
        echo ""
        echo "Commands:"
        echo "  analyze   - Analyze codebase structure"
        echo "  review    - Code review with AI"
        echo "  generate  - Generate code snippets"
        echo "  optimize  - Performance optimization"
        echo "  test      - Generate test cases"
        echo ""
        echo "Examples:"
        echo "  gibson analyze"
        echo "  gibson review main.py"
        echo "  gibson generate function fibonacci"
        ;;
esac
