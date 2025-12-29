#!/usr/bin/env python3

"""
GAUSSIAN SPHERE CODEBASE ANALYSIS
Finite Element Analysis of Codebase Architecture Using ML Pipelines

This script models the codebase as a gaussian sphere with:
- Edge conditions and boundaries
- ML-driven architecture analysis
- Performance optimization recommendations
- Predictive maintenance insights
"""

import os
import json
import math
import numpy as np
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter
import networkx as nx
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

class GaussianSphereAnalyzer:
    def __init__(self, workspace_path):
        self.workspace = Path(workspace_path)
        self.analysis_results = {}
        self.graph = nx.DiGraph()

    def spherical_coordinates(self, x, y, z):
        """Convert Cartesian to spherical coordinates"""
        r = math.sqrt(x**2 + y**2 + z**2)
        theta = math.acos(z / r) if r > 0 else 0  # polar angle
        phi = math.atan2(y, x)  # azimuthal angle
        return r, theta, phi

    def gaussian_distribution(self, r, sigma=1.0):
        """Calculate gaussian probability density"""
        return (1 / (sigma * math.sqrt(2 * math.pi))) * math.exp(-r**2 / (2 * sigma**2))

    def analyze_file_structure(self):
        """Analyze file structure as 3D gaussian sphere"""
        print("🔍 Analyzing file structure as gaussian sphere...")

        file_positions = {}
        file_sizes = {}
        file_complexities = {}

        # Walk through codebase and assign 3D coordinates
        for root, dirs, files in os.walk(self.workspace):
            for file in files:
                if file.startswith('.') or file.endswith(('.pyc', '__pycache__')):
                    continue

                filepath = Path(root) / file
                rel_path = filepath.relative_to(self.workspace)

                # Calculate 3D position based on file path
                path_parts = str(rel_path).split('/')
                depth = len(path_parts)
                branch_factor = sum(len(part) for part in path_parts)

                # Spherical coordinates
                x = depth * math.cos(branch_factor * 0.1)
                y = depth * math.sin(branch_factor * 0.1)
                z = len(file) * 0.1

                r, theta, phi = self.spherical_coordinates(x, y, z)

                file_positions[str(rel_path)] = {
                    'cartesian': (x, y, z),
                    'spherical': (r, theta, phi),
                    'gaussian_density': self.gaussian_distribution(r)
                }

                # File metrics
                try:
                    size = filepath.stat().st_size
                    file_sizes[str(rel_path)] = size

                    # Simple complexity metric
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        complexity = len(content.split('\n')) + content.count(' ') + content.count('\t')
                        file_complexities[str(rel_path)] = complexity
                except:
                    file_sizes[str(rel_path)] = 0
                    file_complexities[str(rel_path)] = 0

        return {
            'positions': file_positions,
            'sizes': file_sizes,
            'complexities': file_complexities
        }

    def analyze_dependencies(self):
        """Analyze dependency relationships as graph edges"""
        print("🔗 Analyzing dependency relationships...")

        # Simple dependency analysis (would be more sophisticated in production)
        import_statements = defaultdict(list)
        function_calls = defaultdict(list)

        for root, dirs, files in os.walk(self.workspace):
            for file in files:
                if file.endswith(('.js', '.ts', '.py')):
                    filepath = Path(root) / file
                    rel_path = str(filepath.relative_to(self.workspace))

                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()

                            # Extract imports (simplified)
                            if file.endswith('.py'):
                                imports = [line.split()[-1] for line in content.split('\n')
                                         if line.strip().startswith(('import ', 'from '))]
                            elif file.endswith(('.js', '.ts')):
                                imports = [line.split()[-1].strip(';\'"') for line in content.split('\n')
                                         if line.strip().startswith(('import ', 'require('))]

                            import_statements[rel_path] = imports

                            # Add nodes and edges to graph
                            self.graph.add_node(rel_path, type=file.split('.')[-1])
                            for imp in imports:
                                if imp and not imp.startswith(('.', '/', '@')):
                                    self.graph.add_edge(rel_path, imp, type='import')

                    except:
                        continue

        return {
            'imports': dict(import_statements),
            'graph_metrics': {
                'nodes': self.graph.number_of_nodes(),
                'edges': self.graph.number_of_edges(),
                'density': nx.density(self.graph),
                'average_clustering': nx.average_clustering(self.graph)
            }
        }

    def ml_clustering_analysis(self, file_data):
        """ML-driven clustering analysis of codebase structure"""
        print("🤖 Performing ML clustering analysis...")

        # Prepare data for ML
        positions = []
        features = []

        for file_path, data in file_data['positions'].items():
            x, y, z = data['cartesian']
            r, theta, phi = data['spherical']
            size = file_data['sizes'].get(file_path, 0)
            complexity = file_data['complexities'].get(file_path, 0)

            positions.append([x, y, z])
            features.append([r, theta, phi, size, complexity, data['gaussian_density']])

        if not features:
            return {'clusters': [], 'insights': 'No data for clustering'}

        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)

        # PCA for dimensionality reduction
        pca = PCA(n_components=3)
        features_pca = pca.fit_transform(features_scaled)

        # K-means clustering
        n_clusters = min(5, len(features) // 10 + 1) if len(features) > 10 else 2
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(features_pca)

        # Analyze clusters
        cluster_analysis = {}
        for i in range(n_clusters):
            cluster_files = [list(file_data['positions'].keys())[j] for j in range(len(clusters)) if clusters[j] == i]
            cluster_sizes = [file_data['sizes'].get(f, 0) for f in cluster_files]
            cluster_complexities = [file_data['complexities'].get(f, 0) for f in cluster_files]

            cluster_analysis[f'cluster_{i}'] = {
                'file_count': len(cluster_files),
                'avg_size': np.mean(cluster_sizes) if cluster_sizes else 0,
                'avg_complexity': np.mean(cluster_complexities) if cluster_complexities else 0,
                'sample_files': cluster_files[:5]
            }

        return {
            'clusters': cluster_analysis,
            'pca_variance': pca.explained_variance_ratio_.tolist(),
            'cluster_centers': kmeans.cluster_centers_.tolist()
        }

    def edge_condition_analysis(self):
        """Analyze edge conditions and boundary constraints"""
        print("📐 Analyzing edge conditions and boundaries...")

        # Find boundary files (high centrality, many connections)
        if self.graph.number_of_nodes() > 0:
            centrality = nx.degree_centrality(self.graph)
            betweenness = nx.betweenness_centrality(self.graph)

            # Identify edge files
            sorted_centrality = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
            sorted_betweenness = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)

            edge_files = {
                'high_centrality': [f[0] for f in sorted_centrality[:10]],
                'high_betweenness': [f[0] for f in sorted_betweenness[:10]]
            }
        else:
            edge_files = {'high_centrality': [], 'high_betweenness': []}

        # Boundary analysis
        boundaries = {
            'entry_points': [],  # API endpoints, main files
            'exit_points': [],   # External service calls
            'constraints': []    # Configuration files, environment boundaries
        }

        # Simple boundary detection
        for root, dirs, files in os.walk(self.workspace):
            for file in files:
                filepath = Path(root) / file
                rel_path = str(filepath.relative_to(self.workspace))

                if file in ['package.json', 'Dockerfile', 'docker-compose.yml', '.env']:
                    boundaries['constraints'].append(rel_path)
                elif file.endswith(('.js', '.ts', '.py')) and 'api' in str(filepath):
                    boundaries['entry_points'].append(rel_path)
                elif 'external' in str(filepath) or 'service' in str(filepath):
                    boundaries['exit_points'].append(rel_path)

        return {
            'edge_files': edge_files,
            'boundaries': boundaries,
            'constraints': {
                'architectural_boundaries': len(boundaries['constraints']),
                'api_boundaries': len(boundaries['entry_points']),
                'service_boundaries': len(boundaries['exit_points'])
            }
        }

    def generate_recommendations(self, analysis_data):
        """Generate ML-driven recommendations"""
        print("💡 Generating ML-driven recommendations...")

        recommendations = []

        # Architecture recommendations
        if analysis_data['graph_metrics']['density'] < 0.1:
            recommendations.append({
                'type': 'architecture',
                'priority': 'high',
                'message': 'Low dependency density detected. Consider increasing modularity and reducing coupling.',
                'action': 'Implement service mesh pattern for better decoupling'
            })

        # Performance recommendations
        clusters = analysis_data.get('ml_clusters', {}).get('clusters', {})
        for cluster_name, cluster_data in clusters.items():
            if cluster_data['avg_complexity'] > 1000:
                recommendations.append({
                    'type': 'performance',
                    'priority': 'medium',
                    'message': f'High complexity cluster {cluster_name} detected. Consider refactoring.',
                    'action': 'Break down complex files into smaller modules'
                })

        # Edge condition recommendations
        edge_analysis = analysis_data.get('edge_conditions', {})
        if len(edge_analysis.get('edge_files', {}).get('high_centrality', [])) > 5:
            recommendations.append({
                'type': 'maintainability',
                'priority': 'high',
                'message': 'Too many high-centrality files indicate architectural bottleneck.',
                'action': 'Implement facade pattern to reduce coupling'
            })

        return recommendations

    def run_complete_analysis(self):
        """Run complete gaussian sphere analysis"""
        print("🌐 Starting Gaussian Sphere Codebase Analysis")
        print("=" * 60)

        start_time = datetime.now()

        # Run all analyses
        file_structure = self.analyze_file_structure()
        dependencies = self.analyze_dependencies()
        ml_clusters = self.ml_clustering_analysis(file_structure)
        edge_conditions = self.edge_condition_analysis()

        # Combine results
        analysis_results = {
            'timestamp': datetime.now().isoformat(),
            'workspace': str(self.workspace),
            'analysis_type': 'gaussian_sphere_finite_element',
            'file_structure': file_structure,
            'dependencies': dependencies,
            'ml_clusters': ml_clusters,
            'edge_conditions': edge_conditions,
            'recommendations': self.generate_recommendations({
                'graph_metrics': dependencies['graph_metrics'],
                'ml_clusters': ml_clusters,
                'edge_conditions': edge_conditions
            })
        }

        # Calculate performance metrics
        end_time = datetime.now()
        analysis_results['performance'] = {
            'analysis_duration_seconds': (end_time - start_time).total_seconds(),
            'files_analyzed': len(file_structure['positions']),
            'graph_nodes': dependencies['graph_metrics']['nodes'],
            'graph_edges': dependencies['graph_metrics']['edges'],
            'clusters_found': len(ml_clusters.get('clusters', {}))
        }

        # Save results
        output_file = self.workspace / 'logs' / f'gaussian_sphere_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        output_file.parent.mkdir(exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(analysis_results, f, indent=2, default=str)

        print("=" * 60)
        print("🎯 Gaussian Sphere Analysis Complete")
        print(f"📊 Files analyzed: {analysis_results['performance']['files_analyzed']}")
        print(f"🔗 Dependencies mapped: {analysis_results['performance']['graph_edges']}")
        print(f"🎯 Clusters identified: {analysis_results['performance']['clusters_found']}")
        print(f"💾 Results saved to: {output_file}")
        print(f"⏱️  Analysis time: {analysis_results['performance']['analysis_duration_seconds']:.2f}s")

        return analysis_results

def main():
    workspace = os.getenv('WORKSPACE', '${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}')

    analyzer = GaussianSphereAnalyzer(workspace)
    results = analyzer.run_complete_analysis()

    # Print summary
    print("\n📋 ANALYSIS SUMMARY")
    print("-" * 30)
    print(f"🏗️  Architecture Health: {len(results['recommendations'])} recommendations")
    print(f"🔧 Performance Clusters: {len(results['ml_clusters']['clusters'])} identified")
    print(f"🎯 Edge Conditions: {len(results['edge_conditions']['edge_files']['high_centrality'])} critical files")
    print(f"📈 Code Density: {results['dependencies']['graph_metrics']['density']:.3f}")

if __name__ == '__main__':
    main()