#!/bin/bash
# Comprehensive Containerization Setup
# Docker Hub, Test Containers, WebContainers, and Kubernetes Integration

echo "🐳 Setting up Comprehensive Containerization..."

# =============================================================================
# 1. DOCKER HUB & REGISTRY CONFIGURATION
# =============================================================================

echo "📦 Configuring Docker Hub and Registry..."

# Docker configuration
DOCKER_CONFIG_DIR="$HOME/.docker"
mkdir -p "$DOCKER_CONFIG_DIR"

# Docker config.json (fix the corrupted one)
cat > "$DOCKER_CONFIG_DIR/config.json" << 'EOF'
{
  "auths": {
    "https://index.docker.io/v1/": {},
    "https://registry.hub.docker.com/": {}
  },
  "credsStore": "desktop",
  "currentContext": "default"
}
EOF

# Docker daemon configuration
DOCKER_DAEMON_CONFIG="$HOME/.docker/daemon.json"
cat > "$DOCKER_DAEMON_CONFIG" << 'EOF'
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# =============================================================================
# 2. TEST CONTAINERS SETUP
# =============================================================================

echo "🧪 Setting up Test Containers..."

# Create testcontainers configuration
TESTCONTAINERS_DIR="$HOME/.testcontainers"
mkdir -p "$TESTCONTAINERS_DIR"

cat > "$TESTCONTAINERS_DIR/testcontainers.properties" << 'EOF'
# TestContainers Configuration
# https://www.testcontainers.org/

# Docker settings
docker.client.strategy=org.testcontainers.dockerclient.UnixSocketClientProviderStrategy
docker.host=unix:///var/run/docker.sock

# Reuse containers for faster tests
testcontainers.reuse.enable=true

# Ryuk container settings (cleanup)
ryuk.container.privileged=true
ryuk.container.image=testcontainers/ryuk:0.5.1

# Network settings
docker.network=default

# Logging
org.testcontainers.logging.level=INFO
EOF

# =============================================================================
# 3. WEBCONTAINERS.IO CONFIGURATION
# =============================================================================

echo "🌐 Setting up WebContainers..."

# WebContainers configuration for Node.js development
WEBCONTAINERS_DIR="$HOME/.webcontainers"
mkdir -p "$WEBCONTAINERS_DIR"

cat > "$WEBCONTAINERS_DIR/config.json" << 'EOF'
{
  "version": "1.0",
  "features": {
    "terminal": true,
    "filesystem": true,
    "networking": true,
    "process": true
  },
  "runtime": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "security": {
    "allowEval": false,
    "allowFsAccess": true,
    "allowNetworkAccess": true,
    "allowProcessAccess": false
  }
}
EOF

# =============================================================================
# 4. HELM & KUBERNETES SETUP
# =============================================================================

echo "⚓ Setting up Helm and Kubernetes..."

# Helm configuration
HELM_DIR="$HOME/.helm"
mkdir -p "$HELM_DIR"

# Helm repositories configuration
cat > "$HELM_DIR/repositories.yaml" << 'EOF'
repositories:
- name: bitnami
  url: https://charts.bitnami.com/bitnami
- name: stable
  url: https://charts.helm.sh/stable
- name: ingress-nginx
  url: https://kubernetes.github.io/ingress-nginx
- name: jetstack
  url: https://charts.jetstack.io
- name: prometheus-community
  url: https://prometheus-community.github.io/helm-charts
EOF

# Kubernetes configuration
KUBE_DIR="$HOME/.kube"
mkdir -p "$KUBE_DIR"

# Create basic kubeconfig template
cat > "$KUBE_DIR/config.template" << 'EOF'
apiVersion: v1
kind: Config
current-context: docker-desktop
contexts:
- context:
    cluster: docker-desktop
    user: docker-desktop
  name: docker-desktop
clusters:
- cluster:
    server: https://kubernetes.docker.internal:6443
  name: docker-desktop
users:
- name: docker-desktop
  user:
    client-certificate-data: <CERT_DATA>
    client-key-data: <KEY_DATA>
EOF

# =============================================================================
# 5. ARTIFACT HUB & CLOUDSMITH INTEGRATION
# =============================================================================

echo "📦 Setting up Artifact Hub and Cloudsmith..."

# Artifact Hub configuration
ARTIFACT_HUB_DIR="$HOME/.artifact-hub"
mkdir -p "$ARTIFACT_HUB_DIR"

cat > "$ARTIFACT_HUB_DIR/config.yaml" << 'EOF'
# Artifact Hub Configuration
# https://artifacthub.io/

apiVersion: v1
kind: Config

# Repositories to track
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
    kind: Helm
  - name: docker-hub
    url: https://hub.docker.com
    kind: Container
  - name: cloudsmith
    url: https://cloudsmith.io
    kind: Package

# UI preferences
ui:
  theme: auto
  language: en
EOF

# Cloudsmith configuration
CLOUDSMITH_DIR="$HOME/.cloudsmith"
mkdir -p "$CLOUDSMITH_DIR"

cat > "$CLOUDSMITH_DIR/config.yaml" << 'EOF'
# Cloudsmith Configuration
# https://cloudsmith.io/

apiVersion: v1
kind: Config

# Authentication (to be filled by user)
auth:
  api_key: "${CLOUDSMITH_API_KEY}"
  username: "${CLOUDSMITH_USERNAME}"

# Default organization
organization: "${CLOUDSMITH_ORG:-personal}"

# Repositories
repositories:
  - name: helm-charts
    type: helm
  - name: docker-images
    type: docker
  - name: python-packages
    type: python
EOF

# =============================================================================
# 6. DOCKER EXTENSIONS CONFIGURATION
# =============================================================================

echo "🔌 Setting up Docker Extensions..."

# Docker Extensions directory
DOCKER_EXTENSIONS_DIR="$HOME/.docker/extensions"
mkdir -p "$DOCKER_EXTENSIONS_DIR"

# Create extensions manifest
cat > "$DOCKER_EXTENSIONS_DIR/extensions.json" << 'EOF'
{
  "extensions": [
    {
      "name": "disk-usage-extension",
      "description": "Monitor disk usage in containers",
      "vendor": "Docker",
      "version": "latest"
    },
    {
      "name": "resource-usage-extension",
      "description": "Monitor resource usage",
      "vendor": "Docker",
      "version": "latest"
    },
    {
      "name": "kubernetes-extension",
      "description": "Kubernetes integration",
      "vendor": "Docker",
      "version": "latest"
    }
  ]
}
EOF

# =============================================================================
# 7. CONTAINER DEVELOPMENT WORKFLOW
# =============================================================================

echo "🚀 Setting up Container Development Workflow..."

# Create container development scripts
CONTAINER_SCRIPTS_DIR="$HOME/.container-scripts"
mkdir -p "$CONTAINER_SCRIPTS_DIR"

# Docker development aliases and functions
cat > "$CONTAINER_SCRIPTS_DIR/docker-aliases.sh" << 'EOF'
#!/bin/bash
# Docker Development Aliases and Functions

# Docker aliases
alias d='docker'
alias dc='docker-compose'
alias dcu='docker-compose up'
alias dcd='docker-compose down'
alias dcb='docker-compose build'
alias dcl='docker-compose logs'
alias dce='docker-compose exec'
alias dcr='docker-compose run'

# Docker cleanup
alias docker-clean='docker system prune -f && docker volume prune -f'
alias docker-nuke='docker system prune -a -f --volumes'

# Docker development
alias docker-dev='docker run -it --rm -v $(pwd):/app -w /app'
alias docker-node='docker-dev node:18-alpine'
alias docker-python='docker-dev python:3.11-alpine'

# Test containers
alias test-containers='docker run --rm -v $(pwd):/app testcontainers/ryuk:latest'

# Kubernetes aliases
alias k='kubectl'
alias kg='kubectl get'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgn='kubectl get nodes'
alias kga='kubectl get all'
alias kl='kubectl logs'
alias kx='kubectl exec -it'

# Helm aliases
alias h='helm'
alias hi='helm install'
alias hu='helm upgrade'
alias hd='helm delete'
alias hl='helm list'
alias hs='helm status'

# Container health checks
docker_health() {
    echo "🐳 Docker System Health:"
    echo "Containers: $(docker ps | wc -l) running, $(docker ps -a | wc -l) total"
    echo "Images: $(docker images | wc -l)"
    echo "Volumes: $(docker volume ls | wc -l)"
    echo "Networks: $(docker network ls | wc -l)"
    echo ""
    echo "💾 Disk Usage:"
    docker system df
}
EOF

chmod +x "$CONTAINER_SCRIPTS_DIR/docker-aliases.sh"

# =============================================================================
# 8. INTEGRATION WITH EXISTING TOOLS
# =============================================================================

echo "🔗 Integrating with existing development tools..."

# Update shell configuration to include container tools
SHELL_CONFIG_UPDATE="$HOME/.container-integration"

cat > "$SHELL_CONFIG_UPDATE" << 'EOF'
# Container Integration for Shell
# Source this in your shell configuration

# Load container aliases
if [ -f "$HOME/.container-scripts/docker-aliases.sh" ]; then
    source "$HOME/.container-scripts/docker-aliases.sh"
fi

# Add container tools to PATH
export PATH="$HOME/.container-scripts:$PATH"

# Container environment variables
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export TESTCONTAINERS_RYUK_DISABLED=false

# Kubernetes context
export KUBECONFIG="$HOME/.kube/config"

# Helm environment
export HELM_HOME="$HOME/.helm"
EOF

# =============================================================================
# 9. VALIDATION SCRIPTS
# =============================================================================

echo "✅ Creating validation scripts..."

# Container validation script
cat > "$CONTAINER_SCRIPTS_DIR/validate-containers.sh" << 'EOF'
#!/bin/bash
# Container Environment Validation

echo "🔍 Validating Container Environment..."
echo "====================================="

# Check Docker
echo "🐳 Docker Status:"
if command -v docker >/dev/null 2>&1; then
    docker --version
    docker-compose --version
    echo "✅ Docker available"
else
    echo "❌ Docker not found"
fi

# Check Kubernetes
echo ""
echo "⚓ Kubernetes Status:"
if command -v kubectl >/dev/null 2>&1; then
    kubectl version --client --short
    echo "✅ kubectl available"
else
    echo "❌ kubectl not found"
fi

# Check Helm
echo ""
echo "🧭 Helm Status:"
if command -v helm >/dev/null 2>&1; then
    helm version --short
    echo "✅ Helm available"
else
    echo "❌ Helm not found"
fi

# Check configurations
echo ""
echo "⚙️ Configuration Status:"
configs=(
    "$HOME/.docker/config.json:🐳 Docker config"
    "$HOME/.testcontainers/testcontainers.properties:🧪 TestContainers config"
    "$HOME/.webcontainers/config.json:🌐 WebContainers config"
    "$HOME/.helm/repositories.yaml:⚓ Helm repositories"
    "$HOME/.artifact-hub/config.yaml:📦 Artifact Hub config"
)

for config in "${configs[@]}"; do
    file="${config%%:*}"
    desc="${config#*:}"
    if [ -f "$file" ]; then
        echo "✅ $desc: Found"
    else
        echo "❌ $desc: Missing"
    fi
done

echo ""
echo "🎯 Next Steps:"
echo "1. Start Docker Desktop"
echo "2. Configure Docker Hub credentials: docker login"
echo "3. Initialize Kubernetes cluster (if using local)"
echo "4. Add Helm repositories: helm repo add bitnami https://charts.bitnami.com/bitnami"
echo "5. Test with: docker run hello-world"

echo "====================================="
EOF

chmod +x "$CONTAINER_SCRIPTS_DIR/validate-containers.sh"

# =============================================================================
# 10. DOCUMENTATION
# =============================================================================

echo "📚 Creating documentation..."

# Create README for container setup
cat > "$CONTAINER_SCRIPTS_DIR/README.md" << 'EOF'
# Containerization Setup

This directory contains comprehensive containerization setup for the polyglot development environment.

## Components

### 🐳 Docker Hub Integration
- Registry: `https://registry.hub.docker.com/`
- Configuration: `~/.docker/config.json`
- Daemon config: `~/.docker/daemon.json`

### 🧪 Test Containers
- Configuration: `~/.testcontainers/testcontainers.properties`
- Enables reusable containers for testing
- Automatic cleanup with Ryuk

### 🌐 WebContainers
- Configuration: `~/.webcontainers/config.json`
- Node.js runtime in browser environment
- Security policies configured

### ⚓ Helm & Kubernetes
- Helm repositories: `~/.helm/repositories.yaml`
- Kubernetes config template: `~/.kube/config.template`
- Bitnami charts: `https://charts.bitnami.com/bitnami`

### 📦 Artifact Management
- Artifact Hub: `~/.artifact-hub/config.yaml`
- Cloudsmith: `~/.cloudsmith/config.yaml`
- Multi-registry support

## Usage

### Quick Start
```bash
# Validate setup
./validate-containers.sh

# Load aliases
source ~/.container-integration

# Check Docker health
docker_health

# Test containers
docker run hello-world
```

### Development Workflow
```bash
# Start development environment
dcu

# Run tests with containers
test-containers

# Deploy with Helm
helm install my-app bitnami/nginx
```

### Kubernetes Operations
```bash
# Get cluster info
kgn

# Deploy application
k apply -f deployment.yaml

# Check logs
kl -f deployment/my-app
```

## Security Notes

- Docker daemon configured with BuildKit
- Test containers use privileged mode for Ryuk cleanup
- WebContainers have restricted eval permissions
- Network access controlled per component

## Troubleshooting

1. **Docker won't start**: Check Docker Desktop is running
2. **Permission denied**: Ensure user is in docker group
3. **Kubernetes connection**: Verify cluster configuration
4. **Helm repo issues**: Update repositories with `helm repo update`

## Resources

- [Docker Hub](https://hub.docker.com/)
- [Test Containers](https://testcontainers.com/)
- [WebContainers](https://webcontainers.io/)
- [Helm Charts](https://charts.bitnami.com/)
- [Artifact Hub](https://artifacthub.io/)
EOF

echo "✅ Containerization setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start Docker Desktop"
echo "2. Run: ./validate-containers.sh"
echo "3. Configure Docker Hub: docker login"
echo "4. Initialize Kubernetes if needed"
echo "5. Add Helm repos: helm repo add bitnami https://charts.bitnami.com/bitnami"