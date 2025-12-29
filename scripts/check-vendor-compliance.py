#!/usr/bin/env python3
"""
Vendor Compliance Checker
Identifies custom scripts and recommends vendor CLI tool replacements
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VendorComplianceChecker:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()

        # Vendor tool mappings - custom script patterns to vendor CLI replacements
        self.vendor_replacements = {
            # Package management
            "pip install": "pixi add",
            "npm install": "pnpm add",
            "yarn add": "pnpm add",

            # File operations
            "cp ": "cp",  # Keep cp but use with care
            "mv ": "mv",  # Keep mv
            "rm ": "rm",  # Keep rm but use with care

            # Process management
            "kill ": "kill",
            "ps aux": "ps aux",
            "top": "htop",  # Replace top with htop

            # Text processing
            "grep ": "rg ",  # Replace grep with ripgrep
            "find ": "fd ",  # Replace find with fd
            "cat ": "bat ",  # Replace cat with bat
            "ls ": "eza ",   # Replace ls with eza

            # Git operations
            "git status": "git status",
            "git add": "git add",
            "git commit": "git commit",

            # Network operations
            "curl ": "curl",
            "wget ": "wget",

            # Custom automation patterns to replace
            "for file in": "Use fd or find with vendor tools",
            "while read": "Use vendor stream processors",
            "custom logging": "Use Winston or vendor logging",
            "custom error handling": "Use vendor error tracking",
        }

        # High-risk patterns that should be eliminated
        self.high_risk_patterns = [
            r"sudo.*",
            r"chmod.*777",
            r"rm -rf /",
            r"> /dev/null 2>&1",  # Silent failures
            r"curl.*\|.*bash",   # Pipe to shell
            r"wget.*\|.*bash",
            r"eval.*",
            r"exec.*",
        ]

        self.compliance_results = {}

    def analyze_script_compliance(self, script_path: Path) -> Dict[str, Any]:
        """Analyze a script for vendor compliance issues"""
        try:
            with open(script_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            issues = []
            replacements = []
            risk_level = "low"

            # Check for high-risk patterns
            for pattern in self.high_risk_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    issues.append({
                        "type": "high_risk_pattern",
                        "pattern": pattern,
                        "severity": "critical",
                        "description": f"High-risk pattern detected: {pattern}",
                        "recommendation": "Replace with vendor-approved alternatives"
                    })
                    risk_level = "critical"

            # Check for custom logic that should be replaced
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                line_lower = line.lower().strip()

                # Check for custom loops and logic
                if any(keyword in line_lower for keyword in ["for ", "while ", "if ", "function "]) and not line.startswith("#"):
                    # This is overly broad, but flags potential custom logic
                    if len(line.split()) > 5:  # Complex line
                        issues.append({
                            "type": "custom_logic",
                            "line": i,
                            "content": line[:100],
                            "severity": "medium",
                            "description": "Potential custom logic that may violate vendor-only policy",
                            "recommendation": "Consider using vendor CLI tools or libraries"
                        })

                # Check for replacements
                for old_pattern, new_tool in self.vendor_replacements.items():
                    if old_pattern in line and not line.startswith("#"):
                        replacements.append({
                            "line": i,
                            "original": line.strip(),
                            "replacement": line.replace(old_pattern, new_tool),
                            "tool": new_tool,
                            "rationale": f"Replace {old_pattern.strip()} with vendor tool {new_tool.strip()}"
                        })

            # Calculate compliance score
            total_lines = len(lines)
            issue_count = len(issues)
            compliance_score = max(0, 100 - (issue_count * 10) - (len(replacements) * 5))

            return {
                "file_path": str(script_path),
                "relative_path": str(script_path.relative_to(self.workspace_path)),
                "total_lines": total_lines,
                "issues": issues,
                "replacements": replacements,
                "compliance_score": compliance_score,
                "risk_level": risk_level,
                "recommendations": self._generate_script_recommendations(issues, replacements)
            }

        except Exception as e:
            return {
                "file_path": str(script_path),
                "error": str(e)
            }

    def _generate_script_recommendations(self, issues: List[Dict], replacements: List[Dict]) -> List[str]:
        """Generate recommendations for script improvements"""
        recommendations = []

        if issues:
            critical_issues = [i for i in issues if i["severity"] == "critical"]
            if critical_issues:
                recommendations.append(f"CRITICAL: Address {len(critical_issues)} critical security/risk issues immediately")

        if replacements:
            recommendations.append(f"Replace {len(replacements)} custom patterns with vendor CLI tools")

        # Specific recommendations based on patterns found
        has_custom_logic = any(i["type"] == "custom_logic" for i in issues)
        if has_custom_logic:
            recommendations.append("Consider decomposing complex scripts into vendor tool pipelines")

        has_file_operations = any("file" in str(r) for r in replacements)
        if has_file_operations:
            recommendations.append("Use vendor file manipulation tools (fd, sd, choose) instead of custom file operations")

        return recommendations

    def scan_scripts_directory(self) -> Dict[str, Any]:
        """Scan the scripts directory for compliance issues"""
        scripts_dir = self.workspace_path / "scripts"
        if not scripts_dir.exists():
            logger.warning("Scripts directory not found")
            return {}

        logger.info("Scanning scripts directory for vendor compliance...")

        script_files = []
        for ext in [".sh", ".py", ".js", ".bash", ".zsh"]:
            script_files.extend(scripts_dir.glob(f"**/*{ext}"))

        compliance_reports = {}
        total_issues = 0
        total_replacements = 0

        for script_file in script_files:
            if script_file.is_file():
                logger.debug(f"Analyzing {script_file.name}")
                report = self.analyze_script_compliance(script_file)
                compliance_reports[str(script_file)] = report

                if "issues" in report:
                    total_issues += len(report["issues"])
                if "replacements" in report:
                    total_replacements += len(report["replacements"])

        # Calculate overall compliance
        total_scripts = len(compliance_reports)
        avg_compliance = sum(r.get("compliance_score", 0) for r in compliance_reports.values() if "compliance_score" in r) / max(total_scripts, 1)

        compliance_summary = {
            "total_scripts_analyzed": total_scripts,
            "total_issues_found": total_issues,
            "total_replacements_suggested": total_replacements,
            "average_compliance_score": avg_compliance,
            "compliance_level": self._classify_compliance_level(avg_compliance),
            "scripts_by_risk": self._categorize_scripts_by_risk(compliance_reports)
        }

        return {
            "summary": compliance_summary,
            "script_reports": compliance_reports,
            "vendor_replacement_log": self._generate_replacement_log(compliance_reports)
        }

    def _classify_compliance_level(self, score: float) -> str:
        """Classify overall compliance level"""
        if score >= 90:
            return "excellent"
        elif score >= 75:
            return "good"
        elif score >= 60:
            return "fair"
        elif score >= 40:
            return "poor"
        else:
            return "critical"

    def _categorize_scripts_by_risk(self, reports: Dict) -> Dict[str, int]:
        """Categorize scripts by risk level"""
        risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}

        for report in reports.values():
            risk = report.get("risk_level", "low")
            risk_counts[risk] += 1

        return risk_counts

    def _generate_replacement_log(self, reports: Dict) -> List[Dict[str, Any]]:
        """Generate a log of all vendor replacements"""
        replacement_log = []

        for script_path, report in reports.items():
            if "replacements" in report:
                for replacement in report["replacements"]:
                    replacement_log.append({
                        "script": Path(script_path).name,
                        "script_path": script_path,
                        "line_number": replacement["line"],
                        "original_code": replacement["original"],
                        "replacement_code": replacement["replacement"],
                        "vendor_tool": replacement["tool"],
                        "rationale": replacement["rationale"],
                        "timestamp": "2025-12-28",
                        "status": "pending"
                    })

        return replacement_log

    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate complete vendor compliance report"""
        logger.info("Generating vendor compliance report...")

        compliance_data = self.scan_scripts_directory()

        report = {
            "metadata": {
                "report_type": "vendor_compliance_analysis",
                "workspace_path": str(self.workspace_path),
                "analysis_date": "2025-12-28",
                "version": "1.0"
            },
            "executive_summary": {
                "overall_compliance_level": compliance_data.get("summary", {}).get("compliance_level", "unknown"),
                "average_compliance_score": compliance_data.get("summary", {}).get("average_compliance_score", 0),
                "total_scripts_analyzed": compliance_data.get("summary", {}).get("total_scripts_analyzed", 0),
                "total_issues_found": compliance_data.get("summary", {}).get("total_issues_found", 0),
                "total_replacements_needed": compliance_data.get("summary", {}).get("total_replacements_suggested", 0),
                "critical_findings": self._identify_critical_findings(compliance_data)
            },
            "detailed_analysis": compliance_data,
            "remediation_plan": self._generate_remediation_plan(compliance_data),
            "vendor_policy_compliance": {
                "policy_statement": "All implementations must use vendor solutions, community libraries, or official SDKs",
                "prohibited_patterns": [
                    "Custom React components",
                    "Custom hooks",
                    "Custom utilities",
                    "Custom configurations",
                    "Custom styling frameworks",
                    "Complex build setups",
                    "Custom business logic implementations"
                ],
                "approved_vendor_tools": [
                    "Pixi (package management)",
                    "ripgrep, fd, bat, jq (CLI tools)",
                    "Winston (logging)",
                    "Chezmoi (configuration)",
                    "1Password CLI (secrets)",
                    "Hugging Face (AI/ML)",
                    "PostgreSQL, Neo4j, Redis (databases)"
                ]
            }
        }

        self.compliance_results = report
        return report

    def _identify_critical_findings(self, compliance_data: Dict) -> List[str]:
        """Identify critical compliance findings"""
        findings = []

        summary = compliance_data.get("summary", {})

        if summary.get("compliance_level") == "critical":
            findings.append("CRITICAL: Overall compliance level is critical - immediate remediation required")

        critical_scripts = summary.get("scripts_by_risk", {}).get("critical", 0)
        if critical_scripts > 0:
            findings.append(f"CRITICAL: {critical_scripts} scripts contain critical security/risk issues")

        total_issues = summary.get("total_issues_found", 0)
        if total_issues > 50:
            findings.append(f"HIGH: {total_issues} total compliance issues identified across all scripts")

        return findings

    def _generate_remediation_plan(self, compliance_data: Dict) -> Dict[str, Any]:
        """Generate remediation plan for compliance issues"""
        summary = compliance_data.get("summary", {})

        plan = {
            "phases": [
                {
                    "phase": "immediate",
                    "priority": "critical",
                    "actions": [
                        "Address all critical security issues",
                        "Replace high-risk patterns with vendor alternatives",
                        "Review scripts with custom sudo/chmod operations"
                    ],
                    "timeline": "1-2 days",
                    "resources_needed": ["Security review", "Vendor tool documentation"]
                },
                {
                    "phase": "short_term",
                    "priority": "high",
                    "actions": [
                        "Replace custom CLI patterns with vendor tools (grep→ripgrep, find→fd, etc.)",
                        "Implement vendor logging solutions (replace custom logging)",
                        "Migrate package management to Pixi/ vendor tools"
                    ],
                    "timeline": "1-2 weeks",
                    "resources_needed": ["CLI tool training", "Vendor SDK integration"]
                },
                {
                    "phase": "medium_term",
                    "priority": "medium",
                    "actions": [
                        "Refactor complex custom logic into vendor tool pipelines",
                        "Implement vendor configuration management (Chezmoi)",
                        "Establish vendor compliance monitoring"
                    ],
                    "timeline": "2-4 weeks",
                    "resources_needed": ["Architecture review", "Vendor platform setup"]
                }
            ],
            "success_metrics": {
                "compliance_score_target": 90,
                "critical_issues_target": 0,
                "vendor_tool_adoption": "100% of operations"
            },
            "monitoring_and_enforcement": [
                "Pre-commit hooks to prevent custom code commits",
                "Automated compliance scanning in CI/CD",
                "Regular vendor compliance audits",
                "Team training on vendor-only development"
            ]
        }

        return plan

    def save_compliance_report(self, output_path: Path) -> None:
        """Save compliance report to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.compliance_results, f, indent=2, ensure_ascii=False)

        logger.info(f"Vendor compliance report saved to {output_path}")

def main():
    workspace_path = "/Users/daniellynch/Developer"

    checker = VendorComplianceChecker(workspace_path)
    compliance_report = checker.generate_compliance_report()

    output_path = Path(workspace_path) / "docs" / "compliance" / "vendor-compliance-report.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    checker.save_compliance_report(output_path)

    # Print summary
    summary = compliance_report["executive_summary"]

    print("\n=== VENDOR COMPLIANCE ANALYSIS ===")
    print(f"Overall Compliance Level: {summary['overall_compliance_level'].upper()}")
    print(".1f")
    print(f"Scripts Analyzed: {summary['total_scripts_analyzed']}")
    print(f"Total Issues Found: {summary['total_issues_found']}")
    print(f"Replacements Needed: {summary['total_replacements_needed']}")

    if summary["critical_findings"]:
        print(f"\nCritical Findings ({len(summary['critical_findings'])}):")
        for finding in summary["critical_findings"]:
            print(f"  • {finding}")

    print(f"\nDetailed report saved to: {output_path}")

if __name__ == "__main__":
    main()