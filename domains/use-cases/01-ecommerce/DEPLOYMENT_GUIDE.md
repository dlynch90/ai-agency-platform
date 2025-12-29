# AI Agency Platform - Deployment Guide

## 🚨 SANDBOX ENVIRONMENT DETECTED

**Current Status:** You are running in Cursor IDE sandbox environment
**Limitations:** Docker containers and network services cannot run in sandbox

## 📋 SANDBOX-COMPATIBLE OPERATIONS

### ✅ What Works in Sandbox:
- Gibson CLI operations (`gibson agency`, `gibson analyze`)
- File system operations (create, edit, move files)
- Code generation and analysis
- MCP server configuration validation
- Use case structure validation

### ❌ What Doesn't Work in Sandbox:
- Docker container deployment
- Network service binding (ports 8001-8020)
- API endpoint serving
- Database connections
- External service communication

## 🚀 FULL DEPLOYMENT INSTRUCTIONS

### Step 1: Exit Cursor IDE Sandbox
```bash
# Open Terminal.app outside Cursor IDE
open -a Terminal
# OR use system terminal directly
```

### Step 2: Navigate to Project Directory
```bash
cd /Users/daniellynch/Developer
```

### Step 3: Start Infrastructure Services
```bash
# Start all infrastructure services
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait for services to be healthy (may take 2-3 minutes)
sleep 30

# Check service status
docker-compose -f infrastructure/docker-compose.yml ps
```

### Step 4: Deploy Use Cases
```bash
# Navigate to use cases directory
cd domains/use-cases

# Deploy all 20 use cases
./deploy-all.sh

# Check deployment status
docker ps
```

### Step 5: Verify Deployment
```bash
# Test individual use cases
curl http://localhost:8001/health  # E-commerce
curl http://localhost:8002/health  # Healthcare
curl http://localhost:8003/health  # Finance

# Test GraphQL gateway
curl http://localhost:4000/health

# Test Gibson CLI
gibson agency
```

## 🔧 SANDBOX TESTING COMMANDS

While in sandbox, you can test these components:

```bash
# Test Gibson CLI
gibson agency

# Validate MCP configuration
jq '.mcpServers | length' .cursor/@MCP.JSON

# Check use case structure
ls domains/use-cases/ | wc -l

# Validate infrastructure config
grep -c "services:" infrastructure/docker-compose.yml

# Check deploy script
ls -la domains/use-cases/deploy-all.sh
```

## 📊 SERVICE ENDPOINTS (After Full Deployment)

| Service | URL | Purpose |
|---------|-----|---------|
| E-commerce API | http://localhost:8001 | Product recommendations |
| Healthcare API | http://localhost:8002 | Patient management |
| Finance API | http://localhost:8003 | Portfolio management |
| GraphQL Gateway | http://localhost:4000 | API federation |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Caching |
| Neo4j | localhost:7687 | Graph database |
| Ollama | localhost:11434 | AI models |

## 🎯 TROUBLESHOOTING

### If Docker Fails:
```bash
# Check Docker status
docker --version
docker ps

# Restart Docker service
sudo systemctl restart docker  # Linux
# OR restart Docker Desktop on macOS
```

### If Services Don't Start:
```bash
# Check service logs
docker-compose -f infrastructure/docker-compose.yml logs

# Restart specific service
docker-compose -f infrastructure/docker-compose.yml restart postgres
```

### If Ports Are In Use:
```bash
# Find what's using ports
lsof -i :8001
lsof -i :5432

# Kill conflicting processes
kill -9 <PID>
```

## ✅ VERIFICATION CHECKLIST

After full deployment, verify these endpoints respond:

- [ ] http://localhost:8001/health → `{"status": "healthy", "use_case": "01"}`
- [ ] http://localhost:4000/health → `{"status": "healthy", "service": "graphql-gateway"}`
- [ ] Gibson CLI → Shows available commands
- [ ] Docker containers → 6+ containers running
- [ ] Database connections → PostgreSQL/Redis/Neo4j accessible

## 🎉 SUCCESS CRITERIA

**Full AI Agency Platform Deployed When:**
- ✅ All 20 use case APIs responding on ports 8001-8020
- ✅ GraphQL gateway operational on port 4000
- ✅ All infrastructure services healthy
- ✅ Gibson CLI fully functional
- ✅ MCP servers properly configured
