#!/usr/bin/env python3
"""
NUMERICAL METHODS AUDIT - Using Statistical Analysis to Fix Everything
Evaluate codebase quality using numerical methods and fix violations
"""

import os
import sys
import json
import subprocess
import statistics
from pathlib import Path
from collections import defaultdict, Counter
import numpy as np
from scipy import stats
import math

class NumericalMethodsAuditor:
    def __init__(self):
        self.metrics = defaultdict(list)
        self.violations = defaultdict(int)
        self.quality_scores = {}

    def run_statistical_analysis(self, file_path):
        """Run statistical analysis on file content"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')
            if not lines:
                return

            # Basic statistical metrics
            line_lengths = [len(line) for line in lines if line.strip()]
            if line_lengths:
                self.metrics['line_lengths'].extend(line_lengths)
                self.metrics['file_sizes'].append(len(content))

                # Complexity analysis using entropy
                entropy = self.calculate_entropy(content)
                self.metrics['complexity_entropy'].append(entropy)

                # Code quality indicators
                self.analyze_code_quality(content, file_path)

        except Exception as e:
            self.violations['read_errors'] += 1

    def calculate_entropy(self, text):
        """Calculate Shannon entropy as complexity measure"""
        if not text:
            return 0

        char_counts = Counter(text)
        total_chars = len(text)

        entropy = 0
        for count in char_counts.values():
            probability = count / total_chars
            entropy -= probability * math.log2(probability)

        return entropy

    def analyze_code_quality(self, content, file_path):
        """Analyze code quality using statistical methods"""
        # Hardcoded paths (violation)
        if '${HOME}' in content:
            self.violations['hardcoded_paths'] += 1

        # Console.log usage (violation)
        if 'console.log' in content:
            self.violations['console_logging'] += 1

        # TODO/FIXME comments (technical debt)
        if any(x in content.upper() for x in ['TODO', 'FIXME', 'HACK']):
            self.violations['technical_debt'] += 1

        # Dangerous eval usage
        if 'eval(' in content:
            self.violations['security_risks'] += 1

        # Code quality metrics
        lines = content.split('\n')
        functions = len([l for l in lines if any(kw in l for kw in ['def ', 'function ', 'class '])])
        comments = len([l for l in lines if l.strip().startswith(('#', '//', '/*'))])

        if functions > 0:
            comment_ratio = comments / functions
            self.metrics['comment_ratios'].append(comment_ratio)

            # Statistical analysis of function complexity
            self.metrics['functions_per_file'].append(functions)

    def calculate_quality_score(self):
        """Calculate overall quality score using statistical methods"""
        # Normalize metrics using z-scores
        if self.metrics['file_sizes']:
            file_sizes = np.array(self.metrics['file_sizes'])
            self.quality_scores['file_size_zscore'] = stats.zscore(file_sizes).mean()

        if self.metrics['complexity_entropy']:
            entropy = np.array(self.metrics['complexity_entropy'])
            self.quality_scores['entropy_zscore'] = stats.zscore(entropy).mean()

        if self.metrics['comment_ratios']:
            ratios = np.array(self.metrics['comment_ratios'])
            self.quality_scores['documentation_zscore'] = stats.zscore(ratios).mean()

        # Violation penalties
        total_files = len(set(self.metrics['file_sizes']))
        if total_files > 0:
            self.quality_scores['violation_rate'] = sum(self.violations.values()) / total_files

        # Overall quality score (0-100, higher is better)
        base_score = 100

        # Penalize for violations
        violation_penalty = min(50, sum(self.violations.values()) * 2)
        base_score -= violation_penalty

        # Penalize for poor statistical metrics
        if 'entropy_zscore' in self.quality_scores:
            entropy_penalty = max(0, self.quality_scores['entropy_zscore'] * 10)
            base_score -= entropy_penalty

        if 'documentation_zscore' in self.quality_scores:
            doc_penalty = max(0, -self.quality_scores['documentation_zscore'] * 5)
            base_score -= doc_penalty

        self.quality_scores['overall_quality'] = max(0, min(100, base_score))

    def generate_fix_recommendations(self):
        """Generate fix recommendations using numerical analysis"""
        recommendations = []

        # Statistical analysis of violations
        total_violations = sum(self.violations.values())

        if self.violations['hardcoded_paths'] > 0:
            percentage = (self.violations['hardcoded_paths'] / total_violations) * 100
            recommendations.append(f"CRITICAL: Fix {self.violations['hardcoded_paths']} hardcoded paths ({percentage:.1f}% of violations)")

        if self.violations['security_risks'] > 0:
            recommendations.append(f"SECURITY: Remove {self.violations['security_risks']} dangerous eval() usages")

        if self.violations['technical_debt'] > 0:
            recommendations.append(f"MAINTENANCE: Address {self.violations['technical_debt']} TODO/FIXME items")

        # Statistical recommendations
        if self.metrics['complexity_entropy']:
            avg_entropy = statistics.mean(self.metrics['complexity_entropy'])
            if avg_entropy > 4.0:  # High entropy threshold
                recommendations.append(f"REFACTOR: High code complexity (entropy: {avg_entropy:.2f}) - consider modularization")

        if self.metrics['comment_ratios']:
            avg_ratio = statistics.mean(self.metrics['comment_ratios'])
            if avg_ratio < 0.5:  # Low documentation threshold
                recommendations.append(f"DOCUMENTATION: Improve commenting (avg ratio: {avg_ratio:.2f})")

        return recommendations

    def audit_directory(self, root_path):
        """Audit entire directory using numerical methods"""
        root = Path(root_path)

        print("🔢 RUNNING NUMERICAL METHODS AUDIT...")
        print("=" * 50)

        # Analyze all files
        for file_path in root.rglob('*'):
            if file_path.is_file() and not any(skip in str(file_path) for skip in ['.git', 'node_modules', '__pycache__', '.pixi']):
                try:
                    self.run_statistical_analysis(file_path)
                except:
                    pass

        # Calculate quality metrics
        self.calculate_quality_score()

        # Generate report
        print(f"📊 STATISTICAL ANALYSIS RESULTS:")
        print(f"Files analyzed: {len(self.metrics['file_sizes'])}")
        print(f"Total lines of code: {sum(self.metrics['line_lengths'])}")
        print()

        print("🎯 QUALITY METRICS:")
        for metric, score in self.quality_scores.items():
            if 'zscore' in metric:
                status = "⚠️  HIGH" if abs(score) > 1.5 else "✅ NORMAL" if abs(score) < 0.5 else "⚠️  MODERATE"
                print(f"  {metric}: {score:.3f} {status}")
            else:
                print(f"  {metric}: {score:.1f}")

        print()
        print("🚨 VIOLATION ANALYSIS:")
        for violation, count in self.violations.items():
            if count > 0:
                severity = "🔴 CRITICAL" if violation in ['hardcoded_paths', 'security_risks'] else "🟡 WARNING"
                print(f"  {violation}: {count} {severity}")

        print()
        print("💡 RECOMMENDATIONS:")
        recommendations = self.generate_fix_recommendations()
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec}")

        print()
        overall_score = self.quality_scores.get('overall_quality', 0)
        if overall_score >= 80:
            print(f"🎉 CODE QUALITY: EXCELLENT ({overall_score:.1f}/100)")
        elif overall_score >= 60:
            print(f"✅ CODE QUALITY: GOOD ({overall_score:.1f}/100)")
        else:
            print(f"⚠️  CODE QUALITY: NEEDS IMPROVEMENT ({overall_score:.1f}/100)")

def main():
    auditor = NumericalMethodsAuditor()
    auditor.audit_directory('${HOME}/Developer')

    # Save detailed results
    results = {
        'metrics': dict(auditor.metrics),
        'violations': dict(auditor.violations),
        'quality_scores': auditor.quality_scores,
        'recommendations': auditor.generate_fix_recommendations()
    }

    with open('${HOME}/Developer/numerical-audit-results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)

if __name__ == "__main__":
    main()