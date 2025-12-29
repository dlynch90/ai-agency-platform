#!/bin/bash

# COMPREHENSIVE MCP ECOSYSTEM STARTER
# Starts all required MCP servers and dependencies

set -euo pipefail

WORKSPACE="${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}"
LOG_DIR="$WORKSPACE/logs/mcp"
PID_DIR="$WORKSPACE/.mcp/pids"

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$1] $2" | tee -a "$LOG_DIR/mcp_startup.log"
}

# Check if command exists
check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        log "ERROR" "Command $1 not found"
        return 1
    fi
    return 0
}

# Start service in background
start_service() {
    local name="$1"
    local command="$2"
    local log_file="$LOG_DIR/${name}.log"
    local pid_file="$PID_DIR/${name}.pid"

    log "INFO" "Starting $name..."

    # Kill existing process if running
    if [ -f "$pid_file" ]; then
        local old_pid=$(cat "$pid_file")
        if kill -0 "$old_pid" 2>/dev/null; then
            log "INFO" "Killing existing $name process (PID: $old_pid)"
            kill "$old_pid" || true
            sleep 2
        fi
        rm -f "$pid_file"
    fi

    # Start new process
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    log "INFO" "$name started with PID: $pid"

    # Wait a bit and check if still running
    sleep 3
    if ! kill -0 "$pid" 2>/dev/null; then
        log "ERROR" "$name failed to start. Check log: $log_file"
        return 1
    fi

    return 0
}

# Start Ollama
start_ollama() {
    if check_command ollama; then
        # Check if Ollama is already running
        if pgrep -f "ollama serve" >/dev/null; then
            log "INFO" "Ollama is already running"
            return 0
        fi
        start_service "ollama" "ollama serve"
        # Wait for Ollama to be ready
        sleep 5
        # Pull required models (only if not already pulled)
        ollama list | grep -q llama2 || ollama pull llama2 2>/dev/null || log "WARN" "Failed to pull llama2 model"
        ollama list | grep -q codellama || ollama pull codellama 2>/dev/null || log "WARN" "Failed to pull codellama model"
    else
        log "WARN" "Ollama not installed - MCP ollama server will not work"
    fi
}

# Start Qdrant
start_qdrant() {
    if check_command qdrant; then
        # Check if Qdrant is already running
        if lsof -i :6333 >/dev/null 2>&1; then
            log "INFO" "Qdrant is already running"
            return 0
        fi
        start_service "qdrant" "qdrant --config-path $WORKSPACE/configs/qdrant.yaml"
    else
        log "WARN" "Qdrant not installed - MCP qdrant server will not work"
    fi
}

# Start PostgreSQL
start_postgres() {
    if check_command pg_ctl; then
        # Check if PostgreSQL is already running
        if lsof -i :5432 >/dev/null 2>&1; then
            log "INFO" "PostgreSQL is already running"
            return 0
        fi
        local data_dir="$WORKSPACE/data/postgres"
        mkdir -p "$data_dir"

        if [ ! -f "$data_dir/PG_VERSION" ]; then
            log "INFO" "Initializing PostgreSQL database..."
            initdb -D "$data_dir" || log "ERROR" "Failed to initialize PostgreSQL"
        fi

        start_service "postgres" "postgres -D $data_dir -p 5432"
    else
        log "WARN" "PostgreSQL not installed"
    fi
}

# Start Neo4j
start_neo4j() {
    if check_command neo4j; then
        # Check if Neo4j is already running
        if lsof -i :7474 >/dev/null 2>&1; then
            log "INFO" "Neo4j is already running"
            return 0
        fi
        local neo4j_home="$WORKSPACE/tools/neo4j"
        export NEO4J_HOME="$neo4j_home"
        start_service "neo4j" "neo4j start"
    else
        log "WARN" "Neo4j not installed"
    fi
}

# Start Redis
start_redis() {
    if check_command redis-server; then
        # Check if Redis is already running
        if lsof -i :6379 >/dev/null 2>&1; then
            log "INFO" "Redis is already running"
            return 0
        fi
        start_service "redis" "redis-server $WORKSPACE/configs/redis.conf"
    else
        log "WARN" "Redis not installed"
    fi
}

    # Start custom MCP servers (vendor implementations)
start_mcp_servers() {
    log "INFO" "Starting custom MCP servers (vendor implementations)..."

    # Create custom MCP server implementations using vendor solutions

    # Ollama MCP Server (custom implementation)
    cat > "$WORKSPACE/mcp-servers/ollama-server.js" << 'EOF'
const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

app.post('/query', async (req, res) => {
    try {
        const { prompt } = req.body;
        exec(`ollama run llama2 "${prompt}"`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else {
                res.json({ response: stdout.trim() });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => console.log('Ollama MCP Server running on port 3001'));
EOF

    mkdir -p "$WORKSPACE/mcp-servers"
    start_service "mcp-ollama-custom" "node $WORKSPACE/mcp-servers/ollama-server.js"

    # Database MCP Servers (custom implementations)
    # PostgreSQL MCP
    cat > "$WORKSPACE/mcp-servers/postgres-server.js" << 'EOF'
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ai_agency_db'
});

client.connect();

app.post('/query', async (req, res) => {
    try {
        const { sql } = req.body;
        const result = await client.query(sql);
        res.json({ result: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3002, () => console.log('PostgreSQL MCP Server running on port 3002'));
EOF

    start_service "mcp-postgres-custom" "node $WORKSPACE/mcp-servers/postgres-server.js"

    # Neo4j MCP Server
    cat > "$WORKSPACE/mcp-servers/neo4j-server.js" << 'EOF'
const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
app.use(express.json());

const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

app.post('/query', async (req, res) => {
    const session = driver.session();
    try {
        const { cypher, params = {} } = req.body;
        const result = await session.run(cypher, params);
        res.json({ result: result.records.map(r => r.toObject()) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

app.listen(3003, () => console.log('Neo4j MCP Server running on port 3003'));
EOF

    start_service "mcp-neo4j-custom" "node $WORKSPACE/mcp-servers/neo4j-server.js"

    # File system MCP Server
    cat > "$WORKSPACE/mcp-servers/filesystem-server.js" << 'EOF'
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const ALLOWED_DIR = process.env.MCP_FILESYSTEM_ROOT || '/Users/daniellynch/Developer';

app.post('/read', async (req, res) => {
    try {
        const { filePath } = req.body;
        const fullPath = path.resolve(ALLOWED_DIR, filePath);

        // Security check
        if (!fullPath.startsWith(ALLOWED_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const content = await fs.readFile(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/list', async (req, res) => {
    try {
        const { dirPath = '.' } = req.body;
        const fullPath = path.resolve(ALLOWED_DIR, dirPath);

        if (!fullPath.startsWith(ALLOWED_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const items = await fs.readdir(fullPath);
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3004, () => console.log('Filesystem MCP Server running on port 3004'));
EOF

    start_service "mcp-filesystem-custom" "node $WORKSPACE/mcp-servers/filesystem-server.js"

    log "INFO" "Custom MCP servers started successfully"
}

# Health check function
health_check() {
    log "INFO" "Performing health checks..."

    # Check Ollama
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        log "INFO" "✓ Ollama is healthy"
    else
        log "WARN" "✗ Ollama health check failed"
    fi

    # Check Qdrant
    if curl -s http://localhost:6333/health >/dev/null 2>&1; then
        log "INFO" "✓ Qdrant is healthy"
    else
        log "WARN" "✗ Qdrant health check failed"
    fi

    # Check PostgreSQL
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log "INFO" "✓ PostgreSQL is healthy"
    else
        log "WARN" "✗ PostgreSQL health check failed"
    fi

    # Check Neo4j
    if curl -s http://localhost:7474 >/dev/null 2>&1; then
        log "INFO" "✓ Neo4j is healthy"
    else
        log "WARN" "✗ Neo4j health check failed"
    fi

    # Check Redis
    if redis-cli ping >/dev/null 2>&1; then
        log "INFO" "✓ Redis is healthy"
    else
        log "WARN" "✗ Redis health check failed"
    fi
}

# Main startup sequence
main() {
    log "INFO" "=== STARTING MCP ECOSYSTEM ==="

    # Load environment variables (if accessible)
    if [ -f "$WORKSPACE/.env" ] && [ -r "$WORKSPACE/.env" ]; then
        set -a
        source "$WORKSPACE/.env" || log "WARN" "Could not source .env file"
        set +a
        log "INFO" "Loaded environment variables from .env"
    else
        log "WARN" "Could not access .env file - using system environment"
    fi


    # Start infrastructure services
    start_ollama
    start_qdrant
    start_postgres
    start_neo4j
    start_redis

    # Wait for services to be ready
    log "INFO" "Waiting for infrastructure services to be ready..."
    sleep 10

    # Start MCP servers
    start_mcp_servers

    # Final health check
    sleep 5
    health_check

    log "INFO" "=== MCP ECOSYSTEM STARTUP COMPLETE ==="
    log "INFO" "Check logs in: $LOG_DIR"
    log "INFO" "PID files in: $PID_DIR"

    # Create status file
    echo "$(date)" > "$WORKSPACE/.mcp/status"
    echo "MCP ecosystem started successfully" >> "$WORKSPACE/.mcp/status"
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up MCP ecosystem..."

    # Kill all MCP processes
    if [ -d "$PID_DIR" ]; then
        for pid_file in "$PID_DIR"/*.pid; do
            if [ -f "$pid_file" ]; then
                local pid=$(cat "$pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    log "INFO" "Killing process $(basename "$pid_file" .pid) (PID: $pid)"
                    kill "$pid" || true
                fi
                rm -f "$pid_file"
            fi
        done
    fi

    log "INFO" "Cleanup complete"
}

# Handle signals
trap cleanup SIGINT SIGTERM

# Run main function
case "${1:-start}" in
    start)
        main
        ;;
    stop)
        cleanup
        ;;
    restart)
        cleanup
        sleep 2
        main
        ;;
    status)
        health_check
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac