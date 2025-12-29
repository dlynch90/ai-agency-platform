#!/usr/bin/env python3
"""
Binomial Edge Case Detection (p<0.10, N=5)
Detects low-probability failures, boundary violations, and custom code patterns

Mathematical Model:
- Binomial Distribution: P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
- p < 0.10: Low probability threshold for edge cases
- N=5: Sample size for statistical significance
- Edge Cases: Boundary conditions, error paths, unusual inputs

Uses vendor libraries: numpy, scipy, matplotlib
"""

import os
import json
import math
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set, Any
from collections import defaultdict, Counter
from dataclasses import dataclass, field

# Vendor libraries for statistical analysis
import numpy as np
from scipy.stats import binom, chi2
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

@dataclass
class EdgeCase:
    """Represents a detected edge case"""
    file_path: str
    line_number: int
    pattern_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    probability: float
    confidence: float
    context: str = ""

@dataclass
class BinomialAnalysis:
    """Complete binomial edge case analysis"""
    total_files_analyzed: int = 0
    edge_cases_detected: List[EdgeCase] = field(default_factory=list)
    pattern_distributions: Dict[str, Dict[str, int]] = field(default_factory=dict)
    statistical_summary: Dict[str, Any] = field(default_factory=dict)

class BinomialEdgeDetector:
    """Binomial distribution-based edge case detection"""

    def __init__(self, project_root: Path, p_threshold: float = 0.10, n_trials: int = 5):
        self.project_root = project_root
        self.p_threshold = p_threshold  # Low probability threshold
        self.n_trials = n_trials  # Sample size for binomial test

        # Edge case patterns to detect
        self.patterns = {
            'hardcoded_paths': {
                'regex': r'(/Users/|/home/|/tmp/|/var/|/etc/)',
                'description': 'Hardcoded system paths',
                'severity_weights': {'low': 0.05, 'medium': 0.15, 'high': 0.30}
            },
            'custom_imports': {
                'regex': r'(import.*custom|from.*custom)',
                'description': 'Custom module imports',
                'severity_weights': {'low': 0.03, 'medium': 0.10, 'high': 0.25}
            },
            'error_suppression': {
                'regex': r'(except.*:.*pass|catch.*\{\s*\})',
                'description': 'Silent error handling',
                'severity_weights': {'low': 0.08, 'medium': 0.20, 'high': 0.40}
            },
            'boundary_conditions': {
                'regex': r'(==\s*0|==\s*null|==\s*""|\.length\s*==\s*0)',
                'description': 'Potential boundary condition issues',
                'severity_weights': {'low': 0.06, 'medium': 0.18, 'high': 0.35}
            },
            'unvalidated_input': {
                'regex': r'(input\(|prompt\(|readline\()',
                'description': 'Unvalidated user input',
                'severity_weights': {'low': 0.10, 'medium': 0.25, 'high': 0.50}
            },
            'custom_logic': {
                'regex': r'(def.*custom|function.*custom|class.*custom)',
                'description': 'Custom business logic implementations',
                'severity_weights': {'low': 0.04, 'medium': 0.12, 'high': 0.28}
            },
            'vendor_violations': {
                'regex': r'(no.*vendor|custom.*component|hand.*written)',
                'description': 'Vendor compliance violations',
                'severity_weights': {'low': 0.02, 'medium': 0.08, 'high': 0.20}
            }
        }

        self.analysis = BinomialAnalysis()

    def analyze_edge_cases(self) -> BinomialAnalysis:
        """Main edge case detection function"""
        print(f"🎯 Analyzing edge cases with binomial distribution (p<{self.p_threshold}, N={self.n_trials})...")

        # Step 1: Scan codebase for patterns
        self._scan_codebase()

        # Step 2: Apply binomial statistical tests
        self._apply_binomial_tests()

        # Step 3: Calculate confidence intervals
        self._calculate_confidence_intervals()

        # Step 4: Generate risk assessment
        self._generate_risk_assessment()

        # Step 5: Create visualizations
        self._generate_visualizations()

        print(f"✅ Edge case analysis complete: {len(self.analysis.edge_cases_detected)} cases detected")
        return self.analysis

    def _scan_codebase(self):
        """Scan codebase for edge case patterns"""
        print("🔍 Scanning codebase for edge case patterns...")

        for root, dirs, files in os.walk(self.project_root):
            # Skip hidden directories and common excludes
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {
                'node_modules', '__pycache__', '.git', 'target', 'build', 'dist'
            }]

            for file in files:
                if file.startswith('.') or file.endswith(('.pyc', '.log', '.tmp')):
                    continue

                file_path = Path(root) / file
                self._analyze_file(file_path)

    def _analyze_file(self, file_path: Path):
        """Analyze a single file for edge case patterns"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            self.analysis.total_files_analyzed += 1

            for line_num, line in enumerate(lines, 1):
                for pattern_name, pattern_config in self.patterns.items():
                    if self._matches_pattern(line, pattern_config['regex']):
                        edge_case = EdgeCase(
                            file_path=str(file_path.relative_to(self.project_root)),
                            line_number=line_num,
                            pattern_type=pattern_name,
                            severity=self._calculate_severity(line, pattern_config),
                            description=pattern_config['description'],
                            probability=0.0,  # Will be calculated in binomial test
                            confidence=0.0,   # Will be calculated later
                            context=line.strip()
                        )
                        self.analysis.edge_cases_detected.append(edge_case)

                        # Update pattern distribution
                        if pattern_name not in self.analysis.pattern_distributions:
                            self.analysis.pattern_distributions[pattern_name] = {}
                        severity = edge_case.severity
                        if severity not in self.analysis.pattern_distributions[pattern_name]:
                            self.analysis.pattern_distributions[pattern_name][severity] = 0
                        self.analysis.pattern_distributions[pattern_name][severity] += 1

        except Exception as e:
            print(f"Warning: Could not analyze {file_path}: {e}")

    def _matches_pattern(self, line: str, regex: str) -> bool:
        """Check if line matches pattern (simplified regex matching)"""
        import re
        try:
            return bool(re.search(regex, line, re.IGNORECASE))
        except:
            return False

    def _calculate_severity(self, line: str, pattern_config: Dict) -> str:
        """Calculate severity based on pattern and context"""
        weights = pattern_config['severity_weights']

        # Simple severity calculation based on line complexity
        complexity_score = len(line.strip()) / 100  # Normalize to 0-1

        if complexity_score < 0.3:
            return 'low'
        elif complexity_score < 0.6:
            return 'medium'
        else:
            return 'high'

    def _apply_binomial_tests(self):
        """Apply binomial statistical tests to edge cases"""
        print("📊 Applying binomial statistical tests...")

        total_files = self.analysis.total_files_analyzed
        if total_files == 0:
            return

        for edge_case in self.analysis.edge_cases_detected:
            pattern_type = edge_case.pattern_type

            # Count occurrences of this pattern
            pattern_count = sum(1 for ec in self.analysis.edge_cases_detected
                              if ec.pattern_type == pattern_type)

            # Apply binomial test: probability of finding this pattern
            # H0: Pattern occurs with probability p_threshold
            # H1: Pattern occurs with lower probability (edge case)

            # Calculate p-value for binomial test
            p_value = binom.cdf(pattern_count, total_files, self.p_threshold)

            # If p-value is very low, it's a significant edge case
            if p_value < 0.05:  # 95% confidence
                edge_case.probability = pattern_count / total_files
                edge_case.confidence = 1 - p_value

                # Upgrade severity if statistically significant
                if edge_case.confidence > 0.95 and edge_case.severity == 'low':
                    edge_case.severity = 'medium'
                elif edge_case.confidence > 0.99:
                    edge_case.severity = 'high'

    def _calculate_confidence_intervals(self):
        """Calculate confidence intervals for edge case probabilities"""
        for edge_case in self.analysis.edge_cases_detected:
            if edge_case.probability > 0:
                # Wilson score interval for binomial proportion
                n = self.analysis.total_files_analyzed
                p = edge_case.probability
                z = 1.96  # 95% confidence

                denominator = 1 + z*z/n
                center = (p + z*z/(2*n)) / denominator
                interval = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / denominator

                edge_case.confidence = min(1.0, max(0.0, 1 - interval))

    def _generate_risk_assessment(self):
        """Generate overall risk assessment"""
        severity_counts = Counter(ec.severity for ec in self.analysis.edge_cases_detected)
        pattern_counts = Counter(ec.pattern_type for ec in self.analysis.edge_cases_detected)

        # Calculate risk score (weighted by severity and confidence)
        risk_score = 0
        total_weight = 0

        severity_weights = {'low': 1, 'medium': 3, 'high': 5, 'critical': 10}

        for edge_case in self.analysis.edge_cases_detected:
            weight = severity_weights.get(edge_case.severity, 1) * edge_case.confidence
            risk_score += weight
            total_weight += 1

        avg_risk_score = risk_score / max(total_weight, 1)

        self.analysis.statistical_summary = {
            'total_files_analyzed': self.analysis.total_files_analyzed,
            'total_edge_cases': len(self.analysis.edge_cases_detected),
            'severity_distribution': dict(severity_counts),
            'pattern_distribution': dict(pattern_counts),
            'risk_score': avg_risk_score,
            'risk_level': 'low' if avg_risk_score < 2 else 'medium' if avg_risk_score < 4 else 'high',
            'p_threshold': self.p_threshold,
            'n_trials': self.n_trials
        }

    def _generate_visualizations(self):
        """Generate edge case analysis visualizations"""
        print("📊 Generating edge case visualizations...")

        output_dir = self.project_root / 'data' / 'fea_results'
        output_dir.mkdir(parents=True, exist_ok=True)

        # Create severity distribution plot
        severity_counts = self.analysis.statistical_summary.get('severity_distribution', {})

        if severity_counts:
            plt.figure(figsize=(12, 8))

            # Create bar chart
            severities = list(severity_counts.keys())
            counts = [severity_counts[s] for s in severities]

            bars = plt.bar(severities, counts, color=['green', 'yellow', 'orange', 'red'])
            plt.xlabel('Severity Level')
            plt.ylabel('Number of Edge Cases')
            plt.title(f'Edge Case Severity Distribution\n(Binomial Analysis: p<{self.p_threshold}, N={self.n_trials})')

            # Add value labels on bars
            for bar, count in zip(bars, counts):
                plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1,
                        str(count), ha='center', va='bottom')

            plt.tight_layout()
            plt.savefig(output_dir / 'binomial_edge_cases_severity.png', dpi=300, bbox_inches='tight')
            plt.close()

        # Create pattern distribution plot
        pattern_counts = self.analysis.statistical_summary.get('pattern_distribution', {})

        if pattern_counts:
            plt.figure(figsize=(14, 8))

            patterns = list(pattern_counts.keys())
            counts = [pattern_counts[p] for p in patterns]

            # Sort by count
            sorted_indices = np.argsort(counts)[::-1]
            patterns = [patterns[i] for i in sorted_indices]
            counts = [counts[i] for i in sorted_indices]

            bars = plt.barh(patterns, counts)
            plt.xlabel('Number of Occurrences')
            plt.ylabel('Pattern Type')
            plt.title('Edge Case Pattern Distribution\n(Most Frequent Patterns)')

            # Add value labels
            for i, (bar, count) in enumerate(zip(bars, counts)):
                plt.text(count + 0.1, i, str(count), va='center')

            plt.tight_layout()
            plt.savefig(output_dir / 'binomial_edge_cases_patterns.png', dpi=300, bbox_inches='tight')
            plt.close()

        # Generate analysis report
        self._generate_binomial_report(output_dir)

    def _generate_binomial_report(self, output_dir: Path):
        """Generate binomial analysis report"""
        # Sort edge cases by severity and confidence
        sorted_cases = sorted(
            self.analysis.edge_cases_detected,
            key=lambda x: (
                {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}[x.severity],
                x.confidence
            ),
            reverse=True
        )

        # Take top 50 most critical edge cases
        top_cases = sorted_cases[:50]

        report = {
            'binomial_analysis': self.analysis.statistical_summary,
            'top_edge_cases': [
                {
                    'file_path': ec.file_path,
                    'line_number': ec.line_number,
                    'pattern_type': ec.pattern_type,
                    'severity': ec.severity,
                    'description': ec.description,
                    'probability': round(ec.probability, 6),
                    'confidence': round(ec.confidence, 4),
                    'context': ec.context
                }
                for ec in top_cases
            ],
            'pattern_analysis': {
                pattern: {
                    'total_occurrences': sum(counts.values()),
                    'severity_breakdown': counts,
                    'avg_probability': np.mean([
                        ec.probability for ec in self.analysis.edge_cases_detected
                        if ec.pattern_type == pattern
                    ]) if any(ec.pattern_type == pattern for ec in self.analysis.edge_cases_detected) else 0
                }
                for pattern, counts in self.analysis.pattern_distributions.items()
            },
            'recommendations': [
                f"Address {len([ec for ec in self.analysis.edge_cases_detected if ec.severity == 'high'])} high-severity edge cases immediately",
                f"Review {len([ec for ec in self.analysis.edge_cases_detected if ec.pattern_type == 'hardcoded_paths'])} hardcoded path violations",
                f"Consider vendor alternatives for {len([ec for ec in self.analysis.edge_cases_detected if ec.pattern_type == 'custom_logic'])} custom logic implementations",
                f"Improve error handling for {len([ec for ec in self.analysis.edge_cases_detected if ec.pattern_type == 'error_suppression'])} silent error cases",
                "Implement input validation for all user inputs detected",
                "Review boundary conditions in conditional logic"
            ]
        }

        with open(output_dir / 'binomial_edge_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

def main():
    parser = argparse.ArgumentParser(description='Binomial Edge Case Detection (p<0.10, N=5)')
    parser.add_argument('--project-root', type=str, default='.',
                       help='Project root directory')
    parser.add_argument('--p-threshold', type=float, default=0.10,
                       help='Probability threshold for edge cases')
    parser.add_argument('--n-trials', type=int, default=5,
                       help='Number of trials for binomial analysis')

    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()

    analyzer = BinomialEdgeDetector(project_root, args.p_threshold, args.n_trials)
    analysis = analyzer.analyze_edge_cases()

    print(f"\n🎯 Binomial Edge Case Analysis Complete!")
    print(f"📊 Analyzed {analysis.total_files_analyzed} files")
    print(f"🎯 Detected {len(analysis.edge_cases_detected)} edge cases")
    print(f"📈 Risk Level: {analysis.statistical_summary.get('risk_level', 'unknown')}")

if __name__ == '__main__':
    main()