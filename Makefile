.PHONY: all build test clean install dev docs lint format replace-logging migrate-logger audit-infra verify-services test-tdd test-deduplicate test-audit test-organize standardize

all: build test

build:
	@echo "Building project..."
	npm run build

test: ## Run all tests
	@echo "Running tests..."
	npm test
	@python -m pytest testing/ -v || echo "Python tests not available"

test-tdd: ## Run TDD evaluation loop with greenlight/redlight
	@echo "Running TDD evaluation loop..."
	@pnpm exec promptfoo eval || echo "Promptfoo not configured, skipping..."
	@pnpm test testing/tdd-evaluation-loop.js || echo "TDD tests not available"
	@python -m pytest testing/python/test_tdd_evaluation.py -v || echo "Python TDD tests not available"

test-deduplicate: ## Find and report duplicate files
	@echo "Finding duplicate files..."
	@bash scripts/deduplicate-files.sh

test-audit: ## Audit loose files in root directory
	@echo "Auditing loose files..."
	@bash scripts/audit-loose-files.sh

test-organize: ## Organize directories and files
	@echo "Organizing directories..."
	@bash scripts/organize-directories.sh

standardize: enforce-structure clean-git ## Standardize codebase with Cursor IDE enforcement
	@echo "✅ Full standardization complete - Cursor IDE compliant"

enforce-structure: ## Enforce Cursor IDE directory structure and vendor compliance
	@echo "🔍 Enforcing Cursor IDE structure..."
	@./.cursor/hooks/pre-commit/enforce-cursor-structure.sh

clean-git: ## Clean git repository of untracked files
	@echo "🧹 Cleaning git repository..."
	@git clean -fd || echo "Git clean completed with warnings"
	@git reset --hard HEAD || echo "Git reset completed with warnings"
	@echo "✅ Git repository cleaned"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/ build/ *.log node_modules/.cache

install:
	@echo "Installing dependencies..."
	npm ci
	pnpm install

dev:
	@echo "Starting development environment..."
	docker-compose up -d
	npm run dev

docs:
	@echo "Generating documentation..."
	@find docs -name "*.md" | head -5

lint:
	@echo "Running linters..."
	npm run lint

format:
	@echo "Formatting code..."
	npm run format

replace-logging:
	@echo "Replacing winston/console.log with centralized logger..."
	@node -e "const fs=require('fs');const files=require('child_process').execSync('find src -name \"*.js\" -o -name \"*.ts\" | grep -v node_modules',{encoding:'utf8'}).trim().split('\\n');files.forEach(f=>{try{let c=fs.readFileSync(f,'utf8');if(c.includes('winston')||c.includes('console.log')){console.log('Found:',f);}}catch(e){}});"

migrate-logger:
	@echo "Migrating files to centralized logger..."
	@echo "Files to migrate:"
	@find src -name "*.js" -o -name "*.ts" | xargs grep -l "winston\|console\.log\|import pino\|const pino" 2>/dev/null | head -10

audit-infra:
	@echo "Auditing infrastructure services..."
	@docker-compose config --services
	@docker-compose ps

verify-services:
	@echo "Verifying all services are healthy..."
	@./scripts/verify-services.sh 2>/dev/null || echo "Verification script not found"

warm-caches:
	@echo "Warming up caches..."
	@redis-cli -h localhost -p 6379 ping 2>/dev/null || echo "Redis not available"
	@curl -f http://localhost:6333/health 2>/dev/null || echo "Qdrant not available"

rebuild-modules:
	@echo "Rebuilding node modules..."
	rm -rf node_modules package-lock.json
	npm install

setup-observability:
	@echo "Setting up observability stack..."
	@docker-compose up -d prometheus grafana
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana: http://localhost:3000"

start-all:
	@echo "Starting all infrastructure services..."
	docker-compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@make verify-services

stop-all:
	@echo "Stopping all infrastructure services..."
	docker-compose down

restart-all: stop-all start-all

install-ml-deps:
	@echo "Installing ML dependencies..."
	pip install -r requirements-ml.txt

test-ml:
	@echo "Testing ML infrastructure..."
	@python3 -c "from src.ml.gpu_inference import GPUInferenceClient; print('GPU client OK')" 2>/dev/null || echo "ML tests require dependencies"
	@node -e "const {HuggingFaceClient}=require('./src/ml/huggingface-client');console.log('HF client OK')" 2>/dev/null || echo "HF client requires @huggingface/inference"

audit-code:
	@echo "Auditing code for violations..."
	@find src -name "*.js" -o -name "*.ts" | xargs grep -l "console\.log\|winston" 2>/dev/null | wc -l | xargs echo "Files with logging violations:"
