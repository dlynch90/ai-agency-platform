#!/usr/bin/env python3
"""
Custom Code Audit - Identify vendor compliance violations
Audits codebase for custom scripts and identifies vendor alternatives
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict, Counter
from dataclasses import dataclass, field

@dataclass
class CustomCodeViolation:
    """Represents a custom code violation"""
    file_path: str
    violation_type: str
    severity: str
    vendor_alternative: str
    replacement_strategy: str
    complexity_score: float
    dependencies: List[str] = field(default_factory=list)

@dataclass
class CustomCodeAudit:
    """Complete custom code audit results"""
    total_scripts: int = 0
    custom_violations: List[CustomCodeViolation] = field(default_factory=list)
    vendor_alternatives: Dict[str, List[str]] = field(default_factory=dict)
    replacement_plan: Dict[str, List[CustomCodeViolation]] = field(default_factory=dict)
    compliance_score: float = 0.0

class CustomCodeAuditor:
    """Auditor for custom code compliance violations"""

    def __init__(self, project_root: Path):
        self.project_root = project_root

        # Patterns for identifying custom scripts
        self.custom_patterns = {
            'shell_scripts': {
                'pattern': r'^#!/bin/(bash|sh|zsh)',
                'description': 'Custom shell scripts',
                'vendor_alternatives': [
                    'npm scripts', 'Makefile', 'justfile', 'taskfile',
                    'GitHub Actions', 'pre-commit hooks', 'lefthook'
                ],
                'replacement_strategy': 'migrate_to_vendor_task_runners'
            },
            'python_utilities': {
                'pattern': r'#!/usr/bin/env python3',
                'description': 'Custom Python utility scripts',
                'vendor_alternatives': [
                    'click', 'typer', 'fire', 'invoke', 'doit',
                    'langchain agents', 'crewai tasks', 'prefect flows'
                ],
                'replacement_strategy': 'migrate_to_cli_frameworks'
            },
            'node_utilities': {
                'pattern': r'#!/usr/bin/env node',
                'description': 'Custom Node.js utility scripts',
                'vendor_alternatives': [
                    'npm scripts', 'npx', 'oclif', 'commander.js',
                    'yargs', 'zx', 'esbuild scripts'
                ],
                'replacement_strategy': 'migrate_to_npm_scripts'
            },
            'custom_config': {
                'pattern': r'\.config\.(js|ts|mjs)',
                'description': 'Custom configuration files',
                'vendor_alternatives': [
                    'cosmiconfig', 'rc', 'dotenv', 'convict',
                    'configstore', 'conf'
                ],
                'replacement_strategy': 'use_vendor_config_libs'
            },
            'custom_build': {
                'pattern': r'(webpack\.config|rollup\.config|vite\.config)',
                'description': 'Custom build configurations',
                'vendor_alternatives': [
                    'create-react-app', 'next.js', 'nuxt.js',
                    'vite templates', 'astro', 'svelte-kit'
                ],
                'replacement_strategy': 'use_framework_defaults'
            },
            'custom_linting': {
                'pattern': r'\.eslintrc|\.prettierrc|\.stylelintrc',
                'description': 'Custom linting configurations',
                'vendor_alternatives': [
                    'eslint-config-standard', 'prettier-config-standard',
                    'xo', 'standard', 'semistandard'
                ],
                'replacement_strategy': 'use_standard_configs'
            },
            'custom_docker': {
                'pattern': r'Dockerfile|docker-compose',
                'description': 'Custom Docker configurations',
                'vendor_alternatives': [
                    'docker-compose templates', 'kubernetes manifests',
                    'helm charts', 'kustomize'
                ],
                'replacement_strategy': 'use_infrastructure_templates'
            },
            'custom_ci_cd': {
                'pattern': r'\.github/workflows|\.gitlab-ci|\.travis',
                'description': 'Custom CI/CD pipelines',
                'vendor_alternatives': [
                    'GitHub Actions templates', 'pre-commit.ci',
                    'semantic-release', 'release-please'
                ],
                'replacement_strategy': 'use_ci_cd_templates'
            }
        }

        # Priority directories to audit
        self.priority_dirs = [
            'scripts/',
            'tools/',
            'bin/',
            'config/',
            'configs/',
            'infrastructure/',
            '.github/',
            'ci/',
            'ci_cd/'
        ]

        self.audit = CustomCodeAudit()

    def audit_custom_code(self) -> CustomCodeAudit:
        """Main custom code audit function"""
        print("🔍 Auditing custom code compliance violations...")

        # Step 1: Scan for custom scripts and configurations
        self._scan_for_custom_code()

        # Step 2: Analyze each violation
        self._analyze_violations()

        # Step 3: Generate vendor alternatives
        self._generate_vendor_alternatives()

        # Step 4: Create replacement plan
        self._create_replacement_plan()

        # Step 5: Calculate compliance score
        self._calculate_compliance_score()

        # Step 6: Generate reports
        self._generate_audit_reports()

        print(f"✅ Custom code audit complete: {len(self.audit.custom_violations)} violations found")
        return self.audit

    def _scan_for_custom_code(self):
        """Scan codebase for custom scripts and configurations"""
        print("🔎 Scanning for custom scripts and configurations...")

        for root, dirs, files in os.walk(self.project_root):
            # Skip hidden directories and common excludes
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {
                'node_modules', '__pycache__', '.git', 'target', 'build', 'dist',
                'venv', '.venv', 'env', 'data', 'logs', 'temp', 'cache'
            }]

            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(self.project_root)

                # Check if file is in priority directory
                is_priority = any(str(rel_path).startswith(d) for d in self.priority_dirs)

                if is_priority or self._is_potential_custom_code(file_path):
                    violation = self._analyze_file_for_violations(file_path)
                    if violation:
                        self.audit.custom_violations.append(violation)
                        self.audit.total_scripts += 1

    def _is_potential_custom_code(self, file_path: Path) -> bool:
        """Check if file is potentially custom code"""
        # Check file extensions
        custom_extensions = {'.sh', '.bash', '.zsh', '.ps1', '.py', '.js', '.ts', '.config.js', '.config.ts'}

        if file_path.suffix in custom_extensions:
            return True

        # Check file names
        custom_names = {'Dockerfile', 'docker-compose', '.eslintrc', '.prettierrc', 'Makefile', 'justfile'}

        if file_path.name in custom_names:
            return True

        # Check directory patterns
        path_str = str(file_path)
        if any(pattern in path_str for pattern in ['scripts/', 'tools/', 'bin/', 'config/']):
            return True

        return False

    def _analyze_file_for_violations(self, file_path: Path) -> CustomCodeViolation:
        """Analyze a file for custom code violations"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(2000)  # Read first 2000 chars for analysis

            rel_path = file_path.relative_to(self.project_root)

            # Check against patterns
            for pattern_name, pattern_config in self.custom_patterns.items():
                if re.search(pattern_config['pattern'], content, re.MULTILINE):
                    # Calculate complexity score
                    complexity = self._calculate_complexity(content, file_path)

                    # Determine severity
                    severity = self._determine_severity(complexity, pattern_config)

                    violation = CustomCodeViolation(
                        file_path=str(rel_path),
                        violation_type=pattern_name,
                        severity=severity,
                        vendor_alternative=pattern_config['vendor_alternatives'][0],
                        replacement_strategy=pattern_config['replacement_strategy'],
                        complexity_score=complexity
                    )

                    # Extract dependencies
                    violation.dependencies = self._extract_dependencies(content, pattern_name)

                    return violation

        except Exception as e:
            print(f"Warning: Could not analyze {file_path}: {e}")

        return None

    def _calculate_complexity(self, content: str, file_path: Path) -> float:
        """Calculate complexity score for custom code"""
        lines = content.split('\n')
        score = 0.0

        # File size factor
        score += len(content) / 1000.0

        # Line count factor
        score += len(lines) / 50.0

        # Conditional complexity
        conditionals = len(re.findall(r'\b(if|elif|else|switch|case|when)\b', content))
        score += conditionals * 0.5

        # Function/method count
        functions = len(re.findall(r'\b(def|function|class)\b', content))
        score += functions * 0.3

        # External dependencies
        imports = len(re.findall(r'^(import|from|#include|require)', content, re.MULTILINE))
        score += imports * 0.2

        # Configuration complexity
        if 'config' in str(file_path).lower():
            score *= 1.2

        return min(score, 10.0)  # Cap at 10

    def _determine_severity(self, complexity: float, pattern_config: Dict) -> str:
        """Determine severity based on complexity and pattern"""
        if complexity > 7.0:
            return 'critical'
        elif complexity > 4.0:
            return 'high'
        elif complexity > 2.0:
            return 'medium'
        else:
            return 'low'

    def _extract_dependencies(self, content: str, pattern_type: str) -> List[str]:
        """Extract dependencies from custom code"""
        deps = []

        if pattern_type == 'shell_scripts':
            # Extract command dependencies
            commands = re.findall(r'\b(\w+)\s', content)
            common_commands = {'curl', 'wget', 'git', 'npm', 'yarn', 'python', 'node', 'docker'}
            deps = [cmd for cmd in commands if cmd in common_commands][:5]

        elif pattern_type in ['python_utilities', 'node_utilities']:
            # Extract import/require statements
            if pattern_type == 'python_utilities':
                imports = re.findall(r'^(?:import|from)\s+(\w+)', content, re.MULTILINE)
            else:
                imports = re.findall(r'(?:import|require)\s*\(?["\']([^"\']+)["\']', content)

            deps = list(set(imports))[:5]

        return deps

    def _analyze_violations(self):
        """Analyze violations for patterns and impacts"""
        print("📊 Analyzing violations...")

        # Group by violation type
        by_type = defaultdict(list)
        for violation in self.audit.custom_violations:
            by_type[violation.violation_type].append(violation)

        # Analyze each type
        for violation_type, violations in by_type.items():
            print(f"  {violation_type}: {len(violations)} violations")

            # Calculate statistics
            severities = Counter(v.severity for v in violations)
            avg_complexity = sum(v.complexity_score for v in violations) / len(violations)

            print(f"    Severities: {dict(severities)}")
            print(".2f")

    def _generate_vendor_alternatives(self):
        """Generate comprehensive vendor alternatives"""
        print("🔧 Generating vendor alternatives...")

        for violation in self.audit.custom_violations:
            pattern_config = self.custom_patterns[violation.violation_type]
            alternatives = pattern_config['vendor_alternatives']

            # Store alternatives
            if violation.violation_type not in self.audit.vendor_alternatives:
                self.audit.vendor_alternatives[violation.violation_type] = alternatives

    def _create_replacement_plan(self):
        """Create replacement plan prioritized by impact"""
        print("📋 Creating replacement plan...")

        # Group by replacement strategy
        by_strategy = defaultdict(list)
        for violation in self.audit.custom_violations:
            by_strategy[violation.replacement_strategy].append(violation)

        # Sort within each strategy by severity and complexity
        for strategy, violations in by_strategy.items():
            violations.sort(key=lambda v: (
                {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}[v.severity],
                v.complexity_score
            ), reverse=True)

            self.audit.replacement_plan[strategy] = violations

    def _calculate_compliance_score(self):
        """Calculate overall vendor compliance score"""
        if not self.audit.custom_violations:
            self.audit.compliance_score = 100.0
            return

        total_violations = len(self.audit.custom_violations)

        # Weight by severity
        severity_weights = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        weighted_score = sum(severity_weights[v.severity] for v in self.audit.custom_violations)

        # Normalize to 0-100 scale (lower is better compliance)
        max_possible = total_violations * 4  # Max weight per violation
        raw_score = (max_possible - weighted_score) / max_possible * 100

        self.audit.compliance_score = max(0, min(100, raw_score))

    def _generate_audit_reports(self):
        """Generate comprehensive audit reports"""
        print("📊 Generating audit reports...")

        output_dir = self.project_root / 'data' / 'custom_code_audit'
        output_dir.mkdir(parents=True, exist_ok=True)

        # Main audit report
        report = {
            'audit_summary': {
                'total_scripts_audited': self.audit.total_scripts,
                'total_violations': len(self.audit.custom_violations),
                'compliance_score': round(self.audit.compliance_score, 2),
                'violations_by_type': dict(Counter(v.violation_type for v in self.audit.custom_violations)),
                'violations_by_severity': dict(Counter(v.severity for v in self.audit.custom_violations))
            },
            'replacement_plan': {
                strategy: len(violations) for strategy, violations in self.audit.replacement_plan.items()
            },
            'vendor_alternatives': self.audit.vendor_alternatives,
            'top_violations': [
                {
                    'file': v.file_path,
                    'type': v.violation_type,
                    'severity': v.severity,
                    'complexity': round(v.complexity_score, 2),
                    'alternative': v.vendor_alternative,
                    'strategy': v.replacement_strategy
                }
                for v in sorted(self.audit.custom_violations,
                              key=lambda x: x.complexity_score, reverse=True)[:20]
            ]
        }

        with open(output_dir / 'custom_code_audit_report.json', 'w') as f:
            json.dump(report, f, indent=2)

        # Detailed violations CSV
        import csv
        with open(output_dir / 'custom_code_violations.csv', 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'file_path', 'violation_type', 'severity', 'vendor_alternative',
                'replacement_strategy', 'complexity_score', 'dependencies'
            ])
            writer.writeheader()

            for violation in self.audit.custom_violations:
                writer.writerow({
                    'file_path': violation.file_path,
                    'violation_type': violation.violation_type,
                    'severity': violation.severity,
                    'vendor_alternative': violation.vendor_alternative,
                    'replacement_strategy': violation.replacement_strategy,
                    'complexity_score': round(violation.complexity_score, 2),
                    'dependencies': ', '.join(violation.dependencies)
                })

        # Replacement plan by priority
        with open(output_dir / 'replacement_plan.md', 'w') as f:
            f.write("# Custom Code Replacement Plan\n\n")
            f.write(f"**Compliance Score: {self.audit.compliance_score:.1f}%**\n\n")
            f.write(f"**Total Violations: {len(self.audit.custom_violations)}**\n\n")

            for strategy, violations in self.audit.replacement_plan.items():
                f.write(f"## {strategy.replace('_', ' ').title()}\n\n")
                f.write(f"**Violations: {len(violations)}**\n\n")

                for violation in violations[:10]:  # Top 10 per strategy
                    f.write(f"### {violation.file_path}\n")
                    f.write(f"- **Type:** {violation.violation_type}\n")
                    f.write(f"- **Severity:** {violation.severity}\n")
                    f.write(f"- **Complexity:** {violation.complexity_score:.1f}\n")
                    f.write(f"- **Alternative:** {violation.vendor_alternative}\n")
                    f.write(f"- **Dependencies:** {', '.join(violation.dependencies) if violation.dependencies else 'None'}\n\n")

        print(f"📊 Audit reports saved to {output_dir}")

def main():
    parser = argparse.ArgumentParser(description='Custom Code Audit')
    parser.add_argument('--project-root', type=str, default='.',
                       help='Project root directory')

    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()

    auditor = CustomCodeAuditor(project_root)
    audit = auditor.audit_custom_code()

    print("\n🎉 Custom Code Audit Complete!")
    print(f"📊 Scripts audited: {audit.total_scripts}")
    print(f"🚨 Violations found: {len(audit.custom_violations)}")
    print(".1f")
if __name__ == '__main__':
    main()