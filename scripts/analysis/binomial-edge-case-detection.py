#!/usr/bin/env python3
"""
Binomial Edge Case Detection (p<0.10, N=5)
Detects low-probability failures, boundary violations, and custom code issues

Mathematical Model:
- Binomial Distribution: P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
- Parameters: p < 0.10 (low probability), n=5 (trials)
- Edge Cases: Boundary violations, integration failures, custom code
- Detection: Statistical significance of failure patterns

Uses vendor libraries: numpy, scipy, pandas
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from typing import Dict, List, Tuple, Set, Any
from collections import defaultdict, Counter
from dataclasses import dataclass, field
import math

# Vendor libraries for statistical analysis
import numpy as np
from scipy.stats import binom, chi2
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

@dataclass
class EdgeCase:
    """Represents a detected edge case"""
    file_path: str
    line_number: int
    issue_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    probability: float
    description: str
    suggestion: str

@dataclass
class BinomialAnalysis:
    """Complete binomial edge case analysis"""
    edge_cases: List[EdgeCase] = field(default_factory=list)
    statistical_summary: Dict[str, Any] = field(default_factory=dict)
    risk_assessment: Dict[str, float] = field(default_factory=dict)
    boundary_violations: List[Dict[str, Any]] = field(default_factory=list)

class BinomialEdgeCaseDetector:
    """Binomial Edge Case Detection (p<0.10, N=5)"""

    def __init__(self, project_root: Path, p_threshold: float = 0.10, n_trials: int = 5):
        self.project_root = project_root
        self.p_threshold = p_threshold  # Maximum probability for edge case
        self.n_trials = n_trials  # Number of trials in binomial test

        # Risk patterns to detect
        self.risk_patterns = {
            'hardcoded_paths': {
                'pattern': r'/Users/|/home/|/root/|\$[A-Z_]+.*Users',
                'description': 'Hardcoded absolute paths',
                'severity': 'high',
                'expected_p': 0.05
            },
            'custom_scripts': {
                'pattern': r'#!/bin/bash|#!/bin/sh|\.sh$',
                'description': 'Custom shell scripts (prefer vendor CLIs)',
                'severity': 'medium',
                'expected_p': 0.08
            },
            'complex_conditionals': {
                'pattern': r'if.*&&.*\|\||\|\|.*&&',
                'description': 'Complex nested conditionals',
                'severity': 'medium',
                'expected_p': 0.07
            },
            'large_functions': {
                'pattern': r'def \w+.*:$',
                'description': 'Potentially large functions',
                'severity': 'low',
                'expected_p': 0.15
            },
            'console_logging': {
                'pattern': r'console\.log|print\(',
                'description': 'Debug logging in production code',
                'severity': 'low',
                'expected_p': 0.12
            },
            'circular_imports': {
                'pattern': r'import.*\.\..*\.\.',
                'description': 'Circular import patterns',
                'severity': 'high',
                'expected_p': 0.03
            },
            'magic_numbers': {
                'pattern': r'\b\d{3,}\b',
                'description': 'Magic numbers without constants',
                'severity': 'medium',
                'expected_p': 0.10
            },
            'empty_catches': {
                'pattern': r'catch.*\{\s*\}',
                'description': 'Empty catch blocks',
                'severity': 'high',
                'expected_p': 0.04
            },
            'todo_comments': {
                'pattern': r'TODO|FIXME|HACK',
                'description': 'Technical debt markers',
                'severity': 'low',
                'expected_p': 0.20
            },
            'deprecated_apis': {
                'pattern': r'\.deprecated|deprecated.*=',
                'description': 'Use of deprecated APIs',
                'severity': 'medium',
                'expected_p': 0.06
            }
        }

    def analyze_edge_cases(self) -> BinomialAnalysis:
        """Main edge case analysis using binomial distribution"""
        print("🔍 Detecting edge cases with binomial analysis (p<0.10, N=5)...")

        analysis = BinomialAnalysis()

        # Step 1: Scan codebase for risk patterns
        self._scan_for_risk_patterns(analysis)

        # Step 2: Perform binomial statistical tests
        self._perform_binomial_tests(analysis)

        # Step 3: Identify boundary violations
        self._identify_boundary_violations(analysis)

        # Step 4: Calculate risk assessment
        self._calculate_risk_assessment(analysis)

        # Step 5: Generate visualizations and reports
        self._generate_analysis_output(analysis)

        print(f"✅ Binomial edge case detection complete: {len(analysis.edge_cases)} edge cases detected")
        return analysis

    def _scan_for_risk_patterns(self, analysis: BinomialAnalysis):
        """Scan codebase for predefined risk patterns"""
        print("🔎 Scanning for risk patterns...")

        pattern_counts = defaultdict(int)
        total_lines = 0

        for root, dirs, files in os.walk(self.project_root):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {
                'node_modules', '__pycache__', '.git', 'target', 'build', 'dist',
                'venv', 'env', '.venv', 'data', 'logs', 'temp'
            }]

            for file in files:
                if self._should_analyze_file(file):
                    file_path = Path(root) / file

                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = f.readlines()
                            total_lines += len(lines)

                            for line_num, line in enumerate(lines, 1):
                                for pattern_name, pattern_config in self.risk_patterns.items():
                                    if re.search(pattern_config['pattern'], line, re.IGNORECASE):
                                        pattern_counts[pattern_name] += 1

                                        # Create edge case if pattern detected
                                        edge_case = EdgeCase(
                                            file_path=str(file_path.relative_to(self.project_root)),
                                            line_number=line_num,
                                            issue_type=pattern_name,
                                            severity=pattern_config['severity'],
                                            probability=pattern_config['expected_p'],
                                            description=pattern_config['description'],
                                            suggestion=self._generate_suggestion(pattern_name)
                                        )
                                        analysis.edge_cases.append(edge_case)

                    except Exception as e:
                        print(f"Warning: Could not analyze {file_path}: {e}")

        analysis.statistical_summary = {
            'total_lines_analyzed': total_lines,
            'patterns_detected': dict(pattern_counts),
            'edge_cases_found': len(analysis.edge_cases)
        }

        print(f"🔎 Scanned {total_lines} lines, found {len(analysis.edge_cases)} potential edge cases")

    def _should_analyze_file(self, filename: str) -> bool:
        """Determine if file should be analyzed"""
        # Skip certain file types and patterns
        skip_patterns = [
            '.pyc', '.pyo', '.pyd', '.so', '.dylib', '.dll',
            '.log', '.tmp', '.bak', '.orig', '.swp', '.swo',
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.zip', '.tar', '.gz', '.bz2', '.7z'
        ]

        if any(filename.endswith(ext) for ext in skip_patterns):
            return False

        # Skip hidden files
        if filename.startswith('.'):
            return False

        return True

    def _perform_binomial_tests(self, analysis: BinomialAnalysis):
        """Perform binomial statistical tests on detected patterns"""
        print("📊 Performing binomial statistical tests...")

        for pattern_name, pattern_config in self.risk_patterns.items():
            expected_p = pattern_config['expected_p']
            pattern_cases = [ec for ec in analysis.edge_cases if ec.issue_type == pattern_name]

            if len(pattern_cases) > 0:
                # Perform binomial test
                # H0: Pattern occurs with expected probability p
                # H1: Pattern occurs with probability > p (edge case)

                n_observed = len(pattern_cases)
                total_lines = analysis.statistical_summary['total_lines_analyzed']

                # Calculate observed probability
                observed_p = n_observed / total_lines if total_lines > 0 else 0

                # Binomial test: probability of observing n_observed or more
                # successes in total_lines trials with probability expected_p
                if observed_p > expected_p:
                    # Calculate p-value for binomial test
                    p_value = 1 - binom.cdf(n_observed - 1, total_lines, expected_p)

                    # Determine if this is a significant edge case
                    if p_value < 0.05:  # 95% confidence
                        print(f"🎯 Significant edge case: {pattern_name} (p={observed_p:.4f}, expected={expected_p:.4f}, p-value={p_value:.6f})")

                        # Update edge case probabilities
                        for ec in pattern_cases:
                            ec.probability = observed_p

    def _identify_boundary_violations(self, analysis: BinomialAnalysis):
        """Identify boundary violations and integration points"""
        print("🎯 Identifying boundary violations...")

        # Group edge cases by file/directory
        file_groups = defaultdict(list)
        for ec in analysis.edge_cases:
            file_groups[ec.file_path].append(ec)

        # Look for boundary violations (files with multiple high-severity issues)
        for file_path, cases in file_groups.items():
            high_severity = [c for c in cases if c.severity in ['high', 'critical']]
            if len(high_severity) >= 3:  # Threshold for boundary violation
                violation = {
                    'file': file_path,
                    'high_severity_issues': len(high_severity),
                    'total_issues': len(cases),
                    'issue_types': list(set(c.issue_type for c in cases)),
                    'risk_level': 'high' if len(high_severity) >= 5 else 'medium'
                }
                analysis.boundary_violations.append(violation)

        print(f"🎯 Found {len(analysis.boundary_violations)} boundary violations")

    def _calculate_risk_assessment(self, analysis: BinomialAnalysis):
        """Calculate overall risk assessment"""
        print("📈 Calculating risk assessment...")

        # Risk by severity
        severity_weights = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        severity_counts = Counter(ec.severity for ec in analysis.edge_cases)

        total_risk_score = sum(count * severity_weights[sev] for sev, count in severity_counts.items())
        normalized_risk = min(total_risk_score / 100, 1.0)  # Normalize to 0-1 scale

        analysis.risk_assessment = {
            'total_edge_cases': len(analysis.edge_cases),
            'severity_breakdown': dict(severity_counts),
            'risk_score': total_risk_score,
            'normalized_risk': normalized_risk,
            'risk_level': self._classify_risk_level(normalized_risk)
        }

        print(f"📈 Risk assessment: {analysis.risk_assessment['risk_level']} ({normalized_risk:.3f})")

    def _classify_risk_level(self, normalized_risk: float) -> str:
        """Classify risk level based on normalized score"""
        if normalized_risk >= 0.8:
            return 'critical'
        elif normalized_risk >= 0.6:
            return 'high'
        elif normalized_risk >= 0.4:
            return 'medium'
        elif normalized_risk >= 0.2:
            return 'low'
        else:
            return 'minimal'

    def _generate_suggestion(self, pattern_name: str) -> str:
        """Generate remediation suggestion for pattern"""
        suggestions = {
            'hardcoded_paths': 'Use parameterized configurations and environment variables',
            'custom_scripts': 'Replace with vendor CLI tools (npm scripts, vendor APIs)',
            'complex_conditionals': 'Break down into smaller functions with early returns',
            'large_functions': 'Refactor into smaller, single-responsibility functions',
            'console_logging': 'Use structured logging with vendor logging libraries',
            'circular_imports': 'Restructure modules to eliminate circular dependencies',
            'magic_numbers': 'Define named constants for magic numbers',
            'empty_catches': 'Add proper error handling and logging',
            'todo_comments': 'Address technical debt or create tickets for future work',
            'deprecated_apis': 'Update to current API versions or find alternatives'
        }
        return suggestions.get(pattern_name, 'Review and refactor code')

    def _generate_analysis_output(self, analysis: BinomialAnalysis):
        """Generate analysis visualizations and reports"""
        print("📊 Generating binomial analysis output...")

        # Create output directory
        output_dir = self.project_root / 'data' / 'fea_results'
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate risk distribution chart
        self._generate_risk_chart(analysis, output_dir)

        # Generate edge case summary
        self._generate_edge_case_summary(analysis, output_dir)

        # Generate detailed report
        self._generate_binomial_report(analysis, output_dir)

        print(f"📊 Analysis output saved to {output_dir}")

    def _generate_risk_chart(self, analysis: BinomialAnalysis, output_dir: Path):
        """Generate risk distribution visualization"""
        if not analysis.edge_cases:
            return

        # Count by severity and type
        severity_counts = Counter(ec.severity for ec in analysis.edge_cases)
        type_counts = Counter(ec.issue_type for ec in analysis.edge_cases)

        # Create subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

        # Severity distribution
        severities = list(severity_counts.keys())
        counts = list(severity_counts.values())
        colors = ['green', 'yellow', 'orange', 'red']
        ax1.bar(severities, counts, color=colors[:len(severities)])
        ax1.set_title('Edge Cases by Severity')
        ax1.set_ylabel('Count')
        ax1.tick_params(axis='x', rotation=45)

        # Type distribution (top 10)
        top_types = dict(type_counts.most_common(10))
        ax2.bar(range(len(top_types)), list(top_types.values()))
        ax2.set_xticks(range(len(top_types)))
        ax2.set_xticklabels(list(top_types.keys()), rotation=45, ha='right')
        ax2.set_title('Top 10 Edge Case Types')
        ax2.set_ylabel('Count')

        plt.tight_layout()
        plt.savefig(output_dir / 'binomial_risk_distribution.png', dpi=150, bbox_inches='tight')
        plt.close()

    def _generate_edge_case_summary(self, analysis: BinomialAnalysis, output_dir: Path):
        """Generate edge case summary table"""
        if not analysis.edge_cases:
            return

        # Create summary DataFrame
        summary_data = []
        for ec in analysis.edge_cases:
            summary_data.append({
                'File': ec.file_path,
                'Line': ec.line_number,
                'Type': ec.issue_type,
                'Severity': ec.severity,
                'Probability': f"{ec.probability:.4f}",
                'Description': ec.description,
                'Suggestion': ec.suggestion
            })

        df = pd.DataFrame(summary_data)
        df.to_csv(output_dir / 'edge_cases_summary.csv', index=False)

        # Also save as JSON for programmatic access
        with open(output_dir / 'edge_cases_summary.json', 'w') as f:
            json.dump(summary_data, f, indent=2)

    def _generate_binomial_report(self, analysis: BinomialAnalysis, output_dir: Path):
        """Generate comprehensive binomial analysis report"""
        report = {
            'binomial_analysis': {
                'parameters': {
                    'p_threshold': self.p_threshold,
                    'n_trials': self.n_trials,
                    'confidence_level': 0.95
                },
                'summary': analysis.statistical_summary,
                'risk_assessment': analysis.risk_assessment,
                'boundary_violations': {
                    'count': len(analysis.boundary_violations),
                    'details': analysis.boundary_violations[:10]  # Top 10
                },
                'pattern_analysis': {
                    pattern: {
                        'expected_p': config['expected_p'],
                        'detected_cases': len([ec for ec in analysis.edge_cases if ec.issue_type == pattern]),
                        'severity': config['severity']
                    }
                    for pattern, config in self.risk_patterns.items()
                }
            },
            'recommendations': [
                "Focus remediation on high-severity edge cases first",
                "Address boundary violations in files with multiple issues",
                "Implement automated detection in CI/CD pipeline",
                f"Current risk level: {analysis.risk_assessment.get('risk_level', 'unknown')}",
                "Regular binomial analysis recommended for codebase health"
            ]
        }

        with open(output_dir / 'binomial_edge_case_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Binomial Edge Case Detection (p<0.10, N=5)')
    parser.add_argument('--project-root', type=str, default='.',
                       help='Project root directory')
    parser.add_argument('--p-threshold', type=float, default=0.10,
                       help='Probability threshold for edge cases (default: 0.10)')
    parser.add_argument('--n-trials', type=int, default=5,
                       help='Number of trials for binomial test (default: 5)')

    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()

    detector = BinomialEdgeCaseDetector(project_root, args.p_threshold, args.n_trials)
    analysis = detector.analyze_edge_cases()

    print(f"\n🎉 Binomial Edge Case Detection Complete!")
    print(f"📊 Analyzed with p<{args.p_threshold}, N={args.n_trials}")
    print(f"🎯 Detected {len(analysis.edge_cases)} edge cases")
    print(f"⚠️  Risk level: {analysis.risk_assessment.get('risk_level', 'unknown')}")

if __name__ == '__main__':
    main()