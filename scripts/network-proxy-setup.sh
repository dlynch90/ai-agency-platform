#!/bin/bash

# Network Proxy Setup for API Smoke Tests
# This script configures network proxy settings for comprehensive API testing

set -e

echo "🔧 Setting up network proxy for API smoke tests..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Create proxy configuration
setup_proxy_config() {
    log "Creating proxy configuration..."

    # Create proxy configuration file
    cat > proxy-config.json << EOF
{
  "proxies": {
    "http": {
      "host": "127.0.0.1",
      "port": 3128,
      "auth": false
    },
    "https": {
      "host": "127.0.0.1",
      "port": 3128,
      "auth": false
    },
    "socks5": {
      "host": "127.0.0.1",
      "port": 1080,
      "auth": false
    }
  },
  "rules": {
    "direct": [
      "localhost",
      "127.0.0.1",
      "*.local",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.0.0/16"
    ],
    "proxy": [
      "*.api.github.com",
      "*.anthropic.com",
      "*.openai.com",
      "*.huggingface.co",
      "*.supabase.co",
      "*.clerk.dev",
      "*.neo4j.io",
      "*.postgresql.org"
    ]
  },
  "monitoring": {
    "enabled": true,
    "log_requests": true,
    "log_responses": false,
    "metrics_port": 9090
  }
}
EOF

    log "Proxy configuration created"
}

# Setup environment variables for proxy
setup_environment_variables() {
    log "Setting up environment variables..."

    # Create environment file for proxy settings
    cat > proxy-env.sh << 'EOF'
#!/bin/bash

# Network Proxy Environment Variables for API Testing
export HTTP_PROXY="http://127.0.0.1:3128"
export HTTPS_PROXY="http://127.0.0.1:3128"
export http_proxy="http://127.0.0.1:3128"
export https_proxy="http://127.0.0.1:3128"
export NO_PROXY="localhost,127.0.0.1,.local,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
export no_proxy="localhost,127.0.0.1,.local,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"

# SOCKS5 proxy for specific services
export SOCKS5_PROXY="socks5://127.0.0.1:1080"
export socks5_proxy="socks5://127.0.0.1:1080"

# Additional proxy settings for development
export REQUESTS_CA_BUNDLE=""
export SSL_CERT_FILE=""
export NODE_TLS_REJECT_UNAUTHORIZED="0"

log "Proxy environment variables set"
EOF

    chmod +x proxy-env.sh
    log "Environment variables configured"
}

# Setup mitmproxy for advanced proxy features
setup_mitmproxy() {
    if command_exists mitmproxy; then
        log "Setting up mitmproxy for advanced API testing..."

        # Create mitmproxy configuration
        cat > mitmproxy-config.yaml << EOF
listen_host: 127.0.0.1
listen_port: 3128
web_host: 127.0.0.1
web_port: 8081
ssl_insecure: true
http2: true
mode: transparent

# API testing specific settings
api_testing:
  record_traffic: true
  save_responses: true
  inject_headers: true
  modify_responses: false

# Monitoring and debugging
debug:
  flow_detail: 2
  ssl_version: true
  http_form_out: true

# Filters for API endpoints
filters:
  - "~u api.github.com"
  - "~u anthropic.com"
  - "~u openai.com"
  - "~u huggingface.co"
  - "~u supabase.co"
  - "~u clerk.dev"
  - "~u neo4j.io"
EOF

        log "Mitmproxy configuration created"
    else
        log "mitmproxy not found, skipping advanced proxy setup"
    fi
}

# Setup Charles Proxy alternative (if available)
setup_charles_alternative() {
    if command_exists charles; then
        log "Setting up Charles Proxy configuration..."

        # Create Charles configuration
        mkdir -p charles-config
        cat > charles-config/charles-settings.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <proxy>
    <port>3128</port>
    <transparentHttpProxying>true</transparentHttpProxying>
    <enableSOCKSProxy>false</enableSOCKSProxy>
  </proxy>
  <recording>
    <enabled>true</enabled>
    <include200s>true</include200s>
    <include304s>true</include304s>
  </recording>
  <throttling>
    <enabled>false</enabled>
  </throttling>
</configuration>
EOF

        log "Charles Proxy configuration created"
    else
        log "Charles not found, using built-in proxy"
    fi
}

# Setup API testing tools
setup_api_testing_tools() {
    log "Setting up API testing tools..."

    # Create API test configuration
    cat > api-test-config.json << EOF
{
  "base_urls": {
    "github": "https://api.github.com",
    "anthropic": "https://api.anthropic.com",
    "openai": "https://api.openai.com/v1",
    "huggingface": "https://api-inference.huggingface.co",
    "supabase": "https://api.supabase.com",
    "clerk": "https://api.clerk.dev",
    "neo4j": "https://demo.neo4jlabs.com:7473",
    "postgresql": "http://localhost:5432"
  },
  "auth": {
    "github": {
      "type": "bearer",
      "token": "${GITHUB_TOKEN}"
    },
    "anthropic": {
      "type": "bearer",
      "token": "${ANTHROPIC_API_KEY}"
    },
    "openai": {
      "type": "bearer",
      "token": "${OPENAI_API_KEY}"
    },
    "huggingface": {
      "type": "bearer",
      "token": "${HF_TOKEN}"
    }
  },
  "tests": {
    "smoke_tests": [
      {
        "name": "GitHub API",
        "url": "https://api.github.com/user",
        "method": "GET",
        "expected_status": 200
      },
      {
        "name": "Anthropic API",
        "url": "https://api.anthropic.com/v1/messages",
        "method": "POST",
        "expected_status": 200
      },
      {
        "name": "OpenAI API",
        "url": "https://api.openai.com/v1/models",
        "method": "GET",
        "expected_status": 200
      },
      {
        "name": "HuggingFace API",
        "url": "https://api-inference.huggingface.co/models",
        "method": "GET",
        "expected_status": 200
      }
    ],
    "performance_tests": [
      {
        "name": "Response Time Test",
        "url": "https://httpbin.org/delay/1",
        "method": "GET",
        "max_response_time": 2000
      }
    ]
  },
  "monitoring": {
    "enabled": true,
    "interval": 30,
    "alerts": {
      "response_time_threshold": 5000,
      "error_rate_threshold": 0.05
    }
  }
}
EOF

    log "API testing configuration created"
}

# Setup GraphQL testing proxy
setup_graphql_proxy() {
    log "Setting up GraphQL proxy for API testing..."

    # Create GraphQL proxy configuration
    cat > graphql-proxy-config.json << EOF
{
  "endpoints": {
    "local": {
      "url": "http://localhost:4000/graphql",
      "schema_path": "./graphql/schema.graphql"
    },
    "staging": {
      "url": "https://api-staging.example.com/graphql",
      "schema_path": "./graphql/staging-schema.graphql"
    },
    "production": {
      "url": "https://api.example.com/graphql",
      "schema_path": "./graphql/prod-schema.graphql"
    }
  },
  "testing": {
    "introspection": true,
    "query_validation": true,
    "performance_monitoring": true
  },
  "proxy": {
    "enabled": true,
    "port": 4001,
    "intercept_mutations": true,
    "log_queries": true
  }
}
EOF

    log "GraphQL proxy configuration created"
}

# Create API smoke test script
create_smoke_test_script() {
    log "Creating API smoke test script..."

    cat > api-smoke-tests.sh << 'EOF'
#!/bin/bash

# API Smoke Tests for AI Agency Platform
# This script performs comprehensive API testing through proxy

set -e

echo "🚀 Running API smoke tests through proxy..."

# Source proxy environment
if [ -f "./proxy-env.sh" ]; then
    source ./proxy-env.sh
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test result counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
log_test() {
    local name=$1
    local status=$2
    local message=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} $name: $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC} $name: $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} $name: $message"
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local expected_status=${4:-200}
    local timeout=${5:-10}

    echo "Testing $name..."

    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -w "HTTPSTATUS:%{http_code};TOTAL_TIME:%{time_total}" \
            --max-time $timeout \
            -X $method \
            "$url" 2>/dev/null)

        local status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local time=$(echo "$response" | grep -o "TOTAL_TIME:[0-9.]*" | cut -d: -f2)

        if [ "$status" = "$expected_status" ]; then
            log_test "$name" "PASS" "Status $status, Response time: ${time}s"
        else
            log_test "$name" "FAIL" "Expected status $expected_status, got $status"
        fi
    else
        log_test "$name" "SKIP" "curl not available"
    fi
}

# Test basic connectivity
echo "Testing basic connectivity..."
test_endpoint "Google DNS" "https://8.8.8.8" "GET" "000" 5
test_endpoint "HTTPBin" "https://httpbin.org/get" "GET" "200" 10

# Test AI service APIs (mock endpoints for now)
echo "Testing AI service APIs..."
test_endpoint "GitHub API (mock)" "https://api.github.com/zen" "GET" "200" 15
test_endpoint "Anthropic API (mock)" "https://api.anthropic.com/v1/messages" "POST" "400" 15  # Expect auth error
test_endpoint "OpenAI API (mock)" "https://api.openai.com/v1/models" "GET" "401" 15  # Expect auth error

# Test local services
echo "Testing local services..."
test_endpoint "Local GraphQL" "http://localhost:4000/graphql" "POST" "200" 5
test_endpoint "Local API" "http://localhost:3000/api/health" "GET" "200" 5

# Test database connectivity (if available)
echo "Testing database connectivity..."
if command -v psql >/dev/null 2>&1; then
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_test "PostgreSQL" "PASS" "Database is ready"
    else
        log_test "PostgreSQL" "FAIL" "Database not accessible"
    fi
else
    log_test "PostgreSQL" "SKIP" "psql not available"
fi

# Test Neo4j connectivity (if available)
if command -v cypher-shell >/dev/null 2>&1; then
    # This would need proper authentication
    log_test "Neo4j" "SKIP" "cypher-shell available but auth required"
else
    log_test "Neo4j" "SKIP" "cypher-shell not available"
fi

# Print summary
echo ""
echo "📊 API Smoke Test Results:"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed${NC}"
    exit 1
fi
EOF

    chmod +x api-smoke-tests.sh
    log "API smoke test script created"
}

# Setup monitoring and alerting
setup_monitoring() {
    log "Setting up API monitoring and alerting..."

    # Create monitoring configuration
    cat > api-monitoring-config.json << EOF
{
  "monitoring": {
    "enabled": true,
    "interval": 60,
    "endpoints": [
      {
        "name": "GitHub API",
        "url": "https://api.github.com/zen",
        "expected_status": 200,
        "timeout": 10
      },
      {
        "name": "Local GraphQL",
        "url": "http://localhost:4000/graphql",
        "expected_status": 200,
        "timeout": 5
      },
      {
        "name": "PostgreSQL Health",
        "url": "http://localhost:5432/health",
        "expected_status": 200,
        "timeout": 3
      }
    ],
    "alerts": {
      "slack_webhook": "${SLACK_WEBHOOK_URL}",
      "email_recipients": ["devops@example.com"],
      "thresholds": {
        "response_time_ms": 5000,
        "error_rate_percent": 5,
        "uptime_percent": 99.9
      }
    }
  },
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": ["stdout", "file"],
    "file_path": "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/logs/api-monitoring.log"
  }
}
EOF

    log "API monitoring configuration created"
}

# Main setup function
main() {
    log "Starting network proxy setup for API testing..."

    setup_proxy_config
    setup_environment_variables
    setup_mitmproxy
    setup_charles_alternative
    setup_api_testing_tools
    setup_graphql_proxy
    create_smoke_test_script
    setup_monitoring

    log "Network proxy setup completed!"
    log "To use the proxy:"
    log "  1. Source environment: source ./proxy-env.sh"
    log "  2. Run smoke tests: ./api-smoke-tests.sh"
    log "  3. Start proxy monitoring: ./start-proxy-monitoring.sh"

    echo ""
    echo "📋 Next steps:"
    echo "1. Configure your actual API keys in proxy-env.sh"
    echo "2. Start proxy server: mitmproxy --config mitmproxy-config.yaml"
    echo "3. Run API tests: ./api-smoke-tests.sh"
    echo "4. Monitor traffic: http://127.0.0.1:8081"
}

# Run main function
main "$@"