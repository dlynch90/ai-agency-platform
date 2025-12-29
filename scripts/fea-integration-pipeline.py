#!/usr/bin/env python3
"""
Finite Element Analysis Integration Pipeline
Combines spherical, Markov chain, and binomial distribution analyses per ADR-003
"""

import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FEAIntegrationPipeline:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()
        self.reports_dir = self.workspace_path / "docs" / "reports"
        self.analysis_results = {}

    def load_analysis_results(self) -> Dict[str, Any]:
        """Load results from all three FEA analyses"""
        analyses = {}

        # Load spherical architecture analysis
        spherical_path = self.reports_dir / "spherical-fea-analysis.json"
        if spherical_path.exists():
            with open(spherical_path, 'r') as f:
                analyses["spherical"] = json.load(f)
            logger.info("Loaded spherical architecture analysis")
        else:
            logger.warning("Spherical FEA analysis not found")

        # Load Markov chain analysis
        markov_path = self.reports_dir / "markov-chain-analysis.json"
        if markov_path.exists():
            with open(markov_path, 'r') as f:
                analyses["markov"] = json.load(f)
            logger.info("Loaded Markov chain workflow analysis")
        else:
            logger.warning("Markov chain analysis not found")

        # Load binomial edge case analysis
        binomial_path = self.reports_dir / "binomial-edge-case-analysis.json"
        if binomial_path.exists():
            with open(binomial_path, 'r') as f:
                analyses["binomial"] = json.load(f)
            logger.info("Loaded binomial edge case analysis")
        else:
            logger.warning("Binomial edge case analysis not found")

        return analyses

    def calculate_integrated_health_score(self, analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate integrated system health score from all analyses"""
        scores = {}

        # Spherical architecture health
        if "spherical" in analyses:
            spherical_metrics = analyses["spherical"]["metrics"]
            scores["spherical"] = spherical_metrics["overall_health_score"]

        # Markov workflow efficiency
        if "markov" in analyses:
            markov_efficiency = analyses["markov"]["efficiency_metrics"]
            scores["markov"] = markov_efficiency["efficiency_score"]

        # Binomial system reliability
        if "binomial" in analyses:
            binomial_reliability = analyses["binomial"]["reliability_metrics"]
            scores["binomial"] = binomial_reliability["reliability_score"]

        # Calculate weighted integrated score
        weights = {"spherical": 0.4, "markov": 0.3, "binomial": 0.3}
        integrated_score = 0.0
        total_weight = 0.0

        for analysis_type, score in scores.items():
            weight = weights.get(analysis_type, 0)
            integrated_score += score * weight
            total_weight += weight

        integrated_score = integrated_score / total_weight if total_weight > 0 else 0

        # Determine overall health status
        if integrated_score >= 0.8:
            status = "excellent"
        elif integrated_score >= 0.6:
            status = "good"
        elif integrated_score >= 0.4:
            status = "fair"
        elif integrated_score >= 0.2:
            status = "poor"
        else:
            status = "critical"

        return {
            "integrated_score": integrated_score,
            "status": status,
            "component_scores": scores,
            "weights": weights
        }

    def identify_systemic_issues(self, analyses: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify systemic issues across all analyses"""
        systemic_issues = []

        # Cross-analysis bottleneck correlation
        bottlenecks = []
        if "markov" in analyses:
            bottlenecks.extend(analyses["markov"]["bottlenecks"])

        # Edge case and architecture correlation
        edge_cases = []
        if "binomial" in analyses:
            edge_cases.extend(analyses["binomial"]["edge_cases"])

        stress_points = []
        if "spherical" in analyses:
            stress_points.extend(analyses["spherical"]["stress_points"])

        # Identify correlated issues
        for bottleneck in bottlenecks:
            # Check for related edge cases
            related_edges = [ec for ec in edge_cases
                           if ec["component"] in bottleneck.get("state", "").lower() or
                           ec["category"] in bottleneck.get("type", "").lower()]

            if related_edges:
                systemic_issues.append({
                    "type": "workflow_edge_correlation",
                    "severity": "high",
                    "description": f"Workflow bottleneck '{bottleneck['type']}' correlates with {len(related_edges)} edge cases",
                    "components": [bottleneck.get("state"), [ec["component"] for ec in related_edges]],
                    "recommendations": [
                        "Implement integrated monitoring across workflow and edge case components",
                        "Consider architectural changes to decouple bottlenecked components"
                    ]
                })

        # Architecture and reliability correlation
        for stress_point in stress_points:
            # Check for related reliability issues
            related_failures = [fm for fm in analyses.get("binomial", {}).get("failure_modes", [])
                              if fm["component"] in stress_point.get("type", "").lower()]

            if related_failures:
                systemic_issues.append({
                    "type": "architecture_reliability_correlation",
                    "severity": "critical",
                    "description": f"Architecture stress point '{stress_point['type']}' correlates with systematic failures",
                    "components": [stress_point.get("type"), [fm["component"] for fm in related_failures]],
                    "recommendations": [
                        "Perform comprehensive root cause analysis",
                        "Consider architectural redesign of affected components"
                    ]
                })

        # Efficiency and reliability correlation
        if "markov" in analyses and "binomial" in analyses:
            markov_efficiency = analyses["markov"]["efficiency_metrics"]["efficiency_score"]
            binomial_reliability = analyses["binomial"]["reliability_metrics"]["reliability_score"]

            if markov_efficiency < 0.6 and binomial_reliability < 0.7:
                systemic_issues.append({
                    "type": "efficiency_reliability_tradeoff",
                    "severity": "high",
                    "description": "Low workflow efficiency combined with poor system reliability indicates systemic issues",
                    "metrics": {
                        "workflow_efficiency": markov_efficiency,
                        "system_reliability": binomial_reliability
                    },
                    "recommendations": [
                        "Balance efficiency improvements with reliability enhancements",
                        "Implement comprehensive system monitoring and alerting",
                        "Consider phased approach to improvements"
                    ]
                })

        return systemic_issues

    def generate_optimization_priorities(self, analyses: Dict[str, Any],
                                       systemic_issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate prioritized optimization recommendations"""
        priorities = []

        # High-priority: Critical systemic issues
        critical_systemic = [issue for issue in systemic_issues if issue["severity"] == "critical"]
        for issue in critical_systemic:
            priorities.append({
                "priority": "critical",
                "type": "systemic_issue_resolution",
                "description": issue["description"],
                "effort": "high",
                "impact": "system_wide",
                "recommendations": issue["recommendations"]
            })

        # High-priority: Architecture health
        if "spherical" in analyses:
            health_score = analyses["spherical"]["metrics"]["overall_health_score"]
            if health_score < 0.5:
                priorities.append({
                    "priority": "high",
                    "type": "architecture_restructuring",
                    "description": f"Critical architecture health score: {health_score:.3f}",
                    "effort": "high",
                    "impact": "architectural",
                    "recommendations": analyses["spherical"]["recommendations"]
                })

        # Medium-priority: Workflow optimization
        if "markov" in analyses:
            efficiency_score = analyses["markov"]["efficiency_metrics"]["efficiency_score"]
            if efficiency_score < 0.7:
                priorities.append({
                    "priority": "medium",
                    "type": "workflow_optimization",
                    "description": f"Workflow efficiency needs improvement: {efficiency_score:.3f}",
                    "effort": "medium",
                    "impact": "operational",
                    "recommendations": analyses["markov"]["recommendations"]
                })

        # Medium-priority: Reliability improvements
        if "binomial" in analyses:
            reliability_score = analyses["binomial"]["reliability_metrics"]["reliability_score"]
            if reliability_score < 0.8:
                priorities.append({
                    "priority": "medium",
                    "type": "reliability_enhancement",
                    "description": f"System reliability needs improvement: {reliability_score:.3f}",
                    "effort": "medium",
                    "impact": "operational",
                    "recommendations": analyses["binomial"]["recommendations"]
                })

        # Low-priority: General improvements
        priorities.extend([
            {
                "priority": "low",
                "type": "monitoring_enhancement",
                "description": "Enhance monitoring and observability across all components",
                "effort": "medium",
                "impact": "monitoring",
                "recommendations": [
                    "Implement comprehensive logging and metrics collection",
                    "Add real-time dashboards and alerting",
                    "Establish monitoring best practices"
                ]
            },
            {
                "priority": "low",
                "type": "documentation_improvement",
                "description": "Improve documentation and knowledge sharing",
                "effort": "low",
                "impact": "documentation",
                "recommendations": [
                    "Document architectural decisions and trade-offs",
                    "Create runbooks for common operations",
                    "Establish knowledge sharing processes"
                ]
            }
        ])

        # Sort by priority (critical > high > medium > low)
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        priorities.sort(key=lambda x: priority_order[x["priority"]])

        return priorities

    def create_executive_summary(self, analyses: Dict[str, Any],
                               health_score: Dict[str, Any],
                               systemic_issues: List[Dict[str, Any]],
                               priorities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create executive summary of integrated analysis"""
        summary = {
            "analysis_timestamp": datetime.now().isoformat(),
            "overall_health_status": health_score["status"],
            "integrated_score": health_score["integrated_score"],
            "analyses_completed": list(analyses.keys()),
            "critical_findings": [],
            "immediate_actions": [],
            "long_term_strategy": []
        }

        # Critical findings
        if health_score["integrated_score"] < 0.4:
            summary["critical_findings"].append("System in critical condition requiring immediate intervention")

        if len(systemic_issues) > 0:
            summary["critical_findings"].append(f"{len(systemic_issues)} systemic issues identified requiring cross-component solutions")

        # Immediate actions
        critical_priorities = [p for p in priorities if p["priority"] == "critical"]
        summary["immediate_actions"] = [p["description"] for p in critical_priorities[:3]]

        # Long-term strategy
        summary["long_term_strategy"] = [
            "Implement continuous monitoring and automated optimization",
            "Establish architectural governance and compliance processes",
            "Build resilient systems with comprehensive error handling",
            "Create feedback loops for continuous improvement"
        ]

        return summary

    def run_integration_pipeline(self) -> Dict[str, Any]:
        """Run the complete FEA integration pipeline"""
        logger.info("Starting FEA integration pipeline...")

        # Load individual analysis results
        analyses = self.load_analysis_results()

        if not analyses:
            logger.error("No analysis results found. Run individual FEA analyses first.")
            return {}

        # Calculate integrated health score
        health_score = self.calculate_integrated_health_score(analyses)
        logger.info(f"Calculated integrated health score: {health_score['integrated_score']:.3f}")

        # Identify systemic issues
        systemic_issues = self.identify_systemic_issues(analyses)
        logger.info(f"Identified {len(systemic_issues)} systemic issues")

        # Generate optimization priorities
        priorities = self.generate_optimization_priorities(analyses, systemic_issues)
        logger.info(f"Generated {len(priorities)} optimization priorities")

        # Create executive summary
        executive_summary = self.create_executive_summary(
            analyses, health_score, systemic_issues, priorities
        )

        # Compile integrated results
        integrated_results = {
            "metadata": {
                "pipeline_type": "fea_integration_pipeline",
                "adr_reference": "ADR-003",
                "analysis_date": datetime.now().isoformat(),
                "version": "1.0"
            },
            "executive_summary": executive_summary,
            "integrated_health_score": health_score,
            "systemic_issues": systemic_issues,
            "optimization_priorities": priorities,
            "individual_analyses": {
                analysis_type: {
                    "completed": True,
                    "key_metrics": self._extract_key_metrics(analysis_data)
                }
                for analysis_type, analysis_data in analyses.items()
            }
        }

        self.analysis_results = integrated_results
        logger.info("FEA integration pipeline completed successfully")

        return integrated_results

    def _extract_key_metrics(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key metrics from individual analysis results"""
        key_metrics = {}

        if "metrics" in analysis_data:
            # Spherical architecture metrics
            if "overall_health_score" in analysis_data["metrics"]:
                key_metrics["health_score"] = analysis_data["metrics"]["overall_health_score"]
                key_metrics["center_density"] = analysis_data["metrics"].get("center_density")
                key_metrics["surface_complexity"] = analysis_data["metrics"].get("surface_complexity")
                key_metrics["edge_stability"] = analysis_data["metrics"].get("edge_stability")

        if "efficiency_metrics" in analysis_data:
            # Markov workflow metrics
            key_metrics["workflow_efficiency"] = analysis_data["efficiency_metrics"]["efficiency_score"]
            key_metrics["flow_efficiency"] = analysis_data["efficiency_metrics"]["flow_efficiency"]

        if "reliability_metrics" in analysis_data:
            # Binomial reliability metrics
            key_metrics["system_reliability"] = analysis_data["reliability_metrics"]["reliability_score"]
            key_metrics["failure_rate"] = analysis_data["reliability_metrics"]["failure_rate"]
            key_metrics["edge_case_density"] = analysis_data["reliability_metrics"]["edge_case_density"]

        return key_metrics

    def save_integrated_report(self, output_path: Path) -> None:
        """Save integrated analysis results to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Integrated FEA analysis saved to {output_path}")

def main():
    workspace_path = "/Users/daniellynch/Developer"

    pipeline = FEAIntegrationPipeline(workspace_path)
    integrated_results = pipeline.run_integration_pipeline()

    if not integrated_results:
        print("ERROR: No analysis results available. Run individual FEA analyses first.")
        return

    output_path = Path(workspace_path) / "docs" / "reports" / "integrated-fea-analysis.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pipeline.save_integrated_report(output_path)

    # Print executive summary
    summary = integrated_results["executive_summary"]
    health = integrated_results["integrated_health_score"]

    print("\n=== INTEGRATED FEA ANALYSIS PIPELINE ===")
    print(f"Overall Health Status: {summary['overall_health_status'].upper()}")
    print(".3f")

    print(f"\nAnalyses Completed: {', '.join(summary['analyses_completed'])}")

    if summary["critical_findings"]:
        print(f"\nCritical Findings ({len(summary['critical_findings'])}):")
        for finding in summary["critical_findings"]:
            print(f"  • {finding}")

    if summary["immediate_actions"]:
        print(f"\nImmediate Actions Required ({len(summary['immediate_actions'])}):")
        for action in summary["immediate_actions"]:
            print(f"  • {action}")

    systemic_issues = integrated_results["systemic_issues"]
    if systemic_issues:
        print(f"\nSystemic Issues Identified: {len(systemic_issues)}")
        critical_systemic = len([si for si in systemic_issues if si["severity"] == "critical"])
        if critical_systemic > 0:
            print(f"  Critical systemic issues: {critical_systemic}")

    priorities = integrated_results["optimization_priorities"]
    if priorities:
        print(f"\nOptimization Priorities: {len(priorities)}")
        by_priority = {}
        for p in priorities:
            by_priority[p["priority"]] = by_priority.get(p["priority"], 0) + 1

        for priority, count in by_priority.items():
            print(f"  {priority.capitalize()}: {count}")

    print(f"\nIntegrated report saved to: {output_path}")

if __name__ == "__main__":
    main()