#!/usr/bin/env python3
"""
FINITE ELEMENT ANALYSIS - SPHERICAL CODEBASE MODELING
Analyzes codebase as a sphere with all edge conditions and boundaries
Uses Markov Chain (n=5) and Binomial Distribution (p<0.10, n=5) for statistical analysis
"""

import os
import sys
import json
import math
import statistics
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Set, Tuple, Any
import numpy as np
from scipy.stats import binom, norm

class SphericalCodebaseAnalyzer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.sphere_data = {}
        self.markov_chain = defaultdict(lambda: defaultdict(int))
        self.binomial_tests = []
        self.finite_elements = []

    def calculate_spherical_coordinates(self, file_path: Path) -> Tuple[float, float, float]:
        """Convert file path to spherical coordinates (r, θ, φ)"""
        rel_path = file_path.relative_to(self.root_path)

        # Radius = depth in directory tree
        radius = len(rel_path.parts)

        # Theta = azimuthal angle based on file extension
        ext = file_path.suffix.lower()
        ext_map = {
            '.py': 0, '.js': math.pi/4, '.ts': math.pi/2, '.rs': 3*math.pi/4,
            '.java': math.pi, '.go': 5*math.pi/4, '.cpp': 3*math.pi/2, '.sh': 7*math.pi/4,
            '.md': 2*math.pi, '.json': 2*math.pi, '.toml': 2*math.pi, '.yaml': 2*math.pi
        }
        theta = ext_map.get(ext, math.pi)

        # Phi = polar angle based on directory structure
        path_str = str(rel_path)
        phi = hash(path_str) % (2 * math.pi)

        return radius, theta, phi

    def analyze_file_as_finite_element(self, file_path: Path) -> Dict[str, Any]:
        """Analyze individual file as a finite element"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Calculate spherical coordinates
            r, theta, phi = self.calculate_spherical_coordinates(file_path)

            # Analyze content for edge conditions
            lines = content.split('\n')
            element = {
                'file_path': str(file_path),
                'spherical_coords': {'r': r, 'theta': theta, 'phi': phi},
                'metrics': {
                    'line_count': len(lines),
                    'char_count': len(content),
                    'avg_line_length': statistics.mean([len(line) for line in lines if line.strip()]) if lines else 0,
                    'complexity_score': self.calculate_complexity(content),
                    'hardcoded_paths': len([line for line in lines if '${USER_HOME:-${USER_HOME:-$HOME}}' in line]),
                    'custom_code_indicators': len([line for line in lines if any(x in line.lower() for x in ['todo', 'fixme', 'hack', 'custom'])]),
                    'vendor_imports': len([line for line in lines if any(x in line.lower() for x in ['import', 'from', 'require']) and any(vendor in line.lower() for vendor in ['prisma', 'neo4j', 'apollo', 'graphql', 'huggingface', 'transformers'])]),
                },
                'boundaries': {
                    'has_imports': any('import' in line or 'from' in line or 'require' in line for line in lines[:20]),
                    'has_exports': any('export' in line for line in lines),
                    'has_error_handling': any('try' in line or 'catch' in line or 'except' in line for line in lines),
                    'has_logging': any('log' in line.lower() for line in lines),
                    'has_tests': any('test' in line.lower() or 'spec' in line.lower() for line in lines),
                },
                'edge_conditions': {
                    'circular_dependencies': False,  # Would need deeper analysis
                    'missing_dependencies': False,   # Would need import analysis
                    'performance_bottlenecks': len([line for line in lines if 'for' in line and 'in' in line]) > 50,
                    'memory_leaks': any('global' in line.lower() or 'static' in line.lower() for line in lines),
                    'race_conditions': any('async' in line and 'await' not in content for line in lines),
                }
            }

            return element

        except Exception as e:
            return {
                'file_path': str(file_path),
                'error': str(e),
                'spherical_coords': {'r': 0, 'theta': 0, 'phi': 0}
            }

    def calculate_complexity(self, content: str) -> float:
        """Calculate code complexity score"""
        lines = content.split('\n')
        complexity = 0

        # Cyclomatic complexity indicators
        complexity += content.count('if ') * 2
        complexity += content.count('for ') * 1.5
        complexity += content.count('while ') * 1.5
        complexity += content.count('try:') * 1
        complexity += content.count('catch') * 1
        complexity += content.count('function') * 0.5
        complexity += content.count('class ') * 2

        # Normalize by line count
        return complexity / max(len(lines), 1)

    def build_markov_chain(self, file_paths: List[Path], n: int = 5):
        """Build Markov chain for file transition analysis"""
        for i in range(len(file_paths) - n):
            current_state = tuple(str(f) for f in file_paths[i:i+n])
            next_state = str(file_paths[i+n])

            self.markov_chain[current_state][next_state] += 1

    def binomial_distribution_test(self, p: float = 0.1, n: int = 5):
        """Perform binomial distribution tests for quality metrics"""
        # Test for code quality violations (should be low probability)
        files = list(self.root_path.rglob('*'))
        total_files = len(files)
        violations = sum(1 for f in files if self.is_violation_file(f))

        # Binomial test: P(violation files) < p
        k = violations  # number of successes (violations)
        prob_violation = binom.pmf(k, n, p)

        self.binomial_tests.append({
            'test': 'code_violations',
            'n': n,
            'p': p,
            'k': k,
            'probability': prob_violation,
            'significant': prob_violation < 0.05  # 95% confidence
        })

        return prob_violation

    def is_violation_file(self, file_path: Path) -> bool:
        """Check if file has violations"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            violations = [
                '${USER_HOME:-${USER_HOME:-$HOME}}' in content,  # hardcoded paths
                '// CONSOLE_LOG_VIOLATION: console.log' in content,        # console logging
                'TODO' in content.upper(),       # todos
                'FIXME' in content.upper(),      # fixmes
                len(content.split('\n')) > 1000, # too large files
                '// DANGEROUS_EVAL_VIOLATION: eval(' in content,             # dangerous eval
                'innerHTML' in content,         # XSS risk
            ]

            return any(violations)
        except:
            return False

    def analyze_sphere_boundaries(self) -> Dict[str, Any]:
        """Analyze codebase as spherical boundaries"""
        files = list(self.root_path.rglob('*'))
        self.finite_elements = []

        for file_path in files:
            if file_path.is_file():
                element = self.analyze_file_as_finite_element(file_path)
                self.finite_elements.append(element)

        # Build Markov chain
        self.build_markov_chain([Path(e['file_path']) for e in self.finite_elements])

        # Binomial tests
        self.binomial_distribution_test()

        # Calculate spherical statistics
        radii = [e['spherical_coords']['r'] for e in self.finite_elements if 'spherical_coords' in e]
        thetas = [e['spherical_coords']['theta'] for e in self.finite_elements if 'spherical_coords' in e]
        phis = [e['spherical_coords']['phi'] for e in self.finite_elements if 'spherical_coords' in e]

        sphere_analysis = {
            'total_elements': len(self.finite_elements),
            'spherical_distribution': {
                'radius_stats': {
                    'mean': statistics.mean(radii) if radii else 0,
                    'std': statistics.stdev(radii) if len(radii) > 1 else 0,
                    'min': min(radii) if radii else 0,
                    'max': max(radii) if radii else 0
                },
                'angular_distribution': {
                    'theta_clusters': len(set(round(t, 2) for t in thetas)),
                    'phi_uniformity': self.calculate_uniformity(phis)
                }
            },
            'boundary_conditions': self.analyze_boundary_conditions(),
            'edge_conditions': self.analyze_edge_conditions(),
            'markov_transitions': dict(self.markov_chain),
            'binomial_tests': self.binomial_tests,
            'recommendations': self.generate_recommendations()
        }

        return sphere_analysis

    def calculate_uniformity(self, angles: List[float]) -> float:
        """Calculate uniformity of angular distribution"""
        if not angles:
            return 0.0

        # Use Rayleigh test for circular uniformity
        mean_angle = statistics.mean(angles)
        r = math.sqrt(sum(math.cos(a - mean_angle) for a in angles)**2 +
                     sum(math.sin(a - mean_angle) for a in angles)**2) / len(angles)

        return r  # 1.0 = perfectly uniform, 0.0 = clustered

    def analyze_boundary_conditions(self) -> Dict[str, Any]:
        """Analyze boundary conditions of the spherical model"""
        boundaries = defaultdict(int)

        for element in self.finite_elements:
            if 'boundaries' in element:
                for boundary, value in element['boundaries'].items():
                    boundaries[f"{boundary}_{value}"] += 1

        return dict(boundaries)

    def analyze_edge_conditions(self) -> Dict[str, Any]:
        """Analyze edge conditions that could cause system instability"""
        edges = defaultdict(int)

        for element in self.finite_elements:
            if 'edge_conditions' in element:
                for edge, value in element['edge_conditions'].items():
                    edges[f"{edge}_{value}"] += 1

        return dict(edges)

    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on spherical analysis"""
        recommendations = []

        # Check for violations
        violation_count = sum(1 for e in self.finite_elements
                            if e.get('metrics', {}).get('hardcoded_paths', 0) > 0)
        if violation_count > 0:
            recommendations.append(f"Fix {violation_count} files with hardcoded paths")

        # Check for complexity issues
        complex_files = [e for e in self.finite_elements
                        if e.get('metrics', {}).get('complexity_score', 0) > 10]
        if complex_files:
            recommendations.append(f"Refactor {len(complex_files)} highly complex files")

        # Check boundary conditions
        boundaries = self.analyze_boundary_conditions()
        if boundaries.get('has_error_handling_False', 0) > boundaries.get('has_error_handling_True', 0):
            recommendations.append("Add error handling to majority of files")

        # Check edge conditions
        edges = self.analyze_edge_conditions()
        if edges.get('performance_bottlenecks_True', 0) > 0:
            recommendations.append("Optimize performance bottlenecks")

        return recommendations

def main():
    analyzer = SphericalCodebaseAnalyzer('${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}')

    print("🔍 FINITE ELEMENT SPHERICAL ANALYSIS")
    print("=" * 50)

    # Perform comprehensive analysis
    analysis = analyzer.analyze_sphere_boundaries()

    # Print results
    print(f"\n📊 SPHERICAL DISTRIBUTION:")
    print(f"Total Elements: {analysis['total_elements']}")

    radius_stats = analysis['spherical_distribution']['radius_stats']
    print(f"Radius Distribution: μ={radius_stats['mean']:.2f}, σ={radius_stats['std']:.2f}")
    print(f"Radius Range: [{radius_stats['min']}, {radius_stats['max']}]")

    angular = analysis['spherical_distribution']['angular_distribution']
    print(f"Angular Clusters: {angular['theta_clusters']}")
    print(f"Angular Uniformity: {angular['phi_uniformity']:.3f}")

    print(f"\n🎯 BOUNDARY CONDITIONS:")
    for condition, count in analysis['boundary_conditions'].items():
        print(f"  {condition}: {count}")

    print(f"\n⚠️  EDGE CONDITIONS:")
    for condition, count in analysis['edge_conditions'].items():
        if count > 0:
            print(f"  {condition}: {count}")

    print(f"\n📈 MARKOV CHAIN TRANSITIONS:")
    print(f"Total transition types: {len(analysis['markov_transitions'])}")

    print(f"\n🎲 BINOMIAL DISTRIBUTION TESTS:")
    for test in analysis['binomial_tests']:
        significance = "SIGNIFICANT" if test['significant'] else "NOT SIGNIFICANT"
        print(f"  {test['test']}: P={test['probability']:.6f} [{significance}]")

    print(f"\n💡 RECOMMENDATIONS:")
    for rec in analysis['recommendations']:
        print(f"  • {rec}")

    # Save detailed analysis
    with open('${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/spherical-analysis-results.json', 'w') as f:
        json.dump(analysis, f, indent=2, default=str)

    print(f"\n💾 Detailed results saved to: spherical-analysis-results.json")

if __name__ == '__main__':
    main()