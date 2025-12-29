#!/usr/bin/env python3
"""
Finite Element Analysis - Spherical Codebase Model
Maps codebase as 3D sphere with center/radius/surface/edge conditions

Mathematical Model:
- Center: Core architecture (radius = 0)
- Radius layers: Domain boundaries (microservices)
- Surface: API gateways and interfaces
- Edge conditions: Integration points, boundaries

Uses vendor libraries: numpy, scipy, matplotlib, networkx
"""

import os
import sys
import json
import math
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass, field
from collections import defaultdict

# Vendor libraries for FEA analysis
import numpy as np
from scipy.spatial.distance import pdist, squareform
from scipy.cluster.hierarchy import linkage, fcluster
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import networkx as nx

@dataclass
class SphericalNode:
    """Represents a node in the spherical codebase model"""
    path: str
    layer: int  # Radius layer (0 = center, higher = outer)
    theta: float  # Azimuthal angle (0-2π)
    phi: float  # Polar angle (0-π)
    category: str  # architecture, api, data, etc.
    dependencies: Set[str] = field(default_factory=set)
    dependents: Set[str] = field(default_factory=set)
    complexity: float = 0.0

@dataclass
class SphericalModel:
    """Complete spherical representation of codebase"""
    center: Tuple[float, float, float] = (0, 0, 0)
    nodes: Dict[str, SphericalNode] = field(default_factory=dict)
    layers: Dict[int, List[str]] = field(default_factory=dict)
    surface_nodes: List[str] = field(default_factory=list)
    edge_conditions: Dict[str, List[str]] = field(default_factory=dict)

    def to_cartesian(self, node: SphericalNode) -> Tuple[float, float, float]:
        """Convert spherical coordinates to Cartesian"""
        r, theta, phi = node.layer, node.theta, node.phi
        x = r * math.sin(phi) * math.cos(theta)
        y = r * math.sin(phi) * math.sin(theta)
        z = r * math.cos(phi)
        return (x, y, z)

class FEASphericalAnalyzer:
    """Finite Element Analysis using spherical coordinate system"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.model = SphericalModel()

        # Define layer mappings (radius from center)
        self.layer_mapping = {
            'architecture': 0,  # Core (center)
            'shared-kernel': 1,  # Inner layer
            'api': 2,            # Middle layer
            'graphql': 2,
            'federation': 2,
            'auth': 3,           # Outer layers
            'data': 3,
            'database': 3,
            'docs': 4,
            'testing': 4,
            'scripts': 4,
            'configs': 4,
            'logs': 5,           # Surface layer
            'temp': 5,
            'infrastructure': 5
        }

        # Surface layer categories (API interfaces)
        self.surface_categories = {'api', 'graphql', 'federation'}

    def analyze_codebase(self) -> SphericalModel:
        """Main analysis function"""
        print("🔍 Analyzing codebase structure...")

        # Step 1: Map all files to spherical coordinates
        self._map_files_to_sphere()

        # Step 2: Analyze dependencies
        self._analyze_dependencies()

        # Step 3: Calculate complexity metrics
        self._calculate_complexity()

        # Step 4: Identify edge conditions
        self._identify_edge_conditions()

        # Step 5: Generate visualizations
        self._generate_visualizations()

        print(f"✅ Spherical model complete: {len(self.model.nodes)} nodes across {len(self.model.layers)} layers")
        return self.model

    def _map_files_to_sphere(self):
        """Map files to spherical coordinates"""
        total_files = 0

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

                # Determine category and layer
                category = self._determine_category(str(rel_path))
                layer = self.layer_mapping.get(category, 4)  # Default to layer 4

                # Calculate angular coordinates
                theta, phi = self._calculate_angles(str(rel_path))

                # Create spherical node
                node = SphericalNode(
                    path=str(rel_path),
                    layer=layer,
                    theta=theta,
                    phi=phi,
                    category=category
                )

                self.model.nodes[str(rel_path)] = node
                if layer not in self.model.layers:
                    self.model.layers[layer] = []
                self.model.layers[layer].append(str(rel_path))

                total_files += 1

        print(f"📊 Mapped {total_files} files to spherical coordinates")

    def _determine_category(self, path: str) -> str:
        """Determine category from file path"""
        path_parts = Path(path).parts

        if not path_parts:
            return 'root'

        # Check for exact directory matches
        for part in path_parts:
            if part in self.layer_mapping:
                return part

        # Check for partial matches
        if any(part.startswith(('api', 'graphql', 'federation')) for part in path_parts):
            return 'api'
        if any(part.startswith(('test', 'spec')) for part in path_parts):
            return 'testing'
        if any(part.endswith(('.md', '.txt', '.doc')) for part in path_parts):
            return 'docs'

        return 'other'

    def _calculate_angles(self, path: str) -> Tuple[float, int]:
        """Calculate angular coordinates from path hash"""
        # Use path string to generate deterministic angles
        path_hash = hash(path) % 1000

        # Theta: azimuthal angle (0-2π)
        theta = (path_hash / 1000) * 2 * math.pi

        # Phi: polar angle (0-π), biased toward equator for better visualization
        phi_hash = hash(path + "_phi") % 1000
        phi = (phi_hash / 1000) * math.pi * 0.8 + math.pi * 0.1  # 0.1π to 0.9π

        return theta, phi

    def _analyze_dependencies(self):
        """Analyze file dependencies"""
        print("🔗 Analyzing dependencies...")

        # Simple dependency analysis based on imports
        for path, node in self.model.nodes.items():
            file_path = self.project_root / path

            try:
                if file_path.suffix in ['.py', '.js', '.ts', '.java', '.go', '.rs']:
                    deps = self._extract_dependencies(file_path)
                    node.dependencies.update(deps)

                    # Update reverse dependencies
                    for dep in deps:
                        if dep in self.model.nodes:
                            self.model.nodes[dep].dependents.add(path)

            except Exception as e:
                print(f"Warning: Could not analyze {path}: {e}")

    def _extract_dependencies(self, file_path: Path) -> Set[str]:
        """Extract dependencies from source file"""
        deps = set()

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

                # Python imports
                if file_path.suffix == '.py':
                    import_lines = [line for line in content.split('\n')
                                  if line.strip().startswith(('import ', 'from '))]
                    for line in import_lines:
                        # Simple extraction - could be enhanced
                        if 'from ' in line:
                            parts = line.split('from ')[1].split(' import ')[0]
                            deps.add(parts.split('.')[0])

                # JavaScript/TypeScript imports
                elif file_path.suffix in ['.js', '.ts', '.jsx', '.tsx']:
                    import_lines = [line for line in content.split('\n')
                                  if 'import ' in line or 'require(' in line]
                    for line in import_lines:
                        if 'from ' in line:
                            path_part = line.split('from ')[1].strip('\'";')
                            if path_part.startswith('./') or path_part.startswith('../'):
                                # Relative import - resolve path
                                resolved = (file_path.parent / path_part).resolve()
                                rel_resolved = resolved.relative_to(self.project_root)
                                deps.add(str(rel_resolved))

        except Exception:
            pass

        return deps

    def _calculate_complexity(self):
        """Calculate complexity metrics for each node"""
        for path, node in self.model.nodes.items():
            file_path = self.project_root / path

            try:
                # File size as basic complexity metric
                if file_path.exists():
                    size = file_path.stat().st_size
                    node.complexity = math.log(size + 1) if size > 0 else 0

                    # Add dependency count to complexity
                    node.complexity += len(node.dependencies) * 0.1
                    node.complexity += len(node.dependents) * 0.05

            except Exception:
                node.complexity = 0.0

    def _identify_edge_conditions(self):
        """Identify edge conditions and boundary violations"""
        print("🎯 Identifying edge conditions...")

        # Find nodes with high dependency counts (potential edge conditions)
        for path, node in self.model.nodes.items():
            total_deps = len(node.dependencies) + len(node.dependents)

            if total_deps > 10:  # Threshold for edge condition
                condition_type = "high_connectivity"
                if condition_type not in self.model.edge_conditions:
                    self.model.edge_conditions[condition_type] = []
                self.model.edge_conditions[condition_type].append(path)

        # Identify surface nodes (API interfaces)
        for path, node in self.model.nodes.items():
            if node.category in self.surface_categories:
                self.model.surface_nodes.append(path)

        print(f"🎯 Found {len(self.model.edge_conditions)} edge condition types")
        print(f"🌐 Identified {len(self.model.surface_nodes)} surface nodes")

    def _generate_visualizations(self):
        """Generate 3D spherical visualizations"""
        print("📊 Generating spherical visualizations...")

        # Create output directory
        output_dir = self.project_root / 'data' / 'fea_results'
        output_dir.mkdir(parents=True, exist_ok=True)

        # Prepare data for plotting
        positions = {}
        colors = []
        sizes = []

        for path, node in self.model.nodes.items():
            pos = self.model.to_cartesian(node)
            positions[path] = pos

            # Color by layer
            layer_colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
            colors.append(layer_colors[min(node.layer, len(layer_colors)-1)])

            # Size by complexity
            sizes.append(max(10, min(100, node.complexity * 20)))

        # Create 3D plot
        fig = plt.figure(figsize=(12, 12))
        ax = fig.add_subplot(111, projection='3d')

        # Plot nodes
        x_coords = [pos[0] for pos in positions.values()]
        y_coords = [pos[1] for pos in positions.values()]
        z_coords = [pos[2] for pos in positions.values()]

        scatter = ax.scatter(x_coords, y_coords, z_coords, c=colors, s=sizes, alpha=0.7)

        # Add layer labels
        for layer, paths in self.model.layers.items():
            if paths:
                layer_positions = [positions[path] for path in paths if path in positions]
                if layer_positions:
                    avg_pos = np.mean(layer_positions, axis=0)
                    ax.text(avg_pos[0], avg_pos[1], avg_pos[2],
                           f'Layer {layer}', fontsize=10, ha='center')

        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('Codebase Spherical Model\nCenter: Architecture | Surface: APIs | Edges: Integrations')

        # Save plot
        plt.tight_layout()
        plt.savefig(output_dir / 'spherical_model_3d.png', dpi=300, bbox_inches='tight')
        plt.close()

        # Generate analysis report
        self._generate_report(output_dir)

        print(f"📊 Visualizations saved to {output_dir}")

    def _generate_report(self, output_dir: Path):
        """Generate analysis report"""
        report = {
            'spherical_analysis': {
                'total_nodes': len(self.model.nodes),
                'layers': {layer: len(paths) for layer, paths in self.model.layers.items()},
                'surface_nodes': len(self.model.surface_nodes),
                'edge_conditions': {cond: len(paths) for cond, paths in self.model.edge_conditions.items()},
                'layer_mapping': self.layer_mapping
            },
            'complexity_analysis': {
                'avg_complexity': np.mean([node.complexity for node in self.model.nodes.values()]),
                'max_complexity': max([node.complexity for node in self.model.nodes.values()]),
                'min_complexity': min([node.complexity for node in self.model.nodes.values()])
            },
            'recommendations': [
                f"Layer {layer} has {len(paths)} nodes - consider modularization" if len(paths) > 100 else None
                for layer, paths in self.model.layers.items()
            ]
        }

        # Filter out None recommendations
        report['recommendations'] = [r for r in report['recommendations'] if r]

        with open(output_dir / 'spherical_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description='FEA Spherical Codebase Analysis')
    parser.add_argument('--project-root', type=str, default='.',
                       help='Project root directory')
    parser.add_argument('--incremental', action='store_true',
                       help='Run incremental analysis')

    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()

    analyzer = FEASphericalAnalyzer(project_root)
    model = analyzer.analyze_codebase()

    print(f"\n🎉 Spherical FEA Analysis Complete!")
    print(f"📊 Model contains {len(model.nodes)} nodes across {len(model.layers)} layers")
    print(f"🌐 Surface nodes: {len(model.surface_nodes)}")
    print(f"🎯 Edge conditions: {sum(len(paths) for paths in model.edge_conditions.values())}")

if __name__ == '__main__':
    main()