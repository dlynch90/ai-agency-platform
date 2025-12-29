#!/bin/bash

# CLI Workflow Orchestrator for Event-Driven Architecture
# Integrates 20 CLI tools into automated workflows

set -e

# Configuration
WORKSPACE_DIR="/Users/daniellynch/Developer"
LOG_DIR="$WORKSPACE_DIR/logs"
CONFIG_DIR="$WORKSPACE_DIR/configs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_DIR/cli-workflows.log"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_DIR/cli-workflows.log" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_DIR/cli-workflows.log"
}

# Create directories
setup_directories() {
    mkdir -p "$LOG_DIR" "$CONFIG_DIR/workflows"
}

# Code Generation Workflow
# Uses: Gibson CLI, Git, Node.js, TypeScript
workflow_code_generation() {
    local project_name=$1
    local entity_type=$2
    local description=$3

    log "Starting Code Generation Workflow for $project_name"

    # 1. Initialize Gibson project
    if [ ! -d "$WORKSPACE_DIR/$project_name" ]; then
        gibson new project "$project_name"
        cd "$WORKSPACE_DIR/$project_name"
        git init
        git add .
        git commit -m "Initial project setup"
    fi

    cd "$WORKSPACE_DIR/$project_name"

    # 2. Generate code with Gibson
    gibson code api "$entity_type" "$description"
    gibson code models "$entity_type" "$description"
    gibson code tests "$entity_type" "$description"

    # 3. Install dependencies
    pnpm install

    # 4. Build and test
    npm run build
    npm test

    # 5. Commit changes
    git add .
    git commit -m "Generated $entity_type code: $description"

    success "Code generation workflow completed for $project_name"
}

# Infrastructure Deployment Workflow
# Uses: Terraform, Docker, kubectl, Helm, AWS CLI
workflow_infrastructure_deploy() {
    local environment=$1
    local service_name=$2

    log "Starting Infrastructure Deployment Workflow: $service_name -> $environment"

    cd "$WORKSPACE_DIR/infrastructure"

    # 1. Initialize Terraform
    terraform init

    # 2. Plan deployment
    terraform plan -var="environment=$environment" -var="service_name=$service_name"

    # 3. Apply infrastructure
    terraform apply -auto-approve -var="environment=$environment" -var="service_name=$service_name"

    # 4. Build Docker image
    docker build -t "$service_name:$environment" -f "docker/$service_name.Dockerfile" .

    # 5. Push to registry
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com"
    docker tag "$service_name:$environment" "$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/$service_name:$environment"
    docker push "$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/$service_name:$environment"

    # 6. Deploy to Kubernetes
    helm upgrade --install "$service_name-$environment" "helm/$service_name" \
        --namespace "$environment" \
        --set image.tag="$environment" \
        --set environment="$environment"

    # 7. Verify deployment
    kubectl wait --for=condition=available --timeout=300s deployment/"$service_name" -n "$environment"

    success "Infrastructure deployment workflow completed"
}

# Data Processing Workflow
# Uses: Python3, jq, yq, curl, rsync
workflow_data_processing() {
    local source_url=$1
    local target_dir=$2
    local processing_script=$3

    log "Starting Data Processing Workflow"

    # 1. Fetch data
    curl -s "$source_url" | jq '.' > "$target_dir/raw_data.json"

    # 2. Validate data structure
    if ! jq -e '.data' "$target_dir/raw_data.json" >/dev/null; then
        error "Invalid data structure"
        return 1
    fi

    # 3. Transform data
    jq '.data | map({id: .id, name: .name, value: .value})' "$target_dir/raw_data.json" > "$target_dir/transformed_data.json"

    # 4. Convert to YAML for configuration
    yq -P "$target_dir/transformed_data.json" > "$target_dir/data.yaml"

    # 5. Run custom processing script
    python3 "$processing_script" "$target_dir/transformed_data.json" "$target_dir/processed_data.json"

    # 6. Sync to backup location
    rsync -av "$target_dir/" "$BACKUP_DIR/$(basename "$target_dir")/"

    success "Data processing workflow completed"
}

# Testing and Quality Assurance Workflow
# Uses: Jest/Playwright, Git, Docker, make
workflow_testing_qa() {
    local project_dir=$1

    log "Starting Testing and QA Workflow for $project_dir"

    cd "$project_dir"

    # 1. Install dependencies
    pnpm install

    # 2. Run linting
    npm run lint

    # 3. Run unit tests
    npm run test:unit

    # 4. Build application
    npm run build

    # 5. Run integration tests
    npm run test:integration

    # 6. Run E2E tests with Playwright
    npx playwright test

    # 7. Generate coverage report
    npm run coverage

    # 8. Build Docker image for testing
    make docker-build

    # 9. Run container tests
    make docker-test

    # 10. Commit test results
    git add test-results/
    git commit -m "Test results: $(date)"

    success "Testing and QA workflow completed"
}

# Knowledge Management Workflow
# Uses: ByteRover CLI, Gibson CLI, Git
workflow_knowledge_management() {
    local topic=$1
    local content=$2
    local files=("${@:3}")

    log "Starting Knowledge Management Workflow: $topic"

    cd "$WORKSPACE_DIR"

    # 1. Initialize ByteRover if needed
    if [ ! -d ".brv" ]; then
        npx byterover-cli init
    fi

    # 2. Curate knowledge with ByteRover
    file_args=""
    for file in "${files[@]}"; do
        file_args="$file_args -f $file"
    done

    npx byterover-cli curate "$content" $file_args

    # 3. Generate documentation with Gibson
    gibson code docs "$topic" "Generate comprehensive documentation for $topic"

    # 4. Update README
    make docs

    # 5. Commit knowledge updates
    git add docs/ .brv/
    git commit -m "Knowledge update: $topic - $content"

    success "Knowledge management workflow completed"
}

# Monitoring and Alerting Workflow
# Uses: Prometheus, Grafana, curl, jq
workflow_monitoring_alerts() {
    local service_name=$1
    local metric_name=$2
    local threshold=$3

    log "Starting Monitoring and Alerting Workflow: $service_name"

    # 1. Query metrics from Prometheus
    metrics=$(curl -s "http://prometheus:9090/api/v1/query?query=$metric_name")

    # 2. Check threshold
    current_value=$(echo "$metrics" | jq -r '.data.result[0].value[1]')

    if (( $(echo "$current_value > $threshold" | bc -l) )); then
        warning "Threshold exceeded for $metric_name: $current_value > $threshold"

        # 3. Send alert
        curl -X POST "http://alertmanager:9093/api/v2/alerts" \
            -H "Content-Type: application/json" \
            -d "{
                \"labels\": {
                    \"alertname\": \"High${metric_name}\",
                    \"service\": \"$service_name\",
                    \"severity\": \"warning\"
                },
                \"annotations\": {
                    \"summary\": \"High $metric_name detected\",
                    \"description\": \"Current value: $current_value, Threshold: $threshold\"
                }
            }"

        # 4. Scale service if needed
        kubectl scale deployment "$service_name" --replicas=3
    else
        success "Metric $metric_name within normal range: $current_value"
    fi
}

# Backup and Recovery Workflow
# Uses: rsync, git, docker, terraform
workflow_backup_recovery() {
    local backup_type=$1  # "full" or "incremental"
    local target_dir=$2

    log "Starting Backup and Recovery Workflow: $backup_type"

    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="$target_dir/backup_$timestamp"

    mkdir -p "$backup_dir"

    if [ "$backup_type" = "full" ]; then
        # 1. Full backup with rsync
        rsync -av --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.terraform' \
            "$WORKSPACE_DIR/" "$backup_dir/"

        # 2. Backup databases
        docker exec postgres pg_dump -U postgres > "$backup_dir/database.sql"

        # 3. Backup Terraform state
        cp "$WORKSPACE_DIR/infrastructure/.terraform/terraform.tfstate" "$backup_dir/"

        # 4. Backup Docker images
        docker save $(docker images -q) > "$backup_dir/docker_images.tar"

    else
        # Incremental backup
        rsync -av --delete --link-dest="$target_dir/latest" \
            "$WORKSPACE_DIR/" "$backup_dir/"
    fi

    # 5. Create backup manifest
    cat > "$backup_dir/manifest.json" << EOF
{
  "timestamp": "$timestamp",
  "type": "$backup_type",
  "source": "$WORKSPACE_DIR",
  "size": "$(du -sh "$backup_dir" | cut -f1)",
  "files": $(find "$backup_dir" -type f | wc -l)
}
EOF

    # 6. Update latest symlink
    ln -sfn "$backup_dir" "$target_dir/latest"

    # 7. Commit backup metadata to git
    cd "$WORKSPACE_DIR"
    git add "$backup_dir"
    git commit -m "Backup $backup_type: $timestamp"

    success "Backup and recovery workflow completed: $backup_dir"
}

# CI/CD Pipeline Workflow
# Uses: Git, Docker, kubectl, Helm, make
workflow_cicd_pipeline() {
    local branch=$1
    local commit_sha=$2

    log "Starting CI/CD Pipeline Workflow: $branch ($commit_sha)"

    # 1. Checkout code
    git checkout "$branch"
    git reset --hard "$commit_sha"

    # 2. Install dependencies
    pnpm install

    # 3. Run tests
    make test

    # 4. Build application
    make build

    # 5. Build Docker image
    docker build -t "myapp:$commit_sha" .

    # 6. Run security scan
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        clair-scanner --ip 127.0.0.1 "myapp:$commit_sha"

    # 7. Deploy to staging
    helm upgrade --install myapp-staging ./helm/myapp \
        --set image.tag="$commit_sha" \
        --namespace staging

    # 8. Run integration tests
    make test-integration

    # 9. Deploy to production (manual approval needed)
    if [ "$branch" = "main" ]; then
        log "Ready for production deployment - manual approval required"
        # In real scenario, this would trigger manual approval
        # helm upgrade --install myapp ./helm/myapp \
        #     --set image.tag="$commit_sha" \
        #     --namespace production
    fi

    success "CI/CD pipeline workflow completed"
}

# Multi-Environment Deployment Workflow
# Uses: Terraform, Ansible, kubectl, AWS CLI, Azure CLI
workflow_multi_env_deploy() {
    local environment=$1
    local cloud_provider=$2

    log "Starting Multi-Environment Deployment: $environment on $cloud_provider"

    # 1. Select cloud provider tooling
    case $cloud_provider in
        "aws")
            cli_cmd="aws"
            region="us-east-1"
            ;;
        "azure")
            cli_cmd="az"
            region="eastus"
            ;;
        *)
            error "Unsupported cloud provider: $cloud_provider"
            return 1
            ;;
    esac

    # 2. Provision infrastructure with Terraform
    cd "$WORKSPACE_DIR/infrastructure/$cloud_provider"
    terraform workspace select "$environment" 2>/dev/null || terraform workspace new "$environment"
    terraform init
    terraform apply -auto-approve

    # 3. Configure cloud resources
    case $cloud_provider in
        "aws")
            # Create ECR repository
            $cli_cmd ecr describe-repositories --repository-names myapp 2>/dev/null || \
            $cli_cmd ecr create-repository --repository-name myapp

            # Configure networking
            vpc_id=$($cli_cmd ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
            ;;
        "azure")
            # Create ACR
            $cli_cmd acr show --name myregistry 2>/dev/null || \
            $cli_cmd acr create --resource-group mygroup --name myregistry --sku Basic

            # Configure networking
            vnet_id=$($cli_cmd network vnet show --resource-group mygroup --name myvnet --query id --output tsv)
            ;;
    esac

    # 4. Deploy Kubernetes resources
    kubectl config use-context "$environment"
    kubectl apply -f "k8s/$environment/"

    # 5. Verify deployment
    kubectl wait --for=condition=available --timeout=600s deployment/myapp -n "$environment"

    success "Multi-environment deployment completed: $environment on $cloud_provider"
}

# Main workflow dispatcher
main() {
    setup_directories

    case "${1:-}" in
        "code-gen")
            shift
            workflow_code_generation "$@"
            ;;
        "infra-deploy")
            shift
            workflow_infrastructure_deploy "$@"
            ;;
        "data-process")
            shift
            workflow_data_processing "$@"
            ;;
        "testing")
            shift
            workflow_testing_qa "$@"
            ;;
        "knowledge")
            shift
            workflow_knowledge_management "$@"
            ;;
        "monitor")
            shift
            workflow_monitoring_alerts "$@"
            ;;
        "backup")
            shift
            workflow_backup_recovery "$@"
            ;;
        "cicd")
            shift
            workflow_cicd_pipeline "$@"
            ;;
        "multi-deploy")
            shift
            workflow_multi_env_deploy "$@"
            ;;
        "list")
            echo "Available workflows:"
            echo "  code-gen <project> <entity> <description>  - Generate code with Gibson"
            echo "  infra-deploy <env> <service>              - Deploy infrastructure"
            echo "  data-process <url> <dir> <script>         - Process data"
            echo "  testing <project_dir>                     - Run QA pipeline"
            echo "  knowledge <topic> <content> [files...]    - Manage knowledge"
            echo "  monitor <service> <metric> <threshold>    - Check monitoring"
            echo "  backup <type> <target_dir>                - Create backups"
            echo "  cicd <branch> <commit_sha>                - Run CI/CD pipeline"
            echo "  multi-deploy <env> <cloud>                - Multi-cloud deployment"
            ;;
        *)
            echo "Usage: $0 <workflow> [args...]"
            echo "Run '$0 list' for available workflows"
            exit 1
            ;;
    esac
}

main "$@"