#!/usr/bin/env python3
"""
Finite Element Analysis - Spherical Architecture Model
Implements ADR-002 spherical coordinate system for codebase architecture analysis
"""

import json
import math
import os
from pathlib import Path
from typing import Dict, List, Tuple, Any
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SphericalArchitectureAnalyzer:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()

        # Spherical coordinate boundaries per ADR-002
        self.center_radius = 0.3      # Core runtimes
        self.surface_inner = 0.3      # Specialized tooling start
        self.surface_outer = 0.7      # Specialized tooling end
        self.edge_radius = 0.7        # Boundary validations start

        # Component categories with their spherical coordinates
        self.component_mapping = {
            # Center (r < 0.3): Core Runtimes
            "python": (0.1, 0, 0),      # Core Python runtime
            "nodejs": (0.1, 60, 45),   # JavaScript runtime
            "rust": (0.1, 120, 45),    # Systems programming
            "go": (0.1, 180, 45),      # Cloud native
            "java": (0.15, 240, 60),   # Enterprise runtime

            # Surface (0.3 ≤ r ≤ 0.7): Specialized Tooling
            "torch": (0.4, 0, 30),         # ML frameworks
            "transformers": (0.4, 45, 30),
            "postgresql": (0.5, 90, 60),   # Databases
            "neo4j": (0.5, 135, 60),
            "redis": (0.5, 180, 60),
            "kubernetes": (0.6, 225, 90), # Infrastructure
            "docker": (0.6, 270, 90),
            "terraform": (0.6, 315, 90),

            # Edge (r > 0.7): Boundary Validations
            "security": (0.8, 0, 120),     # Security boundary
            "monitoring": (0.8, 90, 120),  # Observability
            "compliance": (0.8, 180, 120), # Compliance checks
            "authentication": (0.8, 270, 120) # Auth boundaries
        }

        self.analysis_results = {}

    def cartesian_to_spherical(self, x: float, y: float, z: float) -> Tuple[float, float, float]:
        """Convert Cartesian coordinates to spherical coordinates"""
        r = math.sqrt(x**2 + y**2 + z**2)
        theta = math.atan2(y, x)  # Azimuthal angle (0-2π)
        phi = math.acos(z / r) if r > 0 else 0  # Polar angle (0-π)

        # Convert to degrees
        theta_deg = math.degrees(theta) % 360
        phi_deg = math.degrees(phi)

        return r, theta_deg, phi_deg

    def spherical_to_cartesian(self, r: float, theta_deg: float, phi_deg: float) -> Tuple[float, float, float]:
        """Convert spherical coordinates to Cartesian"""
        theta_rad = math.radians(theta_deg)
        phi_rad = math.radians(phi_deg)

        x = r * math.sin(phi_rad) * math.cos(theta_rad)
        y = r * math.sin(phi_rad) * math.sin(theta_rad)
        z = r * math.cos(phi_rad)

        return x, y, z

    def classify_region(self, r: float) -> str:
        """Classify a component based on its radius (region)"""
        if r < self.center_radius:
            return "center"
        elif self.surface_inner <= r <= self.surface_outer:
            return "surface"
        else:
            return "edge"

    def calculate_center_density(self, components: Dict[str, Any]) -> float:
        """Calculate center density - concentration of core functionality"""
        center_components = [c for c in components.values() if c.get("region") == "center"]
        total_components = len(components)

        if total_components == 0:
            return 0.0

        # Weight center components by their functional importance
        weighted_density = 0.0
        for comp in center_components:
            # Core runtimes get higher weight
            if comp["name"] in ["python", "nodejs", "rust", "go", "java"]:
                weighted_density += 1.0
            else:
                weighted_density += 0.5

        return min(weighted_density / total_components, 1.0)

    def calculate_surface_complexity(self, components: Dict[str, Any]) -> float:
        """Calculate surface complexity - tooling layer complexity"""
        surface_components = [c for c in components.values() if c.get("region") == "surface"]
        total_components = len(components)

        if total_components == 0:
            return 0.0

        # Surface complexity increases with number of specialized tools
        base_complexity = len(surface_components) / total_components

        # Additional complexity from tool interactions
        interaction_complexity = 0.0
        tool_categories = set()
        for comp in surface_components:
            category = self._get_tool_category(comp["name"])
            tool_categories.add(category)

        # More tool categories = higher complexity
        interaction_complexity = len(tool_categories) * 0.1

        return min(base_complexity + interaction_complexity, 1.0)

    def calculate_edge_stability(self, components: Dict[str, Any]) -> float:
        """Calculate edge stability - boundary condition robustness"""
        edge_components = [c for c in components.values() if c.get("region") == "edge"]

        if not edge_components:
            return 0.0

        # Edge stability based on presence of critical boundary components
        stability_score = 0.0
        required_boundaries = ["security", "authentication", "monitoring", "compliance"]
        present_boundaries = [c["name"] for c in edge_components]

        for boundary in required_boundaries:
            if boundary in present_boundaries:
                stability_score += 0.25

        # Additional stability from redundancy
        if len(edge_components) > len(required_boundaries):
            stability_score += 0.1

        return min(stability_score, 1.0)

    def _get_tool_category(self, component_name: str) -> str:
        """Get the category of a tool component"""
        categories = {
            "ml": ["torch", "transformers", "accelerate", "huggingface"],
            "database": ["postgresql", "neo4j", "redis", "qdrant"],
            "infrastructure": ["kubernetes", "docker", "terraform", "aws"],
            "development": ["git", "github", "vscode", "cursor"],
            "monitoring": ["prometheus", "grafana", "datadog"]
        }

        for category, tools in categories.items():
            if any(tool in component_name.lower() for tool in tools):
                return category

        return "other"

    def analyze_component_distribution(self, components: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the distribution of components across spherical regions"""
        regions = {"center": [], "surface": [], "edge": []}

        for comp_name, comp_data in components.items():
            region = comp_data.get("region", "unknown")
            if region in regions:
                regions[region].append(comp_data)

        # Calculate distribution metrics
        total = len(components)
        distribution = {}
        for region, comps in regions.items():
            count = len(comps)
            percentage = (count / total * 100) if total > 0 else 0
            distribution[region] = {
                "count": count,
                "percentage": percentage,
                "components": [c["name"] for c in comps]
            }

        return distribution

    def detect_architectural_stress_points(self, components: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect architectural stress points and failure modes"""
        stress_points = []

        # Check for missing center components
        center_components = [c for c in components.values() if c.get("region") == "center"]
        if len(center_components) < 3:
            stress_points.append({
                "type": "center_weakness",
                "severity": "critical",
                "description": "Insufficient core runtime components",
                "recommendation": "Add primary runtime environments (Python, Node.js, Rust, Go)"
            })

        # Check for surface complexity overload
        surface_complexity = self.calculate_surface_complexity(components)
        if surface_complexity > 0.8:
            stress_points.append({
                "type": "surface_overload",
                "severity": "high",
                "description": "Excessive tooling complexity may cause maintenance issues",
                "recommendation": "Consolidate or prioritize essential tooling"
            })

        # Check for edge boundary gaps
        edge_stability = self.calculate_edge_stability(components)
        if edge_stability < 0.5:
            stress_points.append({
                "type": "edge_weakness",
                "severity": "high",
                "description": "Weak boundary validations increase security/compliance risk",
                "recommendation": "Implement security, monitoring, and compliance boundaries"
            })

        # Check for regional imbalances
        distribution = self.analyze_component_distribution(components)
        center_pct = distribution["center"]["percentage"]
        surface_pct = distribution["surface"]["percentage"]
        edge_pct = distribution["edge"]["percentage"]

        if center_pct < 20:
            stress_points.append({
                "type": "center_imbalance",
                "severity": "medium",
                "description": "Center region under-represented",
                "recommendation": "Strengthen core runtime foundation"
            })

        if surface_pct > 60:
            stress_points.append({
                "type": "surface_imbalance",
                "severity": "medium",
                "description": "Surface region over-represented",
                "recommendation": "Reduce tooling complexity or improve organization"
            })

        return stress_points

    def generate_spherical_coordinates(self) -> Dict[str, Any]:
        """Generate spherical coordinates for all known components"""
        components = {}

        for comp_name, (r, theta, phi) in self.component_mapping.items():
            x, y, z = self.spherical_to_cartesian(r, theta, phi)
            region = self.classify_region(r)

            components[comp_name] = {
                "name": comp_name,
                "spherical": {"r": r, "theta": theta, "phi": phi},
                "cartesian": {"x": x, "y": y, "z": z},
                "region": region,
                "category": self._get_tool_category(comp_name)
            }

        return components

    def analyze_architecture(self) -> Dict[str, Any]:
        """Perform complete spherical architecture analysis"""
        logger.info("Starting spherical architecture analysis...")

        # Generate component coordinates
        components = self.generate_spherical_coordinates()

        # Calculate architectural metrics
        center_density = self.calculate_center_density(components)
        surface_complexity = self.calculate_surface_complexity(components)
        edge_stability = self.calculate_edge_stability(components)

        # Analyze component distribution
        distribution = self.analyze_component_distribution(components)

        # Detect stress points
        stress_points = self.detect_architectural_stress_points(components)

        # Calculate overall architectural health score
        health_score = (center_density * 0.4 + (1 - surface_complexity) * 0.3 + edge_stability * 0.3)

        analysis_results = {
            "metadata": {
                "analysis_type": "spherical_architecture_fea",
                "adr_reference": "ADR-002",
                "analysis_date": "2025-12-28",
                "model_version": "1.0"
            },
            "metrics": {
                "center_density": center_density,
                "surface_complexity": surface_complexity,
                "edge_stability": edge_stability,
                "overall_health_score": health_score
            },
            "distribution": distribution,
            "components": components,
            "stress_points": stress_points,
            "recommendations": self._generate_recommendations(
                center_density, surface_complexity, edge_stability, stress_points
            )
        }

        self.analysis_results = analysis_results
        logger.info(".3f")

        return analysis_results

    def _generate_recommendations(self, center_density: float, surface_complexity: float,
                                edge_stability: float, stress_points: List[Dict]) -> List[str]:
        """Generate architectural improvement recommendations"""
        recommendations = []

        if center_density < 0.6:
            recommendations.append("Strengthen core runtime foundation - ensure all primary runtimes (Python, Node.js, Rust, Go) are properly configured")

        if surface_complexity > 0.7:
            recommendations.append("Reduce surface complexity - consolidate redundant tooling and prioritize essential components")

        if edge_stability < 0.6:
            recommendations.append("Enhance boundary validations - implement comprehensive security, monitoring, and compliance frameworks")

        for stress_point in stress_points:
            recommendations.append(f"{stress_point['type'].replace('_', ' ').title()}: {stress_point['recommendation']}")

        if not recommendations:
            recommendations.append("Architecture appears well-balanced - maintain current spherical distribution")

        return recommendations

    def save_analysis_report(self, output_path: Path) -> None:
        """Save analysis results to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)

        logger.info(f"Spherical FEA analysis saved to {output_path}")

def main():
    workspace_path = "/Users/daniellynch/Developer"

    analyzer = SphericalArchitectureAnalyzer(workspace_path)
    analysis_results = analyzer.analyze_architecture()

    output_path = Path(workspace_path) / "docs" / "reports" / "spherical-fea-analysis.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    analyzer.save_analysis_report(output_path)

    # Print summary
    metrics = analysis_results["metrics"]
    print("\n=== SPHERICAL ARCHITECTURE FEA ANALYSIS ===")
    print(".3f")
    print(".3f")
    print(".3f")
    print(".3f")

    print("\nComponent Distribution:")
    for region, data in analysis_results["distribution"].items():
        print(".1f")

    if analysis_results["stress_points"]:
        print("\nCritical Stress Points:")
        for stress in analysis_results["stress_points"]:
            print(f"  ⚠️  {stress['severity'].upper()}: {stress['description']}")

    print(f"\nReport saved to: {output_path}")

if __name__ == "__main__":
    main()