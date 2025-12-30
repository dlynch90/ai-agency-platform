#!/usr/bin/env python3
"""
Binomial Distribution Analysis for Edge Case Detection
Implements ADR-003 finite element analysis with p<0.10 and N=5 trials
"""

import json
import math
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any
from scipy import stats
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BinomialEdgeCaseDetector:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()

        # Binomial parameters per ADR-003
        self.p_threshold = 0.10  # Probability threshold for rare events
        self.n_trials = 5        # Number of trials per experiment

        # Edge case categories to monitor
        self.edge_case_categories = {
            "security_failures": ["authentication_bypass", "unauthorized_access", "data_leak"],
            "performance_degradation": ["memory_leak", "cpu_spike", "slow_response"],
            "data_integrity": ["corruption", "inconsistency", "loss"],
            "system_failures": ["crash", "hang", "resource_exhaustion"],
            "integration_breaks": ["api_failure", "service_unavailable", "timeout"]
        }

        self.analysis_results = {}

    def _simulate_system_events(self) -> List[Dict[str, Any]]:
        """Simulate system events for binomial analysis"""
        # In production, this would analyze logs, metrics, error reports, etc.
        # For now, simulate realistic event patterns

        events = []

        # Generate simulated events with various probabilities
        event_types = [
            ("normal_operation", 0.802),
            ("authentication_bypass", 0.02),
            ("memory_leak", 0.03),
            ("data_corruption", 0.01),
            ("system_crash", 0.005),
            ("api_timeout", 0.04),
            ("unauthorized_access", 0.015),
            ("cpu_spike", 0.025),
            ("service_unavailable", 0.018),
            ("slow_response", 0.035)
        ]

        # Simulate 1000 events over time
        np.random.seed(42)  # For reproducible results
        for i in range(1000):
            # Sample from event distribution
            event_names, probabilities = zip(*event_types)
            event_name = np.random.choice(event_names, p=probabilities)

            events.append({
                "id": i,
                "timestamp": f"2025-12-28T{i%24:02d}:{i%60:02d}:00Z",
                "event_type": event_name,
                "severity": self._classify_severity(event_name),
                "component": self._get_component(event_name),
                "probability": dict(event_types)[event_name]
            })

        return events

    def _classify_severity(self, event_type: str) -> str:
        """Classify event severity"""
        critical_events = ["authentication_bypass", "data_corruption", "system_crash", "unauthorized_access"]
        high_events = ["memory_leak", "cpu_spike", "service_unavailable"]
        medium_events = ["api_timeout", "slow_response"]

        if event_type in critical_events:
            return "critical"
        elif event_type in high_events:
            return "high"
        elif event_type in medium_events:
            return "medium"
        else:
            return "low"

    def _get_component(self, event_type: str) -> str:
        """Map event type to system component"""
        component_mapping = {
            "authentication_bypass": "authentication",
            "unauthorized_access": "authorization",
            "data_leak": "security",
            "memory_leak": "memory_management",
            "cpu_spike": "cpu_scheduler",
            "slow_response": "api_gateway",
            "data_corruption": "data_layer",
            "system_crash": "system_core",
            "api_timeout": "network_layer",
            "service_unavailable": "service_mesh"
        }
        return component_mapping.get(event_type, "unknown")

    def _calculate_binomial_probability(self, successes: int, trials: int, p: float) -> float:
        """Calculate binomial probability using scipy"""
        return stats.binom.pmf(successes, trials, p)

    def _analyze_edge_cases(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze events for edge cases using binomial distribution"""
        edge_cases = []

        # Group events by type and analyze in sliding windows of N=5 trials
        event_counts = {}
        for event in events:
            event_type = event["event_type"]
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        # Analyze each event type for edge case patterns
        for event_type, total_count in event_counts.items():
            base_probability = next((e["probability"] for e in events if e["event_type"] == event_type), 0.01)

            # Check if this is already a rare event (p < threshold)
            if base_probability < self.p_threshold:
                # Analyze in windows of N trials
                windows = []
                window_size = self.n_trials

                # Create sliding windows
                for i in range(0, len(events) - window_size + 1, window_size):
                    window_events = events[i:i + window_size]
                    window_count = sum(1 for e in window_events if e["event_type"] == event_type)

                    if window_count > 0:  # Only analyze windows with occurrences
                        # Calculate binomial probability of observing this many events
                        binomial_prob = self._calculate_binomial_probability(
                            window_count, window_size, base_probability
                        )

                        # Check for statistically significant edge cases
                        if binomial_prob < 0.05:  # p-value threshold
                            windows.append({
                                "window_start": i,
                                "window_end": i + window_size - 1,
                                "occurrences": window_count,
                                "binomial_probability": binomial_prob,
                                "expected_occurrences": window_size * base_probability
                            })

                if windows:
                    # Calculate overall edge case risk
                    avg_occurrences = np.mean([w["occurrences"] for w in windows])
                    max_occurrences = max([w["occurrences"] for w in windows])
                    risk_score = min(1.0, (max_occurrences / window_size) * (1 / base_probability))

                    edge_cases.append({
                        "event_type": event_type,
                        "category": self._categorize_edge_case(event_type),
                        "base_probability": base_probability,
                        "total_occurrences": total_count,
                        "windows_analyzed": len(windows),
                        "avg_occurrences_per_window": avg_occurrences,
                        "max_occurrences_per_window": max_occurrences,
                        "risk_score": risk_score,
                        "severity": self._classify_severity(event_type),
                        "component": self._get_component(event_type),
                        "analysis_windows": windows,
                        "recommendations": self._generate_edge_case_recommendations(event_type, risk_score)
                    })

        # Sort by risk score descending
        edge_cases.sort(key=lambda x: x["risk_score"], reverse=True)
        return edge_cases

    def _categorize_edge_case(self, event_type: str) -> str:
        """Categorize edge case by type"""
        for category, events in self.edge_case_categories.items():
            if event_type in events or any(keyword in event_type for keyword in category.split('_')):
                return category
        return "other"

    def _generate_edge_case_recommendations(self, event_type: str, risk_score: float) -> List[str]:
        """Generate recommendations for addressing edge cases"""
        recommendations = []

        if risk_score > 0.8:
            recommendations.append("CRITICAL: Immediate investigation required - high-risk edge case detected")
        elif risk_score > 0.5:
            recommendations.append("HIGH PRIORITY: Implement monitoring and alerting for this edge case")

        # Event-specific recommendations
        if "authentication" in event_type or "access" in event_type:
            recommendations.extend([
                "Implement multi-factor authentication",
                "Add rate limiting to authentication endpoints",
                "Enable security monitoring and alerting"
            ])
        elif "memory" in event_type:
            recommendations.extend([
                "Implement memory leak detection",
                "Add memory usage monitoring",
                "Configure automatic restart on memory threshold"
            ])
        elif "timeout" in event_type:
            recommendations.extend([
                "Implement circuit breaker pattern",
                "Add timeout configuration",
                "Configure retry mechanisms with exponential backoff"
            ])
        elif "crash" in event_type:
            recommendations.extend([
                "Implement crash dump analysis",
                "Add health check endpoints",
                "Configure automatic recovery mechanisms"
            ])

        if not recommendations:
            recommendations.append("Implement general monitoring and alerting for this event type")

        return recommendations

    def _calculate_system_reliability_metrics(self, events: List[Dict[str, Any]],
                                           edge_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate overall system reliability metrics"""
        total_events = len(events)
        failure_events = [e for e in events if e["severity"] in ["critical", "high"]]

        # Mean Time Between Failures (MTBF) approximation
        failure_rate = len(failure_events) / total_events if total_events > 0 else 0

        # Reliability score (inverse of failure rate, normalized)
        reliability_score = max(0, 1 - failure_rate)

        # Edge case density
        edge_case_density = len(edge_cases) / len(set(e["event_type"] for e in events)) if events else 0

        # Risk distribution
        risk_levels = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for edge_case in edge_cases:
            risk_levels[edge_case["severity"]] += 1

        return {
            "total_events_analyzed": total_events,
            "failure_rate": failure_rate,
            "reliability_score": reliability_score,
            "edge_case_density": edge_case_density,
            "risk_distribution": risk_levels,
            "mtbf_estimate": 1 / failure_rate if failure_rate > 0 else float('inf'),
            "binomial_parameters": {
                "n_trials": self.n_trials,
                "p_threshold": self.p_threshold
            }
        }

    def _identify_failure_modes(self, edge_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify systematic failure modes from edge case patterns"""
        failure_modes = []

        # Group edge cases by component
        component_failures = {}
        for edge_case in edge_cases:
            component = edge_case["component"]
            if component not in component_failures:
                component_failures[component] = []
            component_failures[component].append(edge_case)

        # Identify components with multiple failure types
        for component, failures in component_failures.items():
            if len(failures) >= 2:
                avg_risk = np.mean([f["risk_score"] for f in failures])
                failure_modes.append({
                    "component": component,
                    "failure_types": len(failures),
                    "avg_risk_score": avg_risk,
                    "description": f"Multiple failure modes detected in {component}",
                    "severity": "critical" if avg_risk > 0.7 else "high",
                    "recommendations": [
                        f"Perform root cause analysis for {component}",
                        f"Implement comprehensive monitoring for {component}",
                        f"Consider component redesign or replacement"
                    ]
                })

        return failure_modes

    def analyze_edge_cases(self) -> Dict[str, Any]:
        """Perform complete binomial edge case analysis"""
        logger.info("Starting binomial distribution edge case analysis (p<0.10, N=5)...")

        # Simulate system events (in production: load from logs/metrics)
        events = self._simulate_system_events()

        # Analyze for edge cases using binomial distribution
        edge_cases = self._analyze_edge_cases(events)

        # Calculate system reliability metrics
        reliability_metrics = self._calculate_system_reliability_metrics(events, edge_cases)

        # Identify systematic failure modes
        failure_modes = self._identify_failure_modes(edge_cases)

        analysis_results = {
            "metadata": {
                "analysis_type": "binomial_edge_case_fea",
                "adr_reference": "ADR-003",
                "binomial_parameters": {
                    "n_trials": self.n_trials,
                    "p_threshold": self.p_threshold
                },
                "analysis_date": "2025-12-28",
                "events_analyzed": len(events)
            },
            "reliability_metrics": reliability_metrics,
            "edge_cases": edge_cases,
            "failure_modes": failure_modes,
            "event_summary": self._summarize_events(events),
            "recommendations": self._generate_system_recommendations(
                reliability_metrics, edge_cases, failure_modes
            )
        }

        self.analysis_results = analysis_results
        logger.info(f"Analysis complete. Detected {len(edge_cases)} edge cases with p<{self.p_threshold}")

        return analysis_results

    def _summarize_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize event data for reporting"""
        from collections import Counter

        event_types = Counter(e["event_type"] for e in events)
        severities = Counter(e["severity"] for e in events)
        components = Counter(e["component"] for e in events)

        return {
            "total_events": len(events),
            "unique_event_types": len(event_types),
            "event_type_distribution": dict(event_types.most_common()),
            "severity_distribution": dict(severities),
            "component_distribution": dict(components.most_common())
        }

    def _generate_system_recommendations(self, reliability_metrics: Dict[str, Any],
                                       edge_cases: List[Dict[str, Any]],
                                       failure_modes: List[Dict[str, Any]]) -> List[str]:
        """Generate system-level recommendations based on analysis"""
        recommendations = []

        # Reliability-based recommendations
        if reliability_metrics["reliability_score"] < 0.8:
            recommendations.append("CRITICAL: System reliability below acceptable threshold - immediate action required")

        if reliability_metrics["edge_case_density"] > 0.3:
            recommendations.append("HIGH: High edge case density detected - implement comprehensive error handling")

        # Edge case recommendations
        critical_edge_cases = [ec for ec in edge_cases if ec["severity"] == "critical"]
        if critical_edge_cases:
            recommendations.append(f"ADDRESS CRITICAL EDGE CASES: {len(critical_edge_cases)} critical edge cases require immediate attention")

        # Failure mode recommendations
        if failure_modes:
            recommendations.append(f"SYSTEMATIC FAILURE MODES: {len(failure_modes)} components show multiple failure patterns - perform root cause analysis")

        # General recommendations
        recommendations.extend([
            "Implement comprehensive monitoring and alerting system",
            "Add circuit breaker patterns for resilient service communication",
            "Establish incident response and post-mortem processes",
            "Implement chaos engineering practices for failure testing",
            "Add comprehensive logging and tracing capabilities"
        ])

        return recommendations

    def save_analysis_report(self, output_path: Path) -> None:
        """Save analysis results to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Binomial edge case analysis saved to {output_path}")

def main():
    workspace_path = "${HOME}/Developer"

    detector = BinomialEdgeCaseDetector(workspace_path)
    analysis_results = detector.analyze_edge_cases()

    output_path = Path(workspace_path) / "docs" / "reports" / "binomial-edge-case-analysis.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    detector.save_analysis_report(output_path)

    # Print summary
    print("\n=== BINOMIAL EDGE CASE ANALYSIS (p<0.10, N=5) ===")
    print(f"Events analyzed: {analysis_results['metadata']['events_analyzed']}")
    print(f"Edge cases detected: {len(analysis_results['edge_cases'])}")

    reliability = analysis_results['reliability_metrics']
    print(".3f")
    print(".3f")
    print(".3f")

    if analysis_results['edge_cases']:
        critical = len([ec for ec in analysis_results['edge_cases'] if ec['severity'] == 'critical'])
        print(f"Critical edge cases: {critical}")

    if analysis_results['failure_modes']:
        print(f"Systematic failure modes: {len(analysis_results['failure_modes'])}")

    print(f"\nReport saved to: {output_path}")

if __name__ == "__main__":
    main()