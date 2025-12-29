#!/usr/bin/env python3
"""
Markov Chain Analysis for Development Workflow Optimization
Implements ADR-003 finite element analysis with N=5 state transitions
"""

import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any
from collections import defaultdict, Counter
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MarkovChainWorkflowAnalyzer:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()

        # Development workflow states per ADR-003
        self.states = ["setup", "development", "testing", "deployment", "monitoring"]
        self.state_index = {state: i for i, state in enumerate(self.states)}

        # Order-5 Markov chain (considering 5 previous states)
        self.order = 5

        # Initialize transition matrices
        self.transition_matrix = np.zeros((len(self.states), len(self.states)))
        self.order_n_matrix = defaultdict(lambda: defaultdict(int))

        self.analysis_results = {}

    def _load_workflow_data(self) -> List[List[str]]:
        """Load or simulate workflow transition data"""
        # For now, simulate realistic development workflow patterns
        # In production, this would analyze git commits, CI/CD logs, etc.

        workflows = [
            # Typical development cycles
            ["setup", "development", "testing", "deployment", "monitoring", "development", "testing", "deployment"],
            ["setup", "development", "testing", "testing", "deployment", "monitoring"],
            ["setup", "development", "development", "testing", "deployment", "monitoring", "setup"],
            ["setup", "development", "testing", "deployment", "monitoring", "development"],
            ["setup", "development", "testing", "deployment", "monitoring", "setup", "development"],

            # Problematic patterns (bottlenecks)
            ["setup", "development", "development", "development", "testing", "deployment"],  # Stuck in development
            ["setup", "development", "testing", "testing", "testing", "deployment"],  # Testing bottleneck
            ["setup", "development", "testing", "deployment", "deployment", "monitoring"],  # Deployment issues

            # Efficient patterns
            ["setup", "development", "testing", "deployment", "monitoring"],
            ["setup", "development", "testing", "deployment", "monitoring", "setup", "development", "testing", "deployment", "monitoring"],
        ]

        return workflows

    def _build_transition_matrix(self, workflows: List[List[str]]) -> np.ndarray:
        """Build first-order Markov transition matrix"""
        transition_counts = np.zeros((len(self.states), len(self.states)))

        for workflow in workflows:
            for i in range(len(workflow) - 1):
                current_state = workflow[i]
                next_state = workflow[i + 1]

                if current_state in self.state_index and next_state in self.state_index:
                    current_idx = self.state_index[current_state]
                    next_idx = self.state_index[next_state]
                    transition_counts[current_idx, next_idx] += 1

        # Convert to probabilities
        row_sums = transition_counts.sum(axis=1)
        transition_matrix = np.zeros_like(transition_counts, dtype=float)

        for i in range(len(self.states)):
            if row_sums[i] > 0:
                transition_matrix[i] = transition_counts[i] / row_sums[i]

        return transition_matrix

    def _build_order_n_matrix(self, workflows: List[List[str]], order: int) -> Dict[str, Dict[str, int]]:
        """Build Nth-order Markov chain transition matrix"""
        order_n_transitions = defaultdict(lambda: defaultdict(int))

        for workflow in workflows:
            for i in range(len(workflow) - order):
                state_sequence = tuple(workflow[i:i+order])
                next_state = workflow[i+order]

                state_key = ",".join(state_sequence)
                order_n_transitions[state_key][next_state] += 1

        return dict(order_n_transitions)

    def _calculate_stationary_distribution(self, transition_matrix: np.ndarray) -> np.ndarray:
        """Calculate stationary distribution of the Markov chain"""
        n = len(self.states)

        # Solve (P - I)v = 0 with sum(v) = 1
        P_minus_I = transition_matrix - np.eye(n)
        P_minus_I[-1] = np.ones(n)  # Replace last row with constraint

        b = np.zeros(n)
        b[-1] = 1  # Sum constraint

        try:
            stationary_dist = np.linalg.solve(P_minus_I, b)
            return stationary_dist
        except np.linalg.LinAlgError:
            # Fallback to uniform distribution if singular
            return np.ones(n) / n

    def _identify_bottlenecks(self, transition_matrix: np.ndarray, stationary_dist: np.ndarray) -> List[Dict[str, Any]]:
        """Identify workflow bottlenecks using Markov chain analysis"""
        bottlenecks = []

        # High self-transition probabilities indicate bottlenecks
        for i, state in enumerate(self.states):
            self_prob = transition_matrix[i, i]
            if self_prob > 0.3:  # Threshold for bottleneck detection
                bottlenecks.append({
                    "state": state,
                    "type": "self_transition_bottleneck",
                    "severity": "high" if self_prob > 0.5 else "medium",
                    "probability": self_prob,
                    "description": f"High self-transition probability in {state} state",
                    "recommendation": f"Review {state} processes to reduce iteration cycles"
                })

        # Low transition probabilities to next states
        expected_flow = ["setup", "development", "testing", "deployment", "monitoring"]
        for i in range(len(expected_flow) - 1):
            current_state = expected_flow[i]
            next_state = expected_flow[i + 1]

            if current_state in self.state_index and next_state in self.state_index:
                current_idx = self.state_index[current_state]
                next_idx = self.state_index[next_state]
                transition_prob = transition_matrix[current_idx, next_idx]

                if transition_prob < 0.1:  # Low transition probability
                    bottlenecks.append({
                        "transition": f"{current_state} → {next_state}",
                        "type": "flow_bottleneck",
                        "severity": "medium",
                        "probability": transition_prob,
                        "description": f"Weak transition from {current_state} to {next_state}",
                        "recommendation": f"Improve handoff processes between {current_state} and {next_state}"
                    })

        # States with high stationary probability (time sinks)
        for i, state in enumerate(self.states):
            if stationary_dist[i] > 0.3:  # High stationary probability
                bottlenecks.append({
                    "state": state,
                    "type": "time_sink",
                    "severity": "medium",
                    "stationary_probability": stationary_dist[i],
                    "description": f"Excessive time spent in {state} state",
                    "recommendation": f"Optimize {state} processes to reduce time spent"
                })

        return bottlenecks

    def _predict_workflow_efficiency(self, transition_matrix: np.ndarray,
                                   stationary_dist: np.ndarray) -> Dict[str, Any]:
        """Predict workflow efficiency metrics"""
        # Calculate expected cycle time (simplified)
        # This is a basic approximation - real cycle time prediction would need more data
        avg_transitions_per_cycle = 5  # setup → dev → test → deploy → monitor
        bottleneck_penalty = sum(1 for b in self._identify_bottlenecks(transition_matrix, stationary_dist)
                               if b["severity"] == "high")

        efficiency_score = max(0, 1 - (bottleneck_penalty * 0.2))

        # Calculate flow efficiency (time in value-adding states vs total time)
        value_adding_states = ["development", "testing", "deployment"]
        value_adding_time = sum(stationary_dist[self.state_index[state]] for state in value_adding_states)
        total_time = sum(stationary_dist)

        flow_efficiency = value_adding_time / total_time if total_time > 0 else 0

        return {
            "efficiency_score": efficiency_score,
            "flow_efficiency": flow_efficiency,
            "value_adding_time_ratio": value_adding_time,
            "bottleneck_penalty": bottleneck_penalty,
            "predicted_cycle_time_days": avg_transitions_per_cycle / efficiency_score if efficiency_score > 0 else float('inf')
        }

    def _analyze_order_n_patterns(self, order_n_matrix: Dict[str, Dict[str, int]]) -> List[Dict[str, Any]]:
        """Analyze higher-order patterns for complex workflow insights"""
        patterns = []

        # Find common N-state sequences that lead to bottlenecks
        for state_sequence, transitions in order_n_matrix.items():
            total_transitions = sum(transitions.values())

            # Look for sequences that frequently lead to the same state (potential loops)
            for next_state, count in transitions.items():
                probability = count / total_transitions if total_transitions > 0 else 0

                if probability > 0.7 and next_state in state_sequence.split(','):
                    patterns.append({
                        "sequence": state_sequence,
                        "next_state": next_state,
                        "probability": probability,
                        "type": "potential_loop",
                        "description": f"High probability loop: {state_sequence} → {next_state}",
                        "recommendation": "Review process to break repetitive cycles"
                    })

        return patterns

    def analyze_workflow(self) -> Dict[str, Any]:
        """Perform complete Markov chain workflow analysis"""
        logger.info("Starting Markov chain workflow analysis (N=5)...")

        # Load workflow data
        workflows = self._load_workflow_data()

        # Build transition matrices
        transition_matrix = self._build_transition_matrix(workflows)
        order_n_matrix = self._build_order_n_matrix(workflows, self.order)

        # Calculate stationary distribution
        stationary_dist = self._calculate_stationary_distribution(transition_matrix)

        # Identify bottlenecks
        bottlenecks = self._identify_bottlenecks(transition_matrix, stationary_dist)

        # Predict workflow efficiency
        efficiency_metrics = self._predict_workflow_efficiency(transition_matrix, stationary_dist)

        # Analyze higher-order patterns
        patterns = self._analyze_order_n_patterns(order_n_matrix)

        analysis_results = {
            "metadata": {
                "analysis_type": "markov_chain_workflow_fea",
                "adr_reference": "ADR-003",
                "markov_order": self.order,
                "states": self.states,
                "analysis_date": "2025-12-28",
                "workflow_samples": len(workflows)
            },
            "transition_matrix": {
                "matrix": transition_matrix.tolist(),
                "states": self.states,
                "readable": self._format_transition_matrix(transition_matrix)
            },
            "stationary_distribution": {
                "distribution": stationary_dist.tolist(),
                "by_state": {state: prob for state, prob in zip(self.states, stationary_dist)}
            },
            "bottlenecks": bottlenecks,
            "efficiency_metrics": efficiency_metrics,
            "higher_order_patterns": patterns,
            "recommendations": self._generate_workflow_recommendations(
                bottlenecks, efficiency_metrics, patterns
            )
        }

        self.analysis_results = analysis_results
        logger.info(".3f")

        return analysis_results

    def _format_transition_matrix(self, matrix: np.ndarray) -> str:
        """Format transition matrix as readable string"""
        lines = ["Transition Matrix (rows=from, columns=to):"]
        header = "     " + "  ".join(f"{s[:3]:>3}" for s in self.states)
        lines.append(header)
        lines.append("     " + "---" * len(self.states))

        for i, from_state in enumerate(self.states):
            row = f"{from_state[:5]:>5}"
            for j in range(len(self.states)):
                prob = matrix[i, j]
                row += f"{prob:>5.2f}"
            lines.append(row)

        return "\n".join(lines)

    def _generate_workflow_recommendations(self, bottlenecks: List[Dict],
                                         efficiency_metrics: Dict[str, Any],
                                         patterns: List[Dict[str, Any]]) -> List[str]:
        """Generate workflow optimization recommendations"""
        recommendations = []

        # Efficiency-based recommendations
        if efficiency_metrics["efficiency_score"] < 0.7:
            recommendations.append("Overall workflow efficiency is low - focus on bottleneck resolution")

        if efficiency_metrics["flow_efficiency"] < 0.6:
            recommendations.append("Low flow efficiency detected - reduce time spent in non-value-adding states")

        # Bottleneck-specific recommendations
        high_priority_bottlenecks = [b for b in bottlenecks if b["severity"] == "high"]
        if high_priority_bottlenecks:
            recommendations.append(f"Address {len(high_priority_bottlenecks)} high-priority bottlenecks immediately")

        # Pattern-based recommendations
        if patterns:
            recommendations.append(f"Review {len(patterns)} repetitive workflow patterns to break cycles")

        # Specific actionable recommendations
        recommendations.extend([
            "Implement automated testing to reduce testing bottlenecks",
            "Use CI/CD pipelines to streamline deployment processes",
            "Add monitoring dashboards for real-time workflow visibility",
            "Establish clear handoff procedures between workflow stages"
        ])

        return recommendations

    def save_analysis_report(self, output_path: Path) -> None:
        """Save analysis results to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Markov chain analysis saved to {output_path}")

def main():
    workspace_path = "/Users/daniellynch/Developer"

    analyzer = MarkovChainWorkflowAnalyzer(workspace_path)
    analysis_results = analyzer.analyze_workflow()

    output_path = Path(workspace_path) / "docs" / "reports" / "markov-chain-analysis.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    analyzer.save_analysis_report(output_path)

    # Print summary
    print("\n=== MARKOV CHAIN WORKFLOW ANALYSIS (N=5) ===")
    print(f"States: {', '.join(analyzer.states)}")
    print(f"Workflow samples analyzed: {analysis_results['metadata']['workflow_samples']}")

    efficiency = analysis_results['efficiency_metrics']
    print(".3f")
    print(".3f")
    print(".1f")

    bottlenecks = analysis_results['bottlenecks']
    if bottlenecks:
        print(f"\nBottlenecks detected: {len(bottlenecks)}")
        high_severity = len([b for b in bottlenecks if b['severity'] == 'high'])
        print(f"High-severity bottlenecks: {high_severity}")

    print(f"\nReport saved to: {output_path}")

if __name__ == "__main__":
    main()