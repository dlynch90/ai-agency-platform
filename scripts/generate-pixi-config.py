#!/usr/bin/env python3
"""
Generate comprehensive Pixi configuration from binary audit inventory
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Set

def load_binary_inventory(inventory_path: Path) -> Dict:
    """Load the binary inventory JSON file"""
    with open(inventory_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_migration_candidates(inventory: Dict) -> Dict[str, List[str]]:
    """Extract binaries that should be migrated to Pixi"""
    categories = {
        "cli_tools": [],
        "languages": [],
        "databases": [],
        "ai_ml": [],
        "infrastructure": [],
        "development": []
    }

    # Define key binaries we want to migrate
    key_binaries = {
        "cli_tools": [
            "fd", "rg", "fzf", "bat", "jq", "yq", "tree", "htop", "gh",
            "stow", "zoxide", "navi", "tldr", "neofetch", "eza", "fd-find",
            "ripgrep", "fzf", "bat", "jq", "yq", "tree", "htop", "gh",
            "pass", "gnu-stow", "zoxide", "navi", "tldr", "neofetch", "eza"
        ],
        "languages": [
            "python", "python3", "node", "npm", "yarn", "pnpm", "rustc", "cargo",
            "go", "java", "javac", "nodejs", "rust", "go", "openjdk"
        ],
        "databases": [
            "psql", "neo4j", "redis-cli", "redis-server", "postgresql", "redis"
        ],
        "ai_ml": [
            "ollama", "huggingface-cli", "transformers", "torch", "accelerate"
        ],
        "infrastructure": [
            "kubectl", "docker", "terraform", "kubernetes", "docker-py"
        ],
        "development": [
            "git", "make", "cmake", "ast-grep", "ruff", "mypy", "black"
        ]
    }

    # Extract from inventory
    for binary_name, binary_info in inventory.get("binaries", {}).items():
        for category, candidates in key_binaries.items():
            if binary_name in candidates and binary_info.get("source") != "system":
                pixi_package = binary_info.get("target_pixi_package", binary_name)
                if pixi_package not in categories[category]:
                    categories[category].append(pixi_package)

    # Add additional known packages not in inventory
    additional_packages = {
        "cli_tools": ["fd-find", "ripgrep", "fzf", "bat", "jq", "yq", "tree", "htop"],
        "databases": ["postgresql", "neo4j", "redis"],
        "ai_ml": ["ollama", "huggingface_hub", "transformers", "torch", "accelerate"],
        "infrastructure": ["kubernetes", "docker-py", "terraform"],
        "development": ["ast-grep", "ruff", "mypy", "black", "pre-commit"]
    }

    for category, packages in additional_packages.items():
        for package in packages:
            if package not in categories[category]:
                categories[category].append(package)

    return categories

def generate_pixi_toml(categories: Dict[str, List[str]]) -> str:
    """Generate the complete pixi.toml configuration"""

    # Header and project info
    toml_content = '''[project]
name = "ai-agency-platform"
version = "0.1.0"
description = "Universal AI Agency Platform with Pixi Package Management"
authors = ["AI Agency <ai@agency.com>"]
channels = ["conda-forge", "pytorch", "nvidia"]
platforms = ["osx-arm64", "linux-64", "win-64"]

[system-requirements]
macos = "11.0"
linux = "20.04"
windows = "10"

[dependencies]
# Core Python ecosystem
python = ">=3.11,<3.13"
pip = "*"
setuptools = "*"
wheel = "*"

'''

    # CLI Tools
    if categories["cli_tools"]:
        toml_content += "# CLI Tools & Utilities\n"
        for tool in sorted(set(categories["cli_tools"])):
            toml_content += f'{tool.replace("-", "_")} = "*"\n'
        toml_content += "\n"

    # Languages
    if categories["languages"]:
        toml_content += "# Programming Languages & Runtimes\n"
        for lang in sorted(set(categories["languages"])):
            if lang in ["nodejs", "node"]:
                toml_content += f'nodejs = "*"\n'
            elif lang == "openjdk":
                toml_content += f'openjdk = "*"\n'
            elif lang == "rust":
                toml_content += f'rust = "*"\n'
            elif lang == "go":
                toml_content += f'go = "*"\n'
            else:
                toml_content += f'{lang} = "*"\n'
        toml_content += "\n"

    # AI/ML Tools
    if categories["ai_ml"]:
        toml_content += "# AI/ML Frameworks & Tools\n"
        for tool in sorted(set(categories["ai_ml"])):
            if tool in ["torch", "transformers", "accelerate"]:
                toml_content += f'{tool} = {{ version = "*", channel = "pytorch" }}\n'
            else:
                toml_content += f'{tool} = "*"\n'
        toml_content += "\n"

    # Databases
    if categories["databases"]:
        toml_content += "# Database Systems & Clients\n"
        for db in sorted(set(categories["databases"])):
            toml_content += f'{db} = "*"\n'
        toml_content += "\n"

    # Infrastructure
    if categories["infrastructure"]:
        toml_content += "# Infrastructure & Cloud Tools\n"
        for infra in sorted(set(categories["infrastructure"])):
            toml_content += f'{infra} = "*"\n'
        toml_content += "\n"

    # Development Tools
    if categories["development"]:
        toml_content += "# Development & Code Quality Tools\n"
        for dev in sorted(set(categories["development"])):
            toml_content += f'{dev} = "*"\n'
        toml_content += "\n"

    # Additional essential packages
    toml_content += '''# Additional Essential Packages
numpy = "*"
scipy = "*"
pandas = "*"
matplotlib = "*"
seaborn = "*"
networkx = "*"
jupyter = "*"
notebook = "*"
ipykernel = "*"
fastapi = "*"
uvicorn = "*"
pydantic = "*"
requests = "*"
httpx = "*"
click = "*"
rich = "*"
pyyaml = "*"
pytest = "*"
black = "*"
ruff = "*"
mypy = "*"
pre-commit = "*"

'''

    # Environments
    toml_content += '''[environments]
default = { features = ["python-dev"], solve-group = "default" }
ai-ml = { features = ["python-dev", "ai-ml"], solve-group = "ai-ml" }
database = { features = ["python-dev", "database"], solve-group = "database" }
infrastructure = { features = ["python-dev", "infrastructure"], solve-group = "infrastructure" }
full-stack = { features = ["python-dev", "ai-ml", "database", "infrastructure"], solve-group = "full-stack" }

[activation.env]
# Environment variables
DEVELOPER_DIR = "${DEVELOPER_DIR:-$HOME/Developer}"
USER_HOME = "${USER_HOME:-$HOME}"
CONFIG_DIR = "${CONFIG_DIR:-$HOME/.config}"
MCP_CONFIG_DIR = "${MCP_CONFIG_DIR:-$HOME/.cursor/mcp}"

'''

    # Tasks
    toml_content += '''[tasks]
# Core tasks
install = "pixi install"
update = "pixi update"
doctor = "pixi run check && pixi run list-tools"
audit = "python scripts/binary-audit.py"
analyze = "python scripts/finite-element-analysis.py"

# Binary audit and organization
binary-audit = "python scripts/binary-audit.py"
organize-files = "python scripts/organize-loose-files.sh"
vendor-compliance = "python scripts/check-vendor-compliance.py"

# FEA tasks
fea-spherical = "python scripts/finite-element-sphere-analysis.py"
fea-markov = "python scripts/markov-chain-analysis.py"
fea-binomial = "python scripts/binomial-edge-case-detection.py"
fea-pipeline = "python scripts/fea-integration-pipeline.py"

# MCP tasks
mcp-audit = "python scripts/mcp-server-audit.py"
mcp-test = "python scripts/test-mcp-servers.js"

# Authentication tasks
auth-setup = "python scripts/cli-authentication-wrapper.sh --setup"

# Tool validation
validate-tools = "pixi run doctor && pixi run mcp-test"
check-compliance = "python scripts/check-vendor-compliance.py"

# Development workflow
dev-setup = "pixi install && pixi run binary-audit && pixi run organize-files"
full-setup = "pixi run dev-setup && pixi run auth-setup && pixi run validate-tools"

# Utility tasks
list-tools = "echo 'Available tools:' && pixi run --list"
clean = "pixi clean --all"

'''

    return toml_content

def main():
    inventory_path = Path("/Users/daniellynch/Developer/docs/audit/binary-inventory.json")

    if not inventory_path.exists():
        print(f"Error: Binary inventory not found at {inventory_path}")
        sys.exit(1)

    # Load inventory
    inventory = load_binary_inventory(inventory_path)

    # Extract migration candidates
    categories = extract_migration_candidates(inventory)

    # Generate pixi.toml
    pixi_config = generate_pixi_toml(categories)

    # Write to file
    output_path = Path("/Users/daniellynch/Developer/pixi.toml")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(pixi_config)

    print("Generated comprehensive pixi.toml configuration")
    print(f"Output saved to: {output_path}")

    # Print summary
    total_packages = sum(len(packages) for packages in categories.values())
    print(f"\nMigration Summary:")
    print(f"Total packages to migrate: {total_packages}")
    for category, packages in categories.items():
        if packages:
            print(f"  {category}: {len(packages)} packages")

if __name__ == "__main__":
    main()