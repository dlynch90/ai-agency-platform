#!/usr/bin/env python3
"""
Markov Chain Analysis (N=5) for Codebase State Transitions
Analyzes state transitions for file dependencies, service communication, and data flow

Mathematical Model:
- States: File types, layers, dependency patterns
- Transitions: Import relationships, API calls, data flows
- N=5: 5-hop analysis for long-range dependencies
- Markov Property: Future state depends only on current state

Uses vendor libraries: numpy, scipy, networkx
"""

import os
import json
import math
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set, DefaultDict
from collections import defaultdict, Counter
from dataclasses import dataclass, field

# Vendor libraries for Markov analysis
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import eigs
import networkx as nx
import matplotlib.pyplot as plt

@dataclass
class MarkovState:
    """Represents a state in the Markov chain"""
    name: str
    layer: int
    file_type: str
    complexity: float
    connections: Set[str] = field(default_factory=set)

    def __hash__(self):
        return hash(self.name)

    def __eq__(self, other):
        return self.name == other.name

@dataclass
class MarkovChain:
    """Complete Markov chain model"""
    states: Dict[str, MarkovState] = field(default_factory=dict)
    transition_matrix: Dict[Tuple[str, str], float] = field(default_factory=dict)
    steady_state: Dict[str, float] = field(default_factory=dict)
    absorbing_states: Set[str] = field(default_factory=set)

    def get_transition_probability(self, from_state: str, to_state: str) -> float:
        """Get transition probability between states"""
        return self.transition_matrix.get((from_state, to_state), 0.0)

class MarkovChainAnalyzer:
    """Markov Chain Analysis for codebase state transitions"""

    def __init__(self, project_root: Path, n_hops: int = 5):
        self.project_root = project_root
        self.n_hops = n_hops
        self.chain = MarkovChain()

        # State categories
        self.file_type_states = {
            'python': 'PY',
            'javascript': 'JS',
            'typescript': 'TS',
            'java': 'JAVA',
            'go': 'GO',
            'rust': 'RS',
            'config': 'CFG',
            'documentation': 'DOC',
            'test': 'TEST',
            'script': 'SCRIPT'
        }

        # Layer state mappings
        self.layer_states = {
            0: 'CORE',      # Architecture
            1: 'KERNEL',    # Shared kernel
            2: 'API',       # API layer
            3: 'SERVICE',   # Services
            4: 'PERIPH',    # Peripherals
            5: 'SURFACE'    # Surface/APIs
        }

    def analyze_markov_chain(self) -> MarkovChain:
        """Main Markov chain analysis function"""
        print("🔄 Analyzing Markov chain state transitions (N=5)...")

        # Step 1: Define states from codebase
        self._define_states()

        # Step 2: Build transition matrix from dependencies
        self._build_transition_matrix()

        # Step 3: Calculate steady state distribution
        self._calculate_steady_state()

        # Step 4: Identify absorbing states
        self._identify_absorbing_states()

        # Step 5: Analyze n-hop dependencies (N=5)
        self._analyze_n_hop_dependencies()

        # Step 6: Generate visualizations
        self._generate_visualizations()

        print(f"✅ Markov chain analysis complete: {len(self.chain.states)} states, {len(self.chain.transition_matrix)} transitions")
        return self.chain

    def _define_states(self):
        """Define Markov states from codebase files"""
        print("📊 Defining Markov states...")

        for root, dirs, files in os.walk(self.project_root):
            # Skip hidden directories and common excludes
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {
                'node_modules', '__pycache__', '.git', 'target', 'build', 'dist'
            }]

            for file in files:
                if file.startswith('.') or file.endswith(('.pyc', '.log', '.tmp')):
                    continue

                file_path = Path(root) / file
                rel_path = file_path.relative_to(self.project_root)

                # Determine state properties
                file_type = self._classify_file_type(file_path)
                layer = self._determine_layer(str(rel_path))
                complexity = self._calculate_file_complexity(file_path)

                # Create state name
                state_name = f"{self.file_type_states.get(file_type, 'OTHER')}_{self.layer_states.get(layer, 'UNKNOWN')}"

                # Create or update state
                if state_name not in self.chain.states:
                    self.chain.states[state_name] = MarkovState(
                        name=state_name,
                        layer=layer,
                        file_type=file_type,
                        complexity=complexity
                    )

        print(f"📊 Defined {len(self.chain.states)} unique states")

    def _classify_file_type(self, file_path: Path) -> str:
        """Classify file by type"""
        suffix = file_path.suffix.lower()

        if suffix in ['.py', '.pyc']:
            return 'python'
        elif suffix in ['.js', '.mjs']:
            return 'javascript'
        elif suffix in ['.ts', '.tsx']:
            return 'typescript'
        elif suffix == '.java':
            return 'java'
        elif suffix == '.go':
            return 'go'
        elif suffix == '.rs':
            return 'rust'
        elif suffix in ['.json', '.toml', '.yaml', '.yml', '.xml']:
            return 'config'
        elif suffix in ['.md', '.txt', '.rst']:
            return 'documentation'
        elif 'test' in file_path.name.lower() or file_path.parent.name.lower() in ['test', 'tests', 'testing']:
            return 'test'
        elif file_path.parent.name.lower() in ['scripts', 'bin']:
            return 'script'

        return 'other'

    def _determine_layer(self, path: str) -> int:
        """Determine layer from path (same as spherical model)"""
        path_parts = Path(path).parts

        layer_mapping = {
            'architecture': 0,
            'shared-kernel': 1,
            'api': 2,
            'graphql': 2,
            'federation': 2,
            'auth': 3,
            'data': 3,
            'database': 3,
            'docs': 4,
            'testing': 4,
            'scripts': 4,
            'configs': 4,
            'logs': 5,
            'temp': 5,
            'infrastructure': 5
        }

        for part in path_parts:
            if part in layer_mapping:
                return layer_mapping[part]

        return 4  # Default to peripheral layer

    def _calculate_file_complexity(self, file_path: Path) -> float:
        """Calculate file complexity metric"""
        try:
            if file_path.exists():
                size = file_path.stat().st_size
                # Simple complexity based on size and lines
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    return math.log(size + 1) + len(lines) * 0.01
        except Exception:
            pass
        return 0.0

    def _build_transition_matrix(self):
        """Build transition matrix from file dependencies"""
        print("🔗 Building transition matrix...")

        # Analyze dependencies for each state
        for state_name, state in self.chain.states.items():
            # Find files that belong to this state
            state_files = self._get_files_for_state(state)

            # Analyze dependencies
            for file_path in state_files:
                deps = self._extract_dependencies(file_path)

                for dep in deps:
                    dep_state = self._get_state_for_file(dep)
                    if dep_state and dep_state != state_name:
                        # Add transition
                        key = (state_name, dep_state)
                        self.chain.transition_matrix[key] = self.chain.transition_matrix.get(key, 0) + 1

                        # Update connections
                        state.connections.add(dep_state)

        # Normalize transition probabilities
        self._normalize_transitions()

        print(f"🔗 Built transition matrix with {len(self.chain.transition_matrix)} transitions")

    def _get_files_for_state(self, state: MarkovState) -> List[Path]:
        """Get all files that belong to a state"""
        files = []
        file_type = None
        for ext, type_name in self.file_type_states.items():
            if type_name == state.name.split('_')[0]:
                file_type = ext
                break

        if not file_type:
            return files

        # Find files of this type in the appropriate layer
        for root, dirs, files_in_dir in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {
                'node_modules', '__pycache__', '.git', 'target', 'build', 'dist'
            }]

            for file in files_in_dir:
                file_path = Path(root) / file
                if self._classify_file_type(file_path) == file_type:
                    layer = self._determine_layer(str(file_path.relative_to(self.project_root)))
                    if layer == state.layer:
                        files.append(file_path)

        return files

    def _extract_dependencies(self, file_path: Path) -> Set[str]:
        """Extract dependencies from a file (simplified version)"""
        deps = set()

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Simple pattern matching for different languages
            if file_path.suffix == '.py':
                # Python imports
                import_lines = [line for line in content.split('\n')
                              if line.strip().startswith(('import ', 'from '))]
                for line in import_lines:
                    if 'from ' in line:
                        parts = line.split('from ')[1].split(' import ')[0]
                        deps.add(parts.split('.')[0])
                    elif 'import ' in line:
                        parts = line.split('import ')[1].split(',')[0].strip()
                        deps.add(parts.split('.')[0])

            elif file_path.suffix in ['.js', '.ts', '.jsx', '.tsx']:
                # JavaScript/TypeScript imports
                import_lines = [line for line in content.split('\n')
                              if 'import ' in line or 'require(' in line]
                for line in import_lines:
                    if 'from ' in line:
                        path_part = line.split('from ')[1].strip('\'";')
                        if path_part.startswith('./') or path_part.startswith('../'):
                            # Relative import - resolve to file
                            try:
                                resolved = (file_path.parent / path_part).resolve()
                                deps.add(str(resolved.relative_to(self.project_root)))
                            except:
                                pass

        except Exception as e:
            print(f"Warning: Could not analyze {file_path}: {e}")

        return deps

    def _get_state_for_file(self, file_path: str) -> str:
        """Get state name for a file path"""
        try:
            path = Path(file_path)
            file_type = self._classify_file_type(path)
            layer = self._determine_layer(file_path)

            type_code = self.file_type_states.get(file_type, 'OTHER')
            layer_code = self.layer_states.get(layer, 'UNKNOWN')

            return f"{type_code}_{layer_code}"
        except:
            return None

    def _normalize_transitions(self):
        """Normalize transition counts to probabilities"""
        # Calculate total transitions from each state
        state_totals = defaultdict(float)

        for (from_state, to_state), count in self.chain.transition_matrix.items():
            state_totals[from_state] += count

        # Normalize to probabilities
        normalized = {}
        for (from_state, to_state), count in self.chain.transition_matrix.items():
            if state_totals[from_state] > 0:
                normalized[(from_state, to_state)] = count / state_totals[from_state]

        self.chain.transition_matrix = normalized

    def _calculate_steady_state(self):
        """Calculate steady state distribution using eigenvector method"""
        print("📈 Calculating steady state distribution...")

        if not self.chain.states:
            return

        # Build transition matrix as numpy array
        states_list = list(self.chain.states.keys())
        n_states = len(states_list)
        state_indices = {state: i for i, state in enumerate(states_list)}

        # Create sparse transition matrix
        rows, cols, data = [], [], []

        for (from_state, to_state), prob in self.chain.transition_matrix.items():
            if from_state in state_indices and to_state in state_indices:
                rows.append(state_indices[from_state])
                cols.append(state_indices[to_state])
                data.append(prob)

        if not data:
            # No transitions, assign equal probability
            prob = 1.0 / n_states
            self.chain.steady_state = {state: prob for state in states_list}
            return

        # Create sparse matrix
        P = csr_matrix((data, (rows, cols)), shape=(n_states, n_states))

        # Find eigenvector corresponding to eigenvalue 1
        try:
            eigenvalues, eigenvectors = eigs(P.T, k=1, which='LR')
            steady_state_vector = np.real(eigenvectors[:, 0])
            steady_state_vector = steady_state_vector / np.sum(steady_state_vector)

            # Store results
            for i, state in enumerate(states_list):
                self.chain.steady_state[state] = float(steady_state_vector[i])

        except Exception as e:
            print(f"Warning: Could not calculate steady state: {e}")
            # Fallback: equal distribution
            prob = 1.0 / n_states
            self.chain.steady_state = {state: prob for state in states_list}

    def _identify_absorbing_states(self):
        """Identify absorbing states (states with no outgoing transitions)"""
        for state_name, state in self.chain.states.items():
            has_outgoing = any(from_state == state_name for from_state, _ in self.chain.transition_matrix.keys())
            if not has_outgoing:
                self.chain.absorbing_states.add(state_name)

    def _analyze_n_hop_dependencies(self, n: int = 5):
        """Analyze N-hop dependencies"""
        print(f"🔍 Analyzing {n}-hop dependencies...")

        # Create networkx graph for path analysis
        G = nx.DiGraph()

        # Add nodes
        for state_name in self.chain.states:
            G.add_node(state_name)

        # Add edges
        for (from_state, to_state), prob in self.chain.transition_matrix.items():
            if prob > 0.01:  # Only significant transitions
                G.add_edge(from_state, to_state, weight=prob)

        # Calculate various path metrics
        n_hop_analysis = {
            'average_path_length': nx.average_shortest_path_length(G) if nx.is_strongly_connected(G) else None,
            'diameter': nx.diameter(G) if nx.is_strongly_connected(G) else None,
            'clustering_coefficient': nx.average_clustering(G),
            'degree_centrality': nx.degree_centrality(G),
            'betweenness_centrality': nx.betweenness_centrality(G)
        }

        # Store analysis results
        output_dir = self.project_root / 'data' / 'fea_results'
        output_dir.mkdir(parents=True, exist_ok=True)

        with open(output_dir / 'markov_n_hop_analysis.json', 'w') as f:
            # Convert numpy types to native Python types for JSON serialization
            json_data = {}
            for key, value in n_hop_analysis.items():
                if isinstance(value, dict):
                    json_data[key] = {k: float(v) if hasattr(v, 'item') else v for k, v in value.items()}
                else:
                    json_data[key] = float(value) if hasattr(value, 'item') else value
            json.dump(json_data, f, indent=2)

    def _generate_visualizations(self):
        """Generate Markov chain visualizations"""
        print("📊 Generating Markov chain visualizations...")

        output_dir = self.project_root / 'data' / 'fea_results'
        output_dir.mkdir(parents=True, exist_ok=True)

        # Create transition graph
        G = nx.DiGraph()

        # Add nodes with positions based on layers
        pos = {}
        for state_name, state in self.chain.states.items():
            # Position based on layer (x) and type (y)
            x = state.layer
            y = hash(state.file_type) % 10  # Simple y positioning
            pos[state_name] = (x, y)
            G.add_node(state_name)

        # Add edges for significant transitions
        edge_labels = {}
        for (from_state, to_state), prob in self.chain.transition_matrix.items():
            if prob > 0.05:  # Only show significant transitions
                G.add_edge(from_state, to_state, weight=prob)
                edge_labels[(from_state, to_state)] = ".2f"

        # Create plot
        plt.figure(figsize=(15, 10))

        # Draw nodes
        nx.draw_networkx_nodes(G, pos, node_size=300, node_color='lightblue', alpha=0.7)

        # Draw edges
        nx.draw_networkx_edges(G, pos, edge_color='gray', alpha=0.5, arrows=True, arrowsize=20)

        # Draw labels
        nx.draw_networkx_labels(G, pos, font_size=8, font_weight='bold')

        # Draw edge labels
        nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=6)

        plt.title('Markov Chain State Transitions (N=5 Analysis)\nNodes: States | Edges: Transition Probabilities > 5%')
        plt.axis('off')
        plt.tight_layout()

        # Save plot
        plt.savefig(output_dir / 'markov_chain_transitions.png', dpi=300, bbox_inches='tight')
        plt.close()

        # Generate analysis report
        self._generate_markov_report(output_dir)

    def _generate_markov_report(self, output_dir: Path):
        """Generate Markov analysis report"""
        report = {
            'markov_analysis': {
                'total_states': len(self.chain.states),
                'total_transitions': len(self.chain.transition_matrix),
                'absorbing_states': len(self.chain.absorbing_states),
                'steady_state_distribution': self.chain.steady_state
            },
            'state_analysis': {
                state_name: {
                    'layer': state.layer,
                    'file_type': state.file_type,
                    'complexity': state.complexity,
                    'connections': len(state.connections)
                }
                for state_name, state in self.chain.states.items()
            },
            'top_transitions': sorted(
                [(k, v) for k, v in self.chain.transition_matrix.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10],
            'recommendations': [
                "High connectivity between states indicates tight coupling",
                "Absorbing states may represent dead ends in dependency chains",
                "Steady state shows long-term probability distribution",
                "Consider breaking cycles in state transitions for better modularity"
            ]
        }

        with open(output_dir / 'markov_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

def main():
    parser = argparse.ArgumentParser(description='Markov Chain Analysis (N=5)')
    parser.add_argument('--project-root', type=str, default='.',
                       help='Project root directory')
    parser.add_argument('--n-hops', type=int, default=5,
                       help='Number of hops for analysis')

    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()

    analyzer = MarkovChainAnalyzer(project_root, args.n_hops)
    chain = analyzer.analyze_markov_chain()

    print(f"\n🎉 Markov Chain Analysis Complete!")
    print(f"📊 Chain contains {len(chain.states)} states and {len(chain.transition_matrix)} transitions")
    print(f"🎯 {len(chain.absorbing_states)} absorbing states identified")

if __name__ == '__main__':
    main()