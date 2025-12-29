#!/usr/bin/env python3
"""
Comprehensive Binary Audit Script
Audits all binaries from system, Node.js, Python, Homebrew, Rust, Go sources

Creates comprehensive inventory and maps binaries to Pixi package management
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class BinaryInfo:
    """Information about a binary/executable"""
    name: str
    path: Optional[str] = None
    version: Optional[str] = None
    source: str = ""  # system, node, python, homebrew, rust, go
    category: str = ""  # runtime, build, test, dev, cli
    package_manager: str = ""  # pixi, npm, pip, brew, cargo, go
    description: str = ""

@dataclass
class BinaryAudit:
    """Complete binary audit results"""
    system_binaries: List[BinaryInfo] = field(default_factory=list)
    node_binaries: List[BinaryInfo] = field(default_factory=list)
    python_binaries: List[BinaryInfo] = field(default_factory=list)
    homebrew_binaries: List[BinaryInfo] = field(default_factory=list)
    rust_binaries: List[BinaryInfo] = field(default_factory=list)
    go_binaries: List[BinaryInfo] = field(default_factory=list)
    pixi_mapping: Dict[str, str] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)

class BinaryAuditor:
    """Comprehensive binary auditing system"""

    def __init__(self):
        self.audit = BinaryAudit()

        # Binary categories and their typical uses
        self.categories = {
            'runtime': ['node', 'python3', 'java', 'ruby', 'php', 'go', 'rustc'],
            'build': ['make', 'cmake', 'gradle', 'maven', 'webpack', 'vite', 'tsc'],
            'test': ['jest', 'vitest', 'pytest', 'junit', 'cypress', 'playwright'],
            'dev': ['git', 'docker', 'kubectl', 'terraform', 'aws', 'az', 'gcloud'],
            'cli': ['jq', 'yq', 'bat', 'fd', 'rg', 'fzf', 'htop', 'tree']
        }

    def perform_audit(self) -> BinaryAudit:
        """Main audit function"""
        print("🔍 Performing comprehensive binary audit...")

        # Audit each source
        self._audit_system_binaries()
        self._audit_node_binaries()
        self._audit_python_binaries()
        self._audit_homebrew_binaries()
        self._audit_rust_binaries()
        self._audit_go_binaries()

        # Create Pixi mapping
        self._create_pixi_mapping()

        # Generate recommendations
        self._generate_recommendations()

        # Generate report
        self._generate_report()

        print(f"✅ Binary audit complete:")
        print(f"   System: {len(self.audit.system_binaries)} binaries")
        print(f"   Node.js: {len(self.audit.node_binaries)} binaries")
        print(f"   Python: {len(self.audit.python_binaries)} binaries")
        print(f"   Homebrew: {len(self.audit.homebrew_binaries)} binaries")
        print(f"   Rust: {len(self.audit.rust_binaries)} binaries")
        print(f"   Go: {len(self.audit.go_binaries)} binaries")

        return self.audit

    def _audit_system_binaries(self):
        """Audit system-installed binaries"""
        print("📊 Auditing system binaries...")

        # Common system paths
        system_paths = [
            '/usr/local/bin',
            '/usr/bin',
            '/bin',
            '/usr/sbin',
            '/sbin',
            '/opt/homebrew/bin',  # macOS Homebrew
            '/usr/local/sbin'
        ]

        audited_binaries = set()

        for path in system_paths:
            if os.path.exists(path):
                try:
                    for item in os.listdir(path):
                        full_path = os.path.join(path, item)
                        if os.path.isfile(full_path) and os.access(full_path, os.X_OK):
                            if item not in audited_binaries:
                                binary_info = BinaryInfo(
                                    name=item,
                                    path=full_path,
                                    source='system'
                                )
                                binary_info.category = self._categorize_binary(item)
                                self.audit.system_binaries.append(binary_info)
                                audited_binaries.add(item)
                except PermissionError:
                    continue

        # Sort by name
        self.audit.system_binaries.sort(key=lambda x: x.name)

    def _audit_node_binaries(self):
        """Audit Node.js/npm binaries"""
        print("📦 Auditing Node.js binaries...")

        try:
            # Global npm packages
            result = subprocess.run(['npm', 'list', '-g', '--depth=0'],
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if line.strip() and not line.startswith(' ') and '@' in line:
                        parts = line.strip().split('@')
                        if len(parts) >= 2:
                            package_name = parts[0].replace('+-- ', '').strip()
                            version = parts[-1]

                            binary_info = BinaryInfo(
                                name=package_name,
                                version=version,
                                source='node',
                                package_manager='npm'
                            )
                            binary_info.category = self._categorize_binary(package_name)
                            self.audit.node_binaries.append(binary_info)

        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("⚠️  npm not available or timed out")

        # Check for npx accessible packages
        common_npm_packages = [
            'typescript', 'eslint', 'prettier', 'webpack', 'vite', 'jest',
            'vitest', 'playwright', 'cypress', 'prisma', 'graphql'
        ]

        for package in common_npm_packages:
            try:
                result = subprocess.run(['npx', package, '--version'],
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    version = result.stdout.strip().split('\n')[0]
                    # Only add if not already in global list
                    if not any(b.name == package for b in self.audit.node_binaries):
                        binary_info = BinaryInfo(
                            name=package,
                            version=version,
                            source='node',
                            package_manager='npm'
                        )
                        binary_info.category = self._categorize_binary(package)
                        self.audit.node_binaries.append(binary_info)
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                continue

    def _audit_python_binaries(self):
        """Audit Python/pip binaries"""
        print("🐍 Auditing Python binaries...")

        try:
            # Global pip packages
            result = subprocess.run(['pip', 'list', '--format=json'],
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                packages = json.loads(result.stdout)
                for package in packages:
                    name = package.get('name', '').lower()
                    version = package.get('version', '')

                    binary_info = BinaryInfo(
                        name=name,
                        version=version,
                        source='python',
                        package_manager='pip'
                    )
                    binary_info.category = self._categorize_binary(name)
                    self.audit.python_binaries.append(binary_info)

        except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError):
            print("⚠️  pip not available or timed out")

    def _audit_homebrew_binaries(self):
        """Audit Homebrew binaries"""
        print("🍺 Auditing Homebrew binaries...")

        try:
            # Homebrew installed packages
            result = subprocess.run(['brew', 'list'],
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                packages = result.stdout.strip().split('\n')
                for package in packages:
                    package = package.strip()
                    if package:
                        try:
                            # Get version
                            version_result = subprocess.run(['brew', 'info', package],
                                                          capture_output=True, text=True, timeout=10)
                            version = "unknown"
                            if version_result.returncode == 0:
                                lines = version_result.stdout.split('\n')
                                if lines and '/' in lines[0]:
                                    version = lines[0].split('/')[-1].split()[0]

                            binary_info = BinaryInfo(
                                name=package,
                                version=version,
                                source='homebrew',
                                package_manager='brew'
                            )
                            binary_info.category = self._categorize_binary(package)
                            self.audit.homebrew_binaries.append(binary_info)
                        except subprocess.TimeoutExpired:
                            continue

        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("⚠️  Homebrew not available")

    def _audit_rust_binaries(self):
        """Audit Rust/cargo binaries"""
        print("🦀 Auditing Rust binaries...")

        try:
            # Cargo installed binaries
            result = subprocess.run(['cargo', 'install', '--list'],
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if line.strip() and not line.startswith(' ') and ':' in line:
                        parts = line.split(':')
                        if len(parts) >= 2:
                            name = parts[0].strip()
                            version = parts[1].strip().split()[0] if len(parts[1].strip().split()) > 0 else "unknown"

                            binary_info = BinaryInfo(
                                name=name,
                                version=version,
                                source='rust',
                                package_manager='cargo'
                            )
                            binary_info.category = self._categorize_binary(name)
                            self.audit.rust_binaries.append(binary_info)

        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("⚠️  Cargo not available")

    def _audit_go_binaries(self):
        """Audit Go binaries"""
        print("🐹 Auditing Go binaries...")

        # Check common Go binary locations
        go_paths = [
            os.path.expanduser('~/go/bin'),
            '/usr/local/go/bin',
            '/opt/homebrew/opt/go/libexec/bin'
        ]

        for go_path in go_paths:
            if os.path.exists(go_path):
                try:
                    for item in os.listdir(go_path):
                        full_path = os.path.join(go_path, item)
                        if os.path.isfile(full_path) and os.access(full_path, os.X_OK):
                            binary_info = BinaryInfo(
                                name=item,
                                path=full_path,
                                source='go',
                                package_manager='go'
                            )
                            binary_info.category = self._categorize_binary(item)
                            self.audit.go_binaries.append(binary_info)
                except PermissionError:
                    continue

    def _categorize_binary(self, name: str) -> str:
        """Categorize a binary by its name"""
        name_lower = name.lower()

        for category, binaries in self.categories.items():
            if any(bin_name in name_lower for bin_name in binaries):
                return category

        # Additional categorization logic
        if any(keyword in name_lower for keyword in ['git', 'docker', 'kubectl', 'terraform']):
            return 'dev'
        elif any(keyword in name_lower for keyword in ['jq', 'yq', 'bat', 'fd', 'rg', 'fzf']):
            return 'cli'
        elif any(keyword in name_lower for keyword in ['test', 'spec', 'jest', 'mocha']):
            return 'test'
        elif any(keyword in name_lower for keyword in ['build', 'compile', 'webpack', 'babel']):
            return 'build'
        else:
            return 'runtime'

    def _create_pixi_mapping(self):
        """Create mapping of binaries to Pixi packages"""
        print("📋 Creating Pixi package mappings...")

        # Common Pixi package mappings
        pixi_mappings = {
            # CLI tools
            'bat': 'bat',
            'fd': 'fd_find',
            'fzf': 'fzf',
            'htop': 'htop',
            'jq': 'jq',
            'ripgrep': 'ripgrep',
            'tree': 'tree',
            'yq': 'yq',

            # AI/ML
            'accelerate': 'accelerate',
            'transformers': 'transformers',
            'huggingface-hub': 'huggingface_hub',
            'ollama': 'ollama',

            # Databases
            'neo4j': 'neo4j',
            'postgresql': 'postgresql',
            'redis': 'redis',

            # Development tools
            'black': 'black',
            'ruff': 'ruff',
            'mypy': 'mypy',
            'pre-commit': 'pre-commit',
            'ast-grep': 'ast-grep',

            # Node.js equivalents (if available in conda-forge)
            'typescript': 'typescript',
            'eslint': 'eslint',
            'prettier': 'prettier'
        }

        # Create reverse mapping for all audited binaries
        all_binaries = (self.audit.system_binaries + self.audit.node_binaries +
                       self.audit.python_binaries + self.audit.homebrew_binaries +
                       self.audit.rust_binaries + self.audit.go_binaries)

        for binary in all_binaries:
            if binary.name in pixi_mappings:
                self.audit.pixi_mapping[binary.name] = pixi_mappings[binary.name]
            elif binary.source in ['python', 'pip']:
                # For Python packages, they can often be installed via conda-forge
                self.audit.pixi_mapping[binary.name] = f"python-{binary.name}"
            else:
                # Fallback mapping
                self.audit.pixi_mapping[binary.name] = f"conda-forge::{binary.name}"

    def _generate_recommendations(self):
        """Generate recommendations based on audit results"""
        self.audit.recommendations = [
            "Consolidate all binaries under Pixi package management for reproducibility",
            f"Add {len(self.audit.node_binaries)} Node.js packages to Pixi configuration",
            f"Add {len(self.audit.python_binaries)} Python packages to Pixi configuration",
            "Replace Homebrew installations with Pixi-managed packages where possible",
            "Use Pixi environments for isolated development setups",
            "Document all binary dependencies in pixi.toml for team consistency"
        ]

        # Check for version conflicts or duplicates
        all_names = set()
        duplicates = set()

        all_binaries = (self.audit.system_binaries + self.audit.node_binaries +
                       self.audit.python_binaries + self.audit.homebrew_binaries +
                       self.audit.rust_binaries + self.audit.go_binaries)

        for binary in all_binaries:
            if binary.name in all_names:
                duplicates.add(binary.name)
            all_names.add(binary.name)

        if duplicates:
            self.audit.recommendations.append(
                f"Resolve {len(duplicates)} duplicate binaries: {', '.join(list(duplicates)[:5])}{'...' if len(duplicates) > 5 else ''}"
            )

    def _generate_report(self):
        """Generate comprehensive audit report"""
        output_dir = Path('data/binary_audit')
        output_dir.mkdir(parents=True, exist_ok=True)

        # Summary statistics
        total_binaries = (len(self.audit.system_binaries) + len(self.audit.node_binaries) +
                         len(self.audit.python_binaries) + len(self.audit.homebrew_binaries) +
                         len(self.audit.rust_binaries) + len(self.audit.go_binaries))

        report = {
            'summary': {
                'total_binaries': total_binaries,
                'by_source': {
                    'system': len(self.audit.system_binaries),
                    'node': len(self.audit.node_binaries),
                    'python': len(self.audit.python_binaries),
                    'homebrew': len(self.audit.homebrew_binaries),
                    'rust': len(self.audit.rust_binaries),
                    'go': len(self.audit.go_binaries)
                },
                'by_category': self._calculate_category_stats(),
                'pixi_mappings': len(self.audit.pixi_mapping)
            },
            'detailed_inventory': {
                'system_binaries': [{'name': b.name, 'path': b.path, 'category': b.category}
                                  for b in self.audit.system_binaries[:100]],  # Limit for readability
                'node_binaries': [{'name': b.name, 'version': b.version, 'category': b.category}
                                for b in self.audit.node_binaries],
                'python_binaries': [{'name': b.name, 'version': b.version, 'category': b.category}
                                  for b in self.audit.python_binaries[:100]],  # Limit for readability
                'homebrew_binaries': [{'name': b.name, 'version': b.version, 'category': b.category}
                                     for b in self.audit.homebrew_binaries],
                'rust_binaries': [{'name': b.name, 'version': b.version, 'category': b.category}
                                for b in self.audit.rust_binaries],
                'go_binaries': [{'name': b.name, 'version': b.version, 'category': b.category}
                              for b in self.audit.go_binaries]
            },
            'pixi_integration': {
                'mappings': self.audit.pixi_mapping,
                'recommended_pixi_additions': list(self.audit.pixi_mapping.values())[:50]  # Top 50
            },
            'recommendations': self.audit.recommendations
        }

        # Save report
        with open(output_dir / 'binary_audit_report.json', 'w') as f:
            json.dump(report, f, indent=2)

        # Save Pixi-compatible additions
        pixi_additions = []
        for binary_name, pixi_package in self.audit.pixi_mapping.items():
            pixi_additions.append(f"# {binary_name}\n{pixi_package} = \"*\"")

        with open(output_dir / 'pixi_additions.txt', 'w') as f:
            f.write('\n\n'.join(pixi_additions))

        print(f"📊 Binary audit report saved to {output_dir}")

    def _calculate_category_stats(self) -> Dict[str, int]:
        """Calculate statistics by category"""
        stats = defaultdict(int)

        all_binaries = (self.audit.system_binaries + self.audit.node_binaries +
                       self.audit.python_binaries + self.audit.homebrew_binaries +
                       self.audit.rust_binaries + self.audit.go_binaries)

        for binary in all_binaries:
            stats[binary.category] += 1

        return dict(stats)

def main():
    auditor = BinaryAuditor()
    audit = auditor.perform_audit()

    # Calculate summary statistics
    total_binaries = (len(audit.system_binaries) + len(audit.node_binaries) +
                     len(audit.python_binaries) + len(audit.homebrew_binaries) +
                     len(audit.rust_binaries) + len(audit.go_binaries))

    print("\n🎉 Binary audit completed successfully!")
    print(f"📊 Total binaries inventoried: {total_binaries}")
    print(f"🔧 Pixi mappings created: {len(audit.pixi_mapping)}")

if __name__ == '__main__':
    main()