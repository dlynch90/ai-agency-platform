#!/bin/bash
# Environment Selector Script
# Unified environment switching for multi-language development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup FEA environment
setup_fea() {
    print_info "Setting up FEA (Finite Element Analysis) environment..."

    # Use mise for tool versions (with error handling)
    if command_exists mise; then
        if mise use python@3.14.2 2>/dev/null && mise use node@25.2.1 2>/dev/null && mise use rust@1.92.0 2>/dev/null; then
            print_status "Tool versions configured with mise"
        else
            print_warning "mise configuration failed, skipping version management"
        fi
    fi

    # Setup pixi environment
    if command_exists pixi; then
        pixi install --environment fea
        print_status "FEA environment installed"
    fi

    print_status "FEA environment ready!"
    echo ""
    echo "Available commands:"
    echo "  pixi run fea          - Start FEA environment"
    echo "  pixi run mesh         - Run meshing tools"
    echo "  pixi run solve        - Run FEA solver"
    echo "  pixi run visualize    - Run visualization"
    echo "  pixi run optimize     - Run optimization"
}

# Function to setup ROS2 environment
setup_ros2() {
    print_info "Setting up ROS2 development environment..."

    # Use mise for tool versions (with error handling)
    if command_exists mise; then
        if mise use python@3.11.0 2>/dev/null && mise use node@20.18.0 2>/dev/null; then
            print_status "Tool versions configured with mise"
        else
            print_warning "mise configuration failed, skipping version management"
        fi
    fi

    # Setup pixi environment
    if command_exists pixi; then
        pixi install --environment robotics
        print_status "ROS2 environment installed"
    fi

    print_status "ROS2 environment ready!"
    echo ""
    echo "Available commands:"
    echo "  pixi run ros-setup    - Setup ROS2 environment"
    echo "  pixi run ros-build    - Build ROS2 packages"
    echo "  pixi run ros-test     - Run ROS2 tests"
    echo "  pixi run gazebo       - Start Gazebo simulation"
    echo "  pixi run rviz         - Start RViz visualization"
}

# Function to setup Node.js environment
setup_nodejs() {
    print_info "Setting up Node.js development environment..."

    # Use mise for tool versions (with error handling)
    if command_exists mise; then
        if mise use node@25.2.1 2>/dev/null; then
            mise use python@3.14.2 2>/dev/null
            print_status "Tool versions configured with mise"
        else
            print_warning "mise configuration failed, skipping version management"
        fi
    fi

    # Setup pixi environment (primary Node.js environment manager)
    if command_exists pixi && [ -f "pixi-node/pixi.toml" ]; then
        if (cd pixi-node && pixi install --quiet 2>/dev/null); then
            print_status "Node.js environment installed via pixi"
        else
            print_warning "pixi setup failed, falling back to npm"
        fi
    fi

    # Install dependencies
    if [ -f "package.json" ]; then
        if npm install 2>/dev/null; then
            print_status "Node.js dependencies installed"
        else
            print_warning "npm install failed, dependencies may need manual installation"
        fi
    fi

    print_status "Node.js environment ready!"
    echo ""
    echo "Available commands:"
    echo "  pixi run node-dev     - Start development server"
    echo "  pixi run node-build   - Build project"
    echo "  pixi run node-test    - Run tests"
    echo "  pixi run node-lint    - Run linter"
}

# Function to setup Java environment
setup_java() {
    print_info "Setting up Java enterprise development environment..."

    # Use mise for Java version (with error handling)
    if command_exists mise; then
        if mise use java@21.0.5+11 2>/dev/null; then
            print_status "Java version configured with mise"
        else
            print_warning "mise configuration failed, using system Java"
        fi
    fi

    # Setup Maven wrapper (check root level)
    if [ -f "./mvnw" ]; then
        ./mvnw --version >/dev/null 2>&1
        print_status "Maven wrapper verified"
    fi

    print_status "Java environment ready!"
    echo ""
    echo "Available commands:"
    echo "  cd java-enterprise-golden-path"
    echo "  ./mvnw clean compile  - Compile project"
    echo "  ./mvnw test          - Run tests"
    echo "  ./mvnw spring-boot:run - Start application"
}

# Function to setup infrastructure environment
setup_infra() {
    print_info "Setting up infrastructure development environment..."

    # Use mise for tool versions
    if command_exists mise; then
        mise use terraform@1.9.8
        mise use kubectl@1.32.0
        mise use helm@3.16.3
        mise use awscli@2.22.0
        mise use go@1.23.4
        print_status "Infrastructure tools configured with mise"
    fi

    # Setup pixi environment
    if command_exists pixi; then
        pixi install --environment infra
        print_status "Infrastructure environment installed"
    fi

    print_status "Infrastructure environment ready!"
    echo ""
    echo "Available tools:"
    echo "  terraform --version"
    echo "  kubectl version --client"
    echo "  helm version"
    echo "  aws --version"
    echo "  go version"
}

# Function to show environment status
show_status() {
    print_info "Environment Status"
    echo "=================="

    # Check mise
    if command_exists mise; then
        echo -e "mise: ${GREEN}✅ installed${NC}"
        mise --version | head -1
    else
        echo -e "mise: ${RED}❌ not installed${NC}"
    fi

    # Check pixi
    if command_exists pixi; then
        echo -e "pixi: ${GREEN}✅ installed${NC}"
        pixi --version
    else
        echo -e "pixi: ${RED}❌ not installed${NC}"
    fi

    # Check Java
    if command_exists java; then
        echo -e "Java: ${GREEN}✅ $(java --version | head -1)${NC}"
    else
        echo -e "Java: ${RED}❌ not installed${NC}"
    fi

    # Check Node.js
    if command_exists node; then
        echo -e "Node.js: ${GREEN}✅ $(node --version)${NC}"
    else
        echo -e "Node.js: ${RED}❌ not installed${NC}"
    fi

    # Check Python
    if command_exists python; then
        echo -e "Python: ${GREEN}✅ $(python --version)${NC}"
    else
        echo -e "Python: ${RED}❌ not installed${NC}"
    fi

    # Check Rust
    if command_exists rustc; then
        echo -e "Rust: ${GREEN}✅ $(rustc --version | cut -d' ' -f2)${NC}"
    else
        echo -e "Rust: ${RED}❌ not installed${NC}"
    fi

    echo ""
    print_info "Available environments:"
    echo "  fea     - Finite Element Analysis"
    echo "  ros2    - ROS2 Robotics Development"
    echo "  nodejs  - Node.js Web Development"
    echo "  java    - Java Enterprise Development"
    echo "  infra   - Infrastructure/DevOps"
    echo "  status  - Show this status"
}

# Main script logic
case "${1:-status}" in
    "fea"|"analysis"|"fea-dev")
        setup_fea
        ;;
    "ros2"|"robotics"|"ros")
        setup_ros2
        ;;
    "nodejs"|"node"|"web"|"frontend")
        setup_nodejs
        ;;
    "java"|"enterprise"|"spring")
        setup_java
        ;;
    "infra"|"infrastructure"|"devops")
        setup_infra
        ;;
    "status"|"info")
        show_status
        ;;
    *)
        print_error "Unknown environment: $1"
        echo ""
        echo "Usage: $0 [environment]"
        echo ""
        echo "Available environments:"
        echo "  fea     - Finite Element Analysis"
        echo "  ros2    - ROS2 Robotics Development"
        echo "  nodejs  - Node.js Web Development"
        echo "  java    - Java Enterprise Development"
        echo "  infra   - Infrastructure/DevOps"
        echo "  status  - Show environment status (default)"
        exit 1
        ;;
esac