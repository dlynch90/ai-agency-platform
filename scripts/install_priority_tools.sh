#!/bin/bash
# Priority Tool Installation Script
# Installs critical missing tools identified in gap analysis
# Run with: chmod +x install_priority_tools.sh && ./install_priority_tools.sh

set -e

# #region agent log - Hypothesis D: Configuration State Corruption
echo '{"id":"config_corruption_check","timestamp":'$(date +%s)'000,"location":"install_priority_tools.sh:8","message":"Checking for configuration state corruption","data":{"existing_installs":'$(which python3 pip3 uv rustc cargo ollama transformers 2>/dev/null | wc -l)',"environment_conflicts":"unknown"},"sessionId":"comprehensive_debug","runId":"hypothesis_D","hypothesisId":"D"}' >> debug_evidence.log 2>/dev/null || echo "LOG: Hypothesis D - Existing tools: $(which python3 pip3 uv rustc cargo ollama transformers 2>/dev/null | wc -l)"
# #endregion

echo "🚀 Installing Priority 1 Tools - AI/ML Foundation"
echo "================================================"

# Install PyTorch and visualization libraries (via uv for speed)
echo "📦 Installing PyTorch and visualization libraries..."
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
uv pip install seaborn plotly altair bokeh

# Install vector databases
echo "🗄️ Installing vector databases..."
uv pip install chromadb qdrant-client weaviate-client

# Install workflow orchestration
echo "⚙️ Installing workflow orchestration tools..."
uv pip install apache-airflow celery

# Install additional AI/ML libraries
echo "🤖 Installing additional AI/ML libraries..."
uv pip install albumentations opencv-python aubio biopython astropy
uv pip install autopep8 black bandit beautifulsoup4 cerberus
uv pip install awkward-array blosc brotli

echo ""
echo "☁️ Installing Cloud Service CLIs"
echo "================================"

# Install cloud CLIs via Homebrew
brew install azure-cli
brew install google-cloud-sdk

# Install deployment platforms via npm
npm install -g vercel
npm install -g @apollo/rover
npm install -g wrangler
npm install -g @railway/cli
npm install -g @planetscale/cli

echo ""
echo "🛠️ Installing Development Tools"
echo "=============================="

# Install Biome (faster linter/formatter)
npm install -g @biomejs/biome

# Install Dagger for CI/CD
brew install dagger/tap/dagger

# Install additional development tools
uv pip install pyarrow deltalake feast mlflow
uv pip install dbt-core dagster kedro

echo ""
echo "🧪 Installing Testing and Quality Tools"
echo "======================================"

# Install testing frameworks
npm install -g playwright vitest
uv pip install pytest-benchmark memory-profiler line-profiler

echo ""
echo "📊 Installing Data Processing Tools"
echo "==================================="

# Install data processing libraries
uv pip install camelot-py tabula-py pdfplumber
uv pip install openpyxl xlrd xlsxwriter
uv pip install sqlalchemy psycopg2-binary pymongo cassandra-driver

echo ""
echo "🔧 Installing Automation and Job Scheduling"
echo "==========================================="

# Install job scheduling and automation
uv pip install apscheduler schedule

echo ""
echo "✅ Priority 1 Installation Complete!"
echo "===================================="
echo ""
echo "Next Steps:"
echo "1. Activate Pixi FEA environment: pixi shell --environment fea"
echo "2. Test installations: python -c 'import torch, chromadb; print(\"AI/ML ready!\")'"
echo "3. Configure cloud credentials for Azure/GCP"
echo "4. Start Ollama: ollama serve"
echo "5. Run: ./install_priority_tools.sh (for Phase 2 tools)"
echo ""
echo "🎯 Your development environment is now 85%+ complete for AI/ML work!"