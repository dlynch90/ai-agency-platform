#!/bin/bash

# Network Proxy Setup Script
# API smoke testing and GraphQL federation proxy configuration

set -e

echo "🌐 Setting up network proxy for API smoke tests..."

# Check if mitmproxy is available
if ! command -v mitmproxy >/dev/null 2>&1; then
    echo "⚠️ mitmproxy not found. Installing..."
    pip install mitmproxy
fi

# Check if Apollo Router is available
if ! command -v router >/dev/null 2>&1; then
    echo "⚠️ Apollo Router not found. Installing..."
    curl -sSL https://router.apollo.dev/download/nix/latest | sh
fi

# Create necessary directories
mkdir -p logs/proxy
mkdir -p logs/graphql

# Start mitmproxy in background for API testing
start_mitmproxy() {
    echo "🔄 Starting mitmproxy for API smoke testing..."

    # Create addon script for smoke tests
    cat > mitmproxy_addon.py << 'EOF'
from mitmproxy import http
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmokeTestAddon:
    def __init__(self):
        self.last_test_run = 0
        self.test_interval = 60  # seconds

    def request(self, flow: http.HTTPFlow) -> None:
        # Log all requests
        logger.info(f"REQUEST: {flow.request.method} {flow.request.url}")

        # Add custom headers
        flow.request.headers["X-Test-Run"] = str(int(time.time()))

    def response(self, flow: http.HTTPFlow) -> None:
        # Log all responses
        logger.info(f"RESPONSE: {flow.response.status_code} {flow.request.url}")

        # Run smoke tests periodically
        current_time = time.time()
        if current_time - self.last_test_run > self.test_interval:
            self.run_smoke_tests()
            self.last_test_run = current_time

    def run_smoke_tests(self):
        logger.info("🏥 Running smoke tests...")

        # Test GraphQL endpoint
        try:
            import requests
            response = requests.post(
                "http://localhost:4000/graphql",
                json={"query": "{ _service { sdl } }"},
                timeout=10
            )
            if response.status_code == 200:
                logger.info("✅ GraphQL federation health check passed")
            else:
                logger.error(f"❌ GraphQL federation health check failed: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ GraphQL federation health check error: {e}")

addons = [SmokeTestAddon()]
EOF

    # Start mitmproxy with configuration
    mitmproxy \
        --mode transparent \
        --listen-host 0.0.0.0 \
        --listen-port 8080 \
        --conf mitmproxy-config.yaml \
        --set ssl_insecure=true \
        --set termlog_verbosity=info \
        --set log_file=logs/proxy/mitmproxy.log \
        --scripts mitmproxy_addon.py &
}

# Start Apollo Router for GraphQL federation
start_apollo_router() {
    echo "🚀 Starting Apollo Router for GraphQL federation..."

    # Create router configuration
    cat > router.yaml << EOF
supergraph:
  listen: 0.0.0.0:4000
  introspection: true
  query_planning:
    cache:
      in_memory:
        limit: 512
  experimental_cache:
    enabled: true
    redis:
      urls: ["redis://localhost:6379"]

telemetry:
  metrics:
    prometheus:
      enabled: true
      listen: 0.0.0.0:9090
      path: /metrics

cors:
  origins:
    - "http://localhost:3000"
    - "http://localhost:5173"
  methods: [GET, POST, OPTIONS]
  headers: [Content-Type, Authorization, X-API-Key]
  credentials: true

override_subgraph_url:
  users: http://localhost:4001/graphql
  projects: http://localhost:4002/graphql
  tasks: http://localhost:4003/graphql
  ai-models: http://localhost:4004/graphql
  analytics: http://localhost:4005/graphql

health_check:
  enabled: true
  listen: 0.0.0.0:8088
  path: /health

logging:
  level: info
  format: json
EOF

    # Start router
    router --config router.yaml \
           --log logs/graphql/router.log \
           --hot-reload &
}

# Start both services
start_services() {
    echo "🎯 Starting network proxy services..."

    # Start mitmproxy
    start_mitmproxy
    MITMPROXY_PID=$!

    # Start Apollo Router
    start_apollo_router
    ROUTER_PID=$!

    echo "✅ Network proxy services started!"
    echo "📋 Service URLs:"
    echo "  • Apollo Router (GraphQL): http://localhost:4000"
    echo "  • Mitmproxy: http://localhost:8080"
    echo "  • Health Check: http://localhost:8088/health"
    echo "  • Prometheus Metrics: http://localhost:9090/metrics"

    # Wait for services
    echo "⏳ Services are starting... Press Ctrl+C to stop"

    # Cleanup function
    cleanup() {
        echo "🧹 Cleaning up services..."
        kill $MITMPROXY_PID 2>/dev/null || true
        kill $ROUTER_PID 2>/dev/null || true
        exit 0
    }

    # Set up signal handlers
    trap cleanup SIGINT SIGTERM

    # Keep running
    wait
}

# Test connectivity
test_connectivity() {
    echo "🔍 Testing network connectivity..."

    # Test local services
    services=(
        "http://localhost:4000/health:Apollo Router"
        "http://localhost:8088/health:Health Check"
        "http://localhost:9090/metrics:Prometheus"
    )

    for service in "${services[@]}"; do
        url=$(echo $service | cut -d: -f1)
        name=$(echo $service | cut -d: -f2)

        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            echo "✅ $name is accessible"
        else
            echo "❌ $name is not accessible"
        fi
    done
}

# Main function
main() {
    case "${1:-start}" in
        "start")
            start_services
            ;;
        "test")
            test_connectivity
            ;;
        "stop")
            echo "🛑 Stopping all proxy services..."
            pkill -f mitmproxy || true
            pkill -f router || true
            echo "✅ Services stopped"
            ;;
        *)
            echo "Usage: $0 {start|test|stop}"
            echo "  start - Start proxy services"
            echo "  test  - Test connectivity"
            echo "  stop  - Stop proxy services"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"