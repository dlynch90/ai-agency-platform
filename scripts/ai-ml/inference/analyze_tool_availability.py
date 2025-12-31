#!/usr/bin/env python3
"""
Analyze tool availability and create comprehensive Pixi configuration
"""

import json
import time
import subprocess
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')

# User's comprehensive tool list
TOOLS_LIST = {
    # CLI Tools
    "fd": "fd-find",
    "ripgrep": "ripgrep",
    "fzf": "fzf",
    "bat": "bat",
    "jq": "jq",
    "yq": "yq",
    "tree": "tree",
    "htop": "htop",
    "gh": "gh",
    "pass": "pass",
    "stow": "gnu-stow",
    "zoxide": "zoxide",
    "navi": "navi",
    "tldr": "tldr",
    "neofetch": "neofetch",
    "eza": "eza",

    # Shell and Terminal
    "tmux": "tmux",
    "starship": "starship",
    "zsh": "zsh",
    "fish": "fish",

    # Development Tools
    "nodejs": "nodejs",
    "npm": "npm",
    "pnpm": "pnpm",
    "yarn": "yarn",
    "rust": "rust",
    "cargo": "cargo",
    "rustup": "rustup",
    "go": "go",
    "java": "openjdk",
    "python": "python",
    "pip": "pip",

    # Version Managers
    "pyenv": "pyenv",
    "rbenv": "rbenv",
    "nvm": "nvm",

    # Package Managers
    "brew": "homebrew",  # Note: may not be in conda
    "conda": "conda",

    # Code Analysis and Linting
    "ast-grep": "ast-grep",
    "semgrep": "semgrep",
    "mypy": "mypy",
    "ruff": "ruff",
    "oxlint": "oxlint",
    "dprint": "dprint",

    # Performance Profiling
    "py-spy": "py-spy",
    "memory-profiler": "memory-profiler",
    "line-profiler": "line-profiler",

    # System Monitoring
    "ps": "procps",  # Built-in
    "top": "procps",  # Built-in
    "vm_stat": "procps",  # macOS specific

    # Database and Services
    "postgresql": "postgresql",
    "redis": "redis",

    # Cloud Tools
    "kubectl": "kubernetes",
    "awscli": "awscli",
    "gcloud": "google-cloud-sdk",

    # Text Processing
    "sd": "sd",
    "rg": "ripgrep",
    "grep": "grep",
    "sed": "sed",
    "awk": "gawk",

    # File Management
    "rsync": "rsync",
    "curl": "curl",
    "wget": "wget",

    # Development Servers
    "ollama": "ollama",

    # Code Editors/IDEs
    "vim": "vim",
    "emacs": "emacs",
    "nano": "nano",
}

class ToolAnalyzer:
    def __init__(self):
        self.project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")
        self.report_path = self.project_root / "tool_availability_report.json"
        self.new_pixi_toml_path = self.project_root / "pixi-comprehensive.toml"

        # Debug logging temporarily disabled due to permissions
        pass

    def check_conda_availability(self, conda_name):
        """Check if a tool is available in conda"""
        try:
            result = subprocess.run(['conda', 'search', conda_name, '--json'],
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return len(data.get(conda_name, [])) > 0
            return False
        except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
            return False

    def check_pixi_availability(self, conda_name):
        """Check if a tool can be installed via pixi"""
        try:
            # Try to see if pixi can resolve the package
            result = subprocess.run(['pixi', 'add', '--dry-run', conda_name],
                                  capture_output=True, text=True, timeout=30, cwd=self.project_root)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False

    def check_command_availability(self, command):
        """Check if a command is available in PATH"""
        try:
            result = subprocess.run(['which', command], capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            return False

    def analyze_tools(self):
        """Analyze all tools for availability"""
        logging.info("🔍 Analyzing tool availability...")

        results = {}
        available_via_conda = 0
        available_via_pixi = 0
        available_in_path = 0

        for tool_name, conda_name in TOOLS_LIST.items():
            tool_result = {
                "conda_name": conda_name,
                "available_via_conda": False,
                "available_via_pixi": False,
                "available_in_path": False,
                "path_location": None
            }

            # Check conda availability
            tool_result["available_via_conda"] = self.check_conda_availability(conda_name)
            if tool_result["available_via_conda"]:
                available_via_conda += 1

            # Check pixi availability (sample check - too slow for all)
            if tool_name in ["fd", "ripgrep", "fzf", "bat", "jq"]:  # Check a few key ones
                tool_result["available_via_pixi"] = self.check_pixi_availability(conda_name)
                if tool_result["available_via_pixi"]:
                    available_via_pixi += 1

            # Check PATH availability
            tool_result["available_in_path"] = self.check_command_availability(tool_name)
            if tool_result["available_in_path"]:
                available_in_path += 1
                try:
                    path_result = subprocess.run(['which', tool_name], capture_output=True, text=True)
                    tool_result["path_location"] = path_result.stdout.strip()
                except:
                    pass

            results[tool_name] = tool_result

            # Debug logging temporarily disabled

        summary = {
            "total_tools": len(TOOLS_LIST),
            "available_via_conda": available_via_conda,
            "available_via_pixi": available_via_pixi,
            "available_in_path": available_in_path,
            "tools": results
        }

        # Debug logging temporarily disabled

        return summary

    def generate_comprehensive_pixi_config(self, analysis_results):
        """Generate comprehensive pixi.toml with available tools"""

        pixi_config = {
            "workspace": {
                "authors": ["Daniel Lynch <developer@empathyfirstmedia.com>"],
                "channels": ["conda-forge", "https://prefix.dev/conda-forge"],
                "name": "comprehensive-developer-environment",
                "platforms": ["osx-arm64", "linux-64"],
                "version": "0.1.0",
                "description": "Comprehensive development environment with all essential tools"
            },
            "dependencies": {},
            "tasks": {}
        }

        # Add core Python/ML stack
        pixi_config["dependencies"].update({
            "python": ">=3.11,<3.12",
            "numpy": ">=1.26.0,<2",
            "scipy": ">=1.12.0,<2",
            "pandas": ">=2.2.0,<3",
            "matplotlib": ">=3.8.0,<4",
            "jupyter": ">=1.0.0,<2",
            "pytorch": ">=2.2.0,<3",
            "scikit-learn": ">=1.4.0,<2"
        })

        # Add available tools from analysis
        available_tools = [tool for tool, data in analysis_results["tools"].items()
                          if data["available_via_conda"]]

        for tool in available_tools:
            conda_name = TOOLS_LIST[tool]
            if conda_name not in pixi_config["dependencies"]:
                pixi_config["dependencies"][conda_name] = "*"

        # Add tasks for common operations
        pixi_config["tasks"].update({
            "install": "pip install --upgrade pip setuptools wheel",
            "clean": "pip cache purge",
            "test": "python -c 'import numpy, scipy, matplotlib, torch, sklearn; print(\"ML/AI stack ready\")'",
            "start": "echo '🚀 Comprehensive Environment Ready!'",
            "check": "pixi run test && echo '✅ All systems ready!'",
            "lint": "ruff check . && mypy .",
            "format": "ruff format .",
            "profile": "python -m cProfile -s cumtime",
            "monitor": "htop",
            "search": "fzf --version && echo 'Interactive search ready'",
            "analyze": "ast-grep --version && echo 'Code analysis ready'",
            "benchmark": "python -c 'import time; print(f\"Benchmark: {time.time()}\")'"
        })

        return pixi_config

    def create_comprehensive_pixi_toml(self, config):
        """Create the comprehensive pixi.toml file"""

        toml_content = f"""[workspace]
authors = {config["workspace"]["authors"]}
channels = {config["workspace"]["channels"]}
name = "{config["workspace"]["name"]}"
platforms = {config["workspace"]["platforms"]}
version = "{config["workspace"]["version"]}"
description = "{config["workspace"]["description"]}"

[dependencies]
"""

        # Add dependencies
        for dep, version in config["dependencies"].items():
            toml_content += f'{dep} = "{version}"\n'

        toml_content += "\n[tasks]\n"

        # Add tasks
        for task_name, command in config["tasks"].items():
            toml_content += f'{task_name} = "{command}"\n'

        with open(self.new_pixi_toml_path, 'w') as f:
            f.write(toml_content)

        logging.info(f"✅ Comprehensive pixi.toml created at {self.new_pixi_toml_path}")
        return True

    def run_analysis(self):
        """Run complete tool analysis"""

        logging.info("🚀 STARTING COMPREHENSIVE TOOL ANALYSIS")
        logging.info("=" * 60)

        # Analyze tool availability
        analysis_results = self.analyze_tools()

        # Save analysis report
        with open(self.report_path, 'w') as f:
            json.dump(analysis_results, f, indent=2)

        logging.info(f"📄 Analysis report saved to: {self.report_path}")
        logging.info(f"📊 Tools available via conda: {analysis_results['available_via_conda']}/{analysis_results['total_tools']}")
        logging.info(f"📊 Tools available in PATH: {analysis_results['available_in_path']}/{analysis_results['total_tools']}")

        # Generate comprehensive pixi config
        logging.info("\n🏗️ Generating comprehensive Pixi configuration...")
        pixi_config = self.generate_comprehensive_pixi_config(analysis_results)

        # Create the pixi.toml
        self.create_comprehensive_pixi_toml(pixi_config)

        logging.info("\n" + "=" * 60)
        logging.info("🎯 TOOL ANALYSIS COMPLETE")
        logging.info("=" * 60)

        return analysis_results

if __name__ == "__main__":
    analyzer = ToolAnalyzer()
    analyzer.run_analysis()