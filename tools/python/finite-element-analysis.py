#!/usr/bin/env python3

"""
Finite Element Analysis for Codebase Architecture
Using Markov Chains (n=5) and Binomial Distribution (p<0.10, n=5)
Models codebase as sphere with edge conditions and boundaries
"""

import os
import sys
import json
import hashlib
import statistics
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Set
import numpy as np
from scipy import stats
from dataclasses import dataclass, field
import networkx as nx
from sklearn.cluster import SpectralClustering
from sklearn.metrics import silhouette_score

@dataclass
class CodeElement:
    """Represents a code element in the finite element model"""
    path: str
    type: str  # file, directory, module, function, class
    size: int
    dependencies: Set[str] = field(default_factory=set)
    dependents: Set[str] = field(default_factory=set)
    complexity: float = 0.0
    stability: float = 0.0
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)  # spherical coordinates

@dataclass
class FiniteElement:
    """Represents a finite element in the spherical model"""
    center: Tuple[float, float, float]
    radius: float
    elements: List[CodeElement] = field(default_factory=list)
    stress: float = 0.0
    strain: float = 0.0
    boundary_conditions: Dict[str, float] = field(default_factory=dict)

class FiniteElementAnalyzer:
    """Finite Element Analysis using Markov Chains and Binomial Distribution"""

    def __init__(self, project_root: str, markov_order: int = 5, binomial_n: int = 5, binomial_p: float = 0.05):
        self.project_root = Path(project_root)
        self.markov_order = markov_order  # n=5 for Markov chains
        self.binomial_n = binomial_n      # n=5 for binomial
        self.binomial_p = binomial_p      # p<0.10 as requested

        # Spherical model parameters
        self.sphere_radius = 1.0
        self.elements: Dict[str, CodeElement] = {}
        self.finite_elements: List[FiniteElement] = []
        self.markov_chains: Dict[str, Dict[str, float]] = {}
        self.dependency_graph = nx.DiGraph()

        # ADR compliance tracking
        self.adr_violations: List[Dict] = []
        self.architecture_patterns: Dict[str, List[str]] = defaultdict(list)

    def analyze_codebase(self) -> Dict:
        """Main analysis function using finite element methods"""

        print("🔬 Starting Finite Element Analysis...")
        print(f"📊 Markov Chain Order: n={self.markov_order}")
        print(f"📊 Binomial Distribution: n={self.binomial_n}, p={self.binomial_p}")
        print(f"📊 Spherical Model: radius={self.sphere_radius}")

        # Phase 1: Discover all code elements
        self._discover_elements()

        # Phase 2: Build dependency graph
        self._build_dependency_graph()

        # Phase 3: Apply finite element modeling
        self._apply_spherical_modeling()

        # Phase 4: Markov chain analysis
        self._markov_chain_analysis()

        # Phase 5: Binomial distribution assessment
        self._binomial_assessment()

        # Phase 6: ADR compliance analysis
        self._adr_compliance_analysis()

        # Phase 7: Generate recommendations
        recommendations = self._generate_recommendations()

        return {
            'elements_analyzed': len(self.elements),
            'finite_elements': len(self.finite_elements),
            'dependency_graph_size': len(self.dependency_graph),
            'markov_chains': len(self.markov_chains),
            'adr_violations': len(self.adr_violations),
            'architecture_patterns': dict(self.architecture_patterns),
            'recommendations': recommendations,
            'spherical_model': self._spherical_model_summary(),
            'stress_analysis': self._stress_analysis_summary()
        }

    def _discover_elements(self):
        """Discover all code elements in the codebase"""

        extensions = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.rs': 'rust',
            '.go': 'go',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'header',
            '.toml': 'config',
            '.json': 'config',
            '.yaml': 'config',
            '.yml': 'config',
            '.md': 'documentation'
        }

        for file_path in self.project_root.rglob('*'):
            if file_path.is_file() and not any(part.startswith('.') for part in file_path.parts):
                ext = file_path.suffix.lower()
                if ext in extensions:
                    try:
                        size = file_path.stat().st_size
                        element_type = extensions[ext]

                        element = CodeElement(
                            path=str(file_path.relative_to(self.project_root)),
                            type=element_type,
                            size=size
                        )

                        # Calculate complexity (simplified)
                        element.complexity = self._calculate_complexity(file_path)
                        element.stability = self._calculate_stability(element)

                        self.elements[str(file_path.relative_to(self.project_root))] = element

                    except (OSError, UnicodeDecodeError):
                        continue

        print(f"📁 Discovered {len(self.elements)} code elements")

    def _calculate_complexity(self, file_path: Path) -> float:
        """Calculate code complexity using multiple metrics"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Simple complexity metrics
            lines = len(content.split('\n'))
            functions = content.count('def ') + content.count('function ')
            classes = content.count('class ')
            imports = content.count('import ') + content.count('from ')

            # Weighted complexity score
            complexity = (
                lines * 0.1 +
                functions * 0.3 +
                classes * 0.5 +
                imports * 0.1 +
                len(content) * 0.001
            )

            return min(complexity, 100.0)  # Cap at 100

        except:
            return 0.0

    def _calculate_stability(self, element: CodeElement) -> float:
        """Calculate stability based on dependencies and usage patterns"""
        # Simplified stability calculation
        # Lower dependencies = higher stability
        dependency_factor = 1.0 / (1.0 + len(element.dependencies))

        # Higher usage = higher stability
        usage_factor = min(len(element.dependents) * 0.1, 1.0)

        # File type stability weights
        type_weights = {
            'config': 1.0,
            'documentation': 0.9,
            'rust': 0.8,
            'go': 0.8,
            'typescript': 0.7,
            'javascript': 0.6,
            'python': 0.6,
            'java': 0.5,
            'cpp': 0.5,
            'c': 0.4,
            'header': 0.3
        }

        type_stability = type_weights.get(element.type, 0.5)

        stability = (dependency_factor * 0.4 + usage_factor * 0.4 + type_stability * 0.2)
        return min(stability, 1.0)

    def _build_dependency_graph(self):
        """Build dependency graph using advanced analysis"""

        for path, element in self.elements.items():
            self.dependency_graph.add_node(path, **element.__dict__)

            # Analyze imports and dependencies
            try:
                file_path = self.project_root / path
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                dependencies = self._extract_dependencies(content, element.type)
                for dep in dependencies:
                    if dep in self.elements:
                        self.dependency_graph.add_edge(path, dep)
                        element.dependencies.add(dep)
                        self.elements[dep].dependents.add(path)

            except:
                continue

        print(f"🔗 Built dependency graph with {len(self.dependency_graph)} nodes and {len(self.dependency_graph.edges)} edges")

    def _extract_dependencies(self, content: str, file_type: str) -> Set[str]:
        """Extract dependencies based on file type"""

        dependencies = set()

        if file_type == 'python':
            # Python imports
            import re
            import_patterns = [
                r'^import\s+(\w+)',
                r'^from\s+(\w+)\s+import',
            ]
            for pattern in import_patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                dependencies.update(matches)

        elif file_type in ['javascript', 'typescript']:
            # JS/TS imports
            import re
            import_patterns = [
                r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]",
                r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
            ]
            for pattern in import_patterns:
                matches = re.findall(pattern, content)
                # Extract module names
                for match in matches:
                    if '/' in match:
                        module = match.split('/')[0]
                        dependencies.add(module)
                    else:
                        dependencies.add(match)

        elif file_type == 'rust':
            # Rust dependencies
            import re
            use_pattern = r'use\s+([^;]+)::'
            matches = re.findall(use_pattern, content)
            dependencies.update(matches)

        elif file_type == 'go':
            # Go imports
            import re
            import_pattern = r'import\s+\(\s*[\s\S]*?\n\s*["\']([^"\']+)["\']'
            matches = re.findall(import_pattern, content, re.DOTALL)
            dependencies.update(matches)

        return dependencies

    def _apply_spherical_modeling(self):
        """Apply spherical finite element modeling"""

        # Convert dependency graph to spherical coordinates
        for node in self.dependency_graph.nodes():
            element = self.elements[node]

            # Use graph layout to determine spherical position
            # Simplified: use centrality measures for positioning
            try:
                centrality = nx.betweenness_centrality(self.dependency_graph)
                closeness = nx.closeness_centrality(self.dependency_graph)

                # Map to spherical coordinates
                theta = centrality.get(node, 0) * 2 * np.pi  # azimuth
                phi = closeness.get(node, 0) * np.pi          # elevation
                r = self.sphere_radius * element.stability     # radius based on stability

                element.position = (r, theta, phi)

            except:
                # Fallback positioning
                element.position = (self.sphere_radius, 0, 0)

        # Create finite elements (clusters on sphere)
        positions = np.array([elem.position for elem in self.elements.values()])

        if len(positions) > 1:
            # Spectral clustering for finite elements
            n_clusters = min(10, len(positions))
            clustering = SpectralClustering(n_clusters=n_clusters, random_state=42)
            labels = clustering.fit_predict(positions)

            # Create finite elements
            for i in range(n_clusters):
                cluster_elements = [elem for elem, label in zip(self.elements.values(), labels) if label == i]

                if cluster_elements:
                    # Calculate cluster center
                    cluster_positions = np.array([elem.position for elem in cluster_elements])
                    center = np.mean(cluster_positions, axis=0)

                    # Calculate radius (max distance from center)
                    distances = np.linalg.norm(cluster_positions - center, axis=1)
                    radius = np.max(distances) if len(distances) > 0 else 0.1

                    fe = FiniteElement(
                        center=tuple(center),
                        radius=float(radius),
                        elements=cluster_elements
                    )

                    # Calculate stress and strain
                    fe.stress = self._calculate_stress(fe)
                    fe.strain = self._calculate_strain(fe)

                    self.finite_elements.append(fe)

        print(f"🌐 Created {len(self.finite_elements)} finite elements in spherical model")

    def _calculate_stress(self, fe: FiniteElement) -> float:
        """Calculate stress in finite element"""
        if not fe.elements:
            return 0.0

        # Stress based on complexity and dependency density
        complexities = [elem.complexity for elem in fe.elements]
        dependencies = sum(len(elem.dependencies) for elem in fe.elements)

        avg_complexity = statistics.mean(complexities) if complexities else 0
        dependency_density = dependencies / len(fe.elements) if fe.elements else 0

        stress = (avg_complexity * 0.6 + dependency_density * 0.4) / 100.0
        return min(stress, 1.0)

    def _calculate_strain(self, fe: FiniteElement) -> float:
        """Calculate strain in finite element"""
        if not fe.elements:
            return 0.0

        # Strain based on stability variation
        stabilities = [elem.stability for elem in fe.elements]

        if len(stabilities) > 1:
            strain = statistics.stdev(stabilities)
        else:
            strain = 0.0

        return min(strain, 1.0)

    def _markov_chain_analysis(self):
        """Apply Markov chain analysis (n=5)"""

        print(f"🔗 Applying Markov Chain Analysis (order n={self.markov_order})")

        # Analyze sequences in dependency chains
        for node in self.dependency_graph.nodes():
            successors = list(self.dependency_graph.successors(node))
            if len(successors) >= self.markov_order:
                # Create Markov chain for this node's dependencies
                chain = defaultdict(lambda: defaultdict(float))

                # Analyze sequences of length n
                for i in range(len(successors) - self.markov_order):
                    current_state = tuple(successors[i:i+self.markov_order])
                    next_state = successors[i + self.markov_order]

                    chain[current_state][next_state] += 1.0

                # Normalize probabilities
                for state in chain:
                    total = sum(chain[state].values())
                    if total > 0:
                        for next_state in chain[state]:
                            chain[state][next_state] /= total

                if chain:
                    self.markov_chains[node] = dict(chain)

        print(f"🔗 Created {len(self.markov_chains)} Markov chains")

    def _binomial_assessment(self):
        """Apply binomial distribution assessment (n=5, p<0.10)"""

        print(f"📊 Applying Binomial Distribution Assessment (n={self.binomial_n}, p={self.binomial_p})")

        # Assess each finite element using binomial distribution
        for fe in self.finite_elements:
            if fe.elements:
                # Calculate probability of "good" elements
                good_elements = sum(1 for elem in fe.elements if elem.stability > 0.7)

                # Binomial test: probability of having "good" elements
                p_value = stats.binom_test(good_elements, len(fe.elements), self.binomial_p)

                # Determine if finite element passes binomial test
                fe.boundary_conditions['binomial_test'] = p_value
                fe.boundary_conditions['good_elements_ratio'] = good_elements / len(fe.elements)

        # Overall assessment
        passing_elements = sum(1 for fe in self.finite_elements
                             if fe.boundary_conditions.get('binomial_test', 1.0) < 0.05)

        print(f"📊 Binomial assessment: {passing_elements}/{len(self.finite_elements)} finite elements pass test")

    def _adr_compliance_analysis(self):
        """Analyze ADR (Architecture Decision Records) compliance"""

        print("📋 Analyzing ADR compliance...")

        # ADR patterns to check
        adr_patterns = {
            'microservices': ['service', 'api', 'microservice'],
            'event_driven': ['event', 'message', 'queue', 'stream'],
            'cqrs': ['command', 'query', 'event'],
            'ddd': ['domain', 'entity', 'aggregate', 'repository'],
            'hexagonal': ['port', 'adapter', 'application', 'domain'],
            'layered': ['presentation', 'application', 'domain', 'infrastructure']
        }

        # Check directory structure for ADR compliance
        for root, dirs, files in os.walk(self.project_root):
            rel_root = os.path.relpath(root, self.project_root)

            for pattern_name, keywords in adr_patterns.items():
                if any(keyword in rel_root.lower() for keyword in keywords):
                    self.architecture_patterns[pattern_name].append(rel_root)

            # Check for ADR violations
            if len(dirs) > 20:  # Too many subdirectories
                self.adr_violations.append({
                    'type': 'directory_complexity',
                    'path': rel_root,
                    'issue': f'Too many subdirectories ({len(dirs)})',
                    'recommendation': 'Consider flattening or grouping directories'
                })

        print(f"📋 Found {len(self.adr_violations)} ADR violations")
        print(f"📋 Identified {len(self.architecture_patterns)} architectural patterns")

    def _generate_recommendations(self) -> Dict:
        """Generate recommendations based on analysis"""

        recommendations = {
            'critical': [],
            'high': [],
            'medium': [],
            'low': []
        }

        # Critical: High stress finite elements
        for fe in self.finite_elements:
            if fe.stress > 0.8:
                recommendations['critical'].append({
                    'type': 'high_stress_element',
                    'center': fe.center,
                    'stress': fe.stress,
                    'elements': len(fe.elements),
                    'recommendation': 'Refactor this code cluster - high complexity and coupling'
                })

        # High: ADR violations
        for violation in self.adr_violations[:5]:  # Top 5
            recommendations['high'].append({
                'type': 'adr_violation',
                'violation': violation,
                'recommendation': 'Address architectural inconsistency'
            })

        # Medium: Low stability elements
        unstable_elements = [(path, elem) for path, elem in self.elements.items()
                           if elem.stability < 0.3][:10]
        for path, elem in unstable_elements:
            recommendations['medium'].append({
                'type': 'low_stability',
                'element': path,
                'stability': elem.stability,
                'recommendation': 'Consider refactoring or removing this unstable component'
            })

        # Low: Optimization opportunities
        if len(self.markov_chains) < len(self.elements) * 0.1:
            recommendations['low'].append({
                'type': 'dependency_analysis',
                'current_coverage': len(self.markov_chains),
                'total_elements': len(self.elements),
                'recommendation': 'Improve dependency analysis coverage'
            })

        return recommendations

    def _spherical_model_summary(self) -> Dict:
        """Generate spherical model summary"""
        return {
            'total_elements': len(self.elements),
            'finite_elements': len(self.finite_elements),
            'sphere_radius': self.sphere_radius,
            'average_stress': statistics.mean(fe.stress for fe in self.finite_elements) if self.finite_elements else 0,
            'average_strain': statistics.mean(fe.strain for fe in self.finite_elements) if self.finite_elements else 0,
            'max_stress': max((fe.stress for fe in self.finite_elements), default=0),
            'max_strain': max((fe.strain for fe in self.finite_elements), default=0)
        }

    def _stress_analysis_summary(self) -> Dict:
        """Generate stress analysis summary"""
        if not self.finite_elements:
            return {}

        stresses = [fe.stress for fe in self.finite_elements]
        strains = [fe.strain for fe in self.finite_elements]

        return {
            'stress_distribution': {
                'mean': statistics.mean(stresses),
                'median': statistics.median(stresses),
                'std_dev': statistics.stdev(stresses) if len(stresses) > 1 else 0,
                'min': min(stresses),
                'max': max(stresses)
            },
            'strain_distribution': {
                'mean': statistics.mean(strains),
                'median': statistics.median(strains),
                'std_dev': statistics.stdev(strains) if len(strains) > 1 else 0,
                'min': min(strains),
                'max': max(strains)
            },
            'binomial_test_pass_rate': sum(1 for fe in self.finite_elements
                                         if fe.boundary_conditions.get('binomial_test', 1.0) < 0.05) / len(self.finite_elements)
        }

def main():
    """Main entry point"""
    if len(sys.argv) != 2:
        print("Usage: python finite-element-analysis.py <project_root>")
        sys.exit(1)

    project_root = sys.argv[1]

    if not os.path.exists(project_root):
        print(f"Error: Project root {project_root} does not exist")
        sys.exit(1)

    analyzer = FiniteElementAnalyzer(project_root)

    try:
        results = analyzer.analyze_codebase()

        # Output results
        print("\n" + "="*80)
        print("FINITE ELEMENT ANALYSIS RESULTS")
        print("="*80)

        print(f"\n📊 Analysis Summary:")
        print(f"   Elements Analyzed: {results['elements_analyzed']}")
        print(f"   Finite Elements: {results['finite_elements']}")
        print(f"   Dependency Graph Size: {results['dependency_graph_size']}")
        print(f"   Markov Chains: {results['markov_chains']}")
        print(f"   ADR Violations: {results['adr_violations']}")

        print(f"\n🌐 Spherical Model:")
        sphere = results['spherical_model']
        print(f"   Average Stress: {sphere['average_stress']:.3f}")
        print(f"   Average Strain: {sphere['average_strain']:.3f}")
        print(f"   Max Stress: {sphere['max_stress']:.3f}")
        print(f"   Max Strain: {sphere['max_strain']:.3f}")

        print(f"\n🔬 Stress Analysis:")
        stress = results['stress_analysis']
        if stress:
            print(f"   Binomial Test Pass Rate: {stress['binomial_test_pass_rate']:.1%}")

        print(f"\n📋 Recommendations by Priority:")
        for priority, recs in results['recommendations'].items():
            if recs:
                print(f"   {priority.upper()}: {len(recs)} items")

        # Save detailed results
        output_file = os.path.join(project_root, 'finite-element-analysis-results.json')
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)

        print(f"\n💾 Detailed results saved to: {output_file}")

        # Overall assessment
        critical_count = len(results['recommendations']['critical'])
        if critical_count > 0:
            print(f"\n🚨 CRITICAL ISSUES FOUND: {critical_count}")
            print("   Immediate attention required!")
        else:
            print(f"\n✅ ANALYSIS COMPLETE: No critical issues found")

    except Exception as e:
        print(f"Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()