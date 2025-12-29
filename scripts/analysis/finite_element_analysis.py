#!/usr/bin/env python3
"""
Finite Element Analysis of Codebase with Markov Chain Modeling
Analyzes codebase structure using FEA principles with N=5 Markov chains and P<0.10 binomial distribution
"""

import os
import re
import json
import networkx as nx
import numpy as np
from collections import defaultdict, Counter
from pathlib import Path
import matplotlib.pyplot as plt

class FiniteElementAnalyzer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.graph = nx.DiGraph()
        self.file_nodes = []
        self.dependency_matrix = {}
        self.markov_chain = defaultdict(lambda: defaultdict(float))
        self.binomial_probs = {}

    def analyze_codebase(self):
        """Main analysis pipeline"""
        print("🔬 Starting Finite Element Analysis of Codebase")

        # Phase 1: Structural Analysis
        self.structural_analysis()

        # Phase 2: Dependency Analysis
        self.dependency_analysis()

        # Phase 3: Markov Chain Modeling (N=5)
        self.markov_modeling(n=5)

        # Phase 4: Binomial Distribution Analysis (P<0.10)
        self.binomial_analysis(p_threshold=0.10)

        # Phase 5: Generate FEA Report
        self.generate_report()

    def structural_analysis(self):
        """Analyze codebase structure as finite elements"""
        print("📊 Phase 1: Structural Analysis")

        for ext in ['.py', '.js', '.ts', '.rs', '.java', '.go', '.cpp', '.c']:
            files = list(self.root_path.rglob(f'*{ext}'))
            self.file_nodes.extend(files)

            print(f"Found {len(files)} {ext} files")

        # Create element nodes
        for file_path in self.file_nodes:
            rel_path = file_path.relative_to(self.root_path)
            self.graph.add_node(str(rel_path), type='file', extension=file_path.suffix)

        print(f"Total elements (files): {len(self.file_nodes)}")

    def dependency_analysis(self):
        """Analyze dependencies between elements"""
        print("🔗 Phase 2: Dependency Analysis")

        for file_path in self.file_nodes:
            if file_path.suffix in ['.py', '.js', '.ts']:
                self.analyze_file_dependencies(file_path)

    def analyze_file_dependencies(self, file_path: Path):
        """Analyze dependencies in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            rel_path = file_path.relative_to(self.root_path)

            # Python imports
            if file_path.suffix == '.py':
                imports = re.findall(r'^(?:from\s+(\S+)|import\s+(\S+))', content, re.MULTILINE)
                for imp in imports:
                    module = imp[0] or imp[1]
                    if module and not module.startswith('.'):
                        self.graph.add_edge(str(rel_path), module, type='import')

            # JavaScript/TypeScript imports
            elif file_path.suffix in ['.js', '.ts']:
                imports = re.findall(r'(?:import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]|require\s*\(\s*[\'"]([^\'"]+)[\'"])', content)
                for imp in imports:
                    module = imp[0] or imp[1]
                    if module and not module.startswith('.'):
                        self.graph.add_edge(str(rel_path), module, type='import')

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def markov_modeling(self, n: int = 5):
        """Create N-gram Markov chain model"""
        print(f"🎲 Phase 3: Markov Chain Modeling (N={n})")

        # Analyze code patterns
        code_sequences = []

        for file_path in self.file_nodes[:100]:  # Sample for performance
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Extract function/method names as states
                if file_path.suffix == '.py':
                    patterns = re.findall(r'def\s+(\w+)', content)
                elif file_path.suffix in ['.js', '.ts']:
                    patterns = re.findall(r'(?:function\s+(\w+)|const\s+(\w+)\s*=|\b(\w+)\s*\()', content)
                    patterns = [p for sub in patterns for p in sub if p]
                else:
                    continue

                if len(patterns) >= n:
                    code_sequences.extend([patterns[i:i+n] for i in range(len(patterns)-n+1)])

            except Exception as e:
                continue

        # Build Markov chain
        for sequence in code_sequences:
            for i in range(len(sequence)-1):
                current_state = sequence[i]
                next_state = sequence[i+1]
                self.markov_chain[current_state][next_state] += 1

        # Normalize probabilities
        for current_state in self.markov_chain:
            total = sum(self.markov_chain[current_state].values())
            for next_state in self.markov_chain[current_state]:
                self.markov_chain[current_state][next_state] /= total

        print(f"Markov states: {len(self.markov_chain)}")

    def binomial_analysis(self, p_threshold: float = 0.10):
        """Analyze using binomial distribution"""
        print(f"📈 Phase 4: Binomial Distribution Analysis (P<{p_threshold})")

        # Analyze connectivity patterns
        degrees = dict(self.graph.degree())
        in_degrees = dict(self.graph.in_degree())
        out_degrees = dict(self.graph.out_degree())

        # Calculate binomial probabilities
        total_nodes = len(self.graph.nodes())
        for node in self.graph.nodes():
            k = degrees.get(node, 0)  # successes (connections)
            n = total_nodes - 1  # trials (possible connections)
            p = k / n if n > 0 else 0

            if p < p_threshold:
                self.binomial_probs[node] = {
                    'connections': k,
                    'possible_connections': n,
                    'probability': p,
                    'significant': p < p_threshold
                }

        significant_nodes = sum(1 for node in self.binomial_probs.values() if node['significant'])
        print(f"Significant binomial nodes (P<{p_threshold}): {significant_nodes}")

    def generate_report(self):
        """Generate comprehensive FEA report"""
        print("📋 Phase 5: Generating FEA Report")

        report = {
            'structural_analysis': {
                'total_files': len(self.file_nodes),
                'file_types': Counter(f.suffix for f in self.file_nodes),
                'graph_nodes': len(self.graph.nodes()),
                'graph_edges': len(self.graph.edges())
            },
            'dependency_analysis': {
                'import_edges': len([e for e in self.graph.edges(data=True) if e[2].get('type') == 'import']),
                'connected_components': nx.number_connected_components(self.graph.to_undirected())
            },
            'markov_analysis': {
                'states': len(self.markov_chain),
                'total_transitions': sum(len(transitions) for transitions in self.markov_chain.values()),
                'top_states': sorted(self.markov_chain.keys(), key=lambda x: len(self.markov_chain[x]), reverse=True)[:10]
            },
            'binomial_analysis': {
                'analyzed_nodes': len(self.binomial_probs),
                'significant_nodes': len([n for n in self.binomial_probs.values() if n['significant']]),
                'avg_probability': np.mean([n['probability'] for n in self.binomial_probs.values()])
            },
            'recommendations': self.generate_recommendations()
        }

        # Save report
        with open(self.root_path / 'finite_element_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"Report saved to: {self.root_path / 'finite_element_analysis_report.json'}")

        # Generate visualization
        self.generate_visualization()

    def generate_recommendations(self):
        """Generate architectural recommendations based on analysis"""
        recommendations = []

        # Graph analysis recommendations
        if nx.number_connected_components(self.graph.to_undirected()) > 10:
            recommendations.append("High number of disconnected components - consider modularization")

        # Markov chain recommendations
        if len(self.markov_chain) < 50:
            recommendations.append("Low code pattern diversity - consider more consistent coding standards")

        # Binomial analysis recommendations
        significant_count = len([n for n in self.binomial_probs.values() if n['significant']])
        if significant_count > len(self.binomial_probs) * 0.8:
            recommendations.append("Most files have low connectivity - improve coupling and cohesion")

        return recommendations

    def generate_visualization(self):
        """Generate visualization of the analysis"""
        try:
            # Create degree distribution plot
            degrees = [d for n, d in self.graph.degree()]
            plt.figure(figsize=(10, 6))
            plt.hist(degrees, bins=50, alpha=0.7)
            plt.xlabel('Node Degree')
            plt.ylabel('Frequency')
            plt.title('Codebase Connectivity Distribution')
            plt.yscale('log')
            plt.savefig(self.root_path / 'connectivity_distribution.png', dpi=150, bbox_inches='tight')
            plt.close()

            print(f"Visualization saved to: {self.root_path / 'connectivity_distribution.png'}")

        except Exception as e:
            print(f"Visualization error: {e}")

def main():
    analyzer = FiniteElementAnalyzer('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}')
    analyzer.analyze_codebase()

if __name__ == '__main__':
    main()