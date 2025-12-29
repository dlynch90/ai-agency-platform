#!/usr/bin/env python3
"""
Audit loose files in user root directory and enforce Cursor IDE rules
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Any

class LooseFilesAuditor:
    """Audit loose files and enforce Cursor IDE rules"""

    def __init__(self):
        self.user_root = Path.home()
        self.developer_dir = self.user_root / "Developer"
        self.audit_report = self.developer_dir / "loose_files_audit_report.json"
        self.cursor_rules_dir = self.user_root / ".cursor" / "rules"

        # Instrumentation logging
        self.log_to_debug("Starting loose files audit - enforcing Cursor IDE rules")

    def log_to_debug(self, message: str):
        """Debug logging for instrumentation"""
        log_entry = {
            "id": f"log_{int(time.time()*1000)}_{str(hash(message + str(time.time())))[:8]}",
            "timestamp": int(time.time()*1000),
            "location": f"audit_loose_files_fixed.py:{self.__class__.__name__}:log_to_debug",
            "message": message,
            "data": {},
            "sessionId": "debug-audit-loose-files",
            "runId": "run-1",
            "hypothesisId": "H_AUDIT_1"
        }
        try:
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            print(f"Debug log write failed: {e}")

    def scan_loose_files(self, directory: Path) -> Dict[str, Any]:
        """Scan directory for loose files violating Cursor rules"""
        loose_files = []
        organized_files = []
        violations = []

        try:
            for item in directory.iterdir():
                if item.is_file():
                    # Check if this is a loose file (not in proper subdirectories)
                    if item.name.startswith('.') or item.suffix in ['.sh', '.md', '.json', '.log', '.txt', '.py', '.toml']:
                        if not any(parent in ['docs', 'scripts', 'configs', 'testing', 'data', 'infra', 'api', 'graphql', 'federation']
                                 for parent in item.parent.parts):
                            loose_files.append({
                                "path": str(item),
                                "name": item.name,
                                "size": item.stat().st_size,
                                "modified": item.stat().st_mtime,
                                "violation": "Loose file in root directory",
                                "recommended_location": self.get_recommended_location(item)
                            })
                            violations.append(f"Loose file: {item.name}")

                elif item.is_dir():
                    # Check for proper organization
                    if item.name in ['docs', 'scripts', 'configs', 'testing', 'data', 'infra', 'api', 'graphql', 'federation']:
                        organized_files.append(item.name)

        except PermissionError as e:
            violations.append(f"Permission denied accessing {directory}: {e}")

        return {
            "directory": str(directory),
            "loose_files": loose_files,
            "organized_files": organized_files,
            "violations": violations,
            "total_violations": len(violations)
        }

    def get_recommended_location(self, file_path: Path) -> str:
        """Determine recommended location for loose file"""
        name = file_path.name.lower()

        if name.endswith('.sh'):
            return "scripts/"
        elif name.endswith('.md'):
            return "docs/"
        elif name.endswith('.json'):
            if 'config' in name:
                return "configs/"
            elif 'test' in name:
                return "testing/"
            else:
                return "data/"
        elif name.endswith('.log'):
            return "logs/"
        elif name.endswith('.py'):
            if 'test' in name:
                return "testing/"
            else:
                return "scripts/"
        elif name.startswith('.'):
            return ".config/ or chezmoi managed"
        else:
            return "docs/ or appropriate subdirectory"

    def check_cursor_rules_compliance(self) -> Dict[str, Any]:
        """Check compliance with Cursor IDE rules"""
        compliance_issues = []
        rule_files = []

        # Check if rules directory exists
        if not self.cursor_rules_dir.exists():
            compliance_issues.append("Cursor rules directory missing: .cursor/rules/")
        else:
            # Check for required rule files
            for rule_file in self.cursor_rules_dir.glob("*.mdc"):
                rule_files.append(rule_file.name)

            if not rule_files:
                compliance_issues.append("No Cursor rule files found (.mdc files)")

        # Check for required directory structure
        required_dirs = ['docs', 'testing', 'infra', 'data', 'api', 'graphql', 'federation']
        missing_dirs = []

        for req_dir in required_dirs:
            if not (self.developer_dir / req_dir).exists():
                missing_dirs.append(req_dir)

        if missing_dirs:
            compliance_issues.append(f"Missing required directories: {', '.join(missing_dirs)}")

        return {
            "rule_files": rule_files,
            "compliance_issues": compliance_issues,
            "missing_directories": missing_dirs,
            "compliant": len(compliance_issues) == 0
        }

    def check_git_hooks_compliance(self) -> Dict[str, Any]:
        """Check Git hooks compliance with event-driven architecture"""
        hooks_dir = self.developer_dir / ".git" / "hooks"
        hooks_issues = []

        if not hooks_dir.exists():
            hooks_issues.append("Git hooks directory missing")
            return {"hooks_found": [], "issues": hooks_issues, "event_driven": False}

        hooks_found = []
        for hook_file in hooks_dir.glob("*"):
            if hook_file.is_file() and not hook_file.name.endswith('.sample'):
                hooks_found.append(hook_file.name)

        # Check for required event-driven hooks
        required_hooks = ['pre-commit', 'post-commit', 'pre-push', 'post-merge']
        missing_hooks = []

        for req_hook in required_hooks:
            if req_hook not in hooks_found:
                missing_hooks.append(req_hook)

        if missing_hooks:
            hooks_issues.append(f"Missing event-driven hooks: {', '.join(missing_hooks)}")

        # Check if hooks implement MCP integration
        mcp_integration = False
        lefthook_integration = False

        for hook in hooks_found:
            hook_path = hooks_dir / hook
            try:
                with open(hook_path, 'r') as f:
                    content = f.read()
                    if 'mcp' in content.lower():
                        mcp_integration = True
                    if 'lefthook' in content.lower():
                        lefthook_integration = True
            except:
                pass

        if not mcp_integration:
            hooks_issues.append("Git hooks missing MCP server integration")

        if not lefthook_integration:
            hooks_issues.append("Git hooks missing Lefthook integration")

        return {
            "hooks_found": hooks_found,
            "missing_hooks": missing_hooks,
            "issues": hooks_issues,
            "mcp_integration": mcp_integration,
            "lefthook_integration": lefthook_integration,
            "event_driven": len(hooks_issues) == 0
        }

    def generate_reorganization_plan(self, audit_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate plan to fix loose files and rule violations"""
        plan = {
            "actions_required": [],
            "files_to_move": [],
            "directories_to_create": [],
            "hooks_to_implement": [],
            "rules_to_enforce": []
        }

        # Plan file moves - collect from both user_root and developer audits
        all_loose_files = []
        if "user_root_audit" in audit_results and "loose_files" in audit_results["user_root_audit"]:
            all_loose_files.extend(audit_results["user_root_audit"]["loose_files"])
        if "developer_audit" in audit_results and "loose_files" in audit_results["developer_audit"]:
            all_loose_files.extend(audit_results["developer_audit"]["loose_files"])

        for file_info in all_loose_files:
            plan["files_to_move"].append({
                "source": file_info["path"],
                "destination": file_info["recommended_location"],
                "reason": file_info["violation"]
            })

        # Plan directory creation
        required_dirs = ['docs', 'testing', 'infra', 'data', 'api', 'graphql', 'federation']
        for req_dir in required_dirs:
            if not (self.developer_dir / req_dir).exists():
                plan["directories_to_create"].append(req_dir)

        # Plan hook implementation
        if not audit_results.get("git_hooks", {}).get("event_driven", False):
            plan["hooks_to_implement"] = ["pre-commit", "post-commit", "pre-push", "post-merge"]

        # Plan rule enforcement
        if not audit_results.get("cursor_rules", {}).get("compliant", False):
            plan["rules_to_enforce"] = audit_results["cursor_rules"]["compliance_issues"]

        plan["actions_required"] = [
            f"Move {len(plan['files_to_move'])} loose files",
            f"Create {len(plan['directories_to_create'])} missing directories",
            f"Implement {len(plan['hooks_to_implement'])} Git hooks",
            f"Fix {len(plan['rules_to_enforce'])} rule violations"
        ]

        return plan

    def run_comprehensive_audit(self) -> Dict[str, Any]:
        """Run complete audit of loose files and Cursor compliance"""
        self.log_to_debug("Starting comprehensive audit")

        audit_results = {
            "timestamp": time.time(),
            "user_root_audit": self.scan_loose_files(self.user_root),
            "developer_audit": self.scan_loose_files(self.developer_dir),
            "cursor_rules": self.check_cursor_rules_compliance(),
            "git_hooks": self.check_git_hooks_compliance(),
            "reorganization_plan": {}
        }

        # Generate reorganization plan
        audit_results["reorganization_plan"] = self.generate_reorganization_plan(audit_results)

        # Save audit report
        with open(self.audit_report, 'w') as f:
            json.dump(audit_results, f, indent=2, default=str)

        total_violations = sum(
            result.get("total_violations", 0)
            for result in audit_results.values()
            if isinstance(result, dict) and "total_violations" in result
        )

        self.log_to_debug(f"Comprehensive audit completed with {total_violations} violations")

        return audit_results

    def display_audit_results(self, results: Dict[str, Any]):
        """Display audit results in readable format"""
        print("🔍 CURSOR IDE COMPLIANCE AUDIT RESULTS")
        print("=" * 60)

        print("\n📁 LOOSE FILES IN USER ROOT:")
        root_loose = results["user_root_audit"]["loose_files"]
        print(f"   Found {len(root_loose)} loose files:")
        for file_info in root_loose[:10]:  # Show first 10
            print(f"   • {file_info['name']} → {file_info['recommended_location']}")
        if len(root_loose) > 10:
            print(f"   ... and {len(root_loose) - 10} more")

        print("\n📁 LOOSE FILES IN DEVELOPER DIR:")
        dev_loose = results["developer_audit"]["loose_files"]
        print(f"   Found {len(dev_loose)} loose files:")
        for file_info in dev_loose[:10]:
            print(f"   • {file_info['name']} → {file_info['recommended_location']}")
        if len(dev_loose) > 10:
            print(f"   ... and {len(dev_loose) - 10} more")

        print("\n📋 CURSOR RULES COMPLIANCE:")
        rules = results["cursor_rules"]
        print(f"   Rule files: {len(rules['rule_files'])}")
        print(f"   Compliance issues: {len(rules['compliance_issues'])}")
        for issue in rules['compliance_issues']:
            print(f"   ❌ {issue}")

        print("\n🔗 GIT HOOKS & EVENT-DRIVEN ARCHITECTURE:")
        hooks = results["git_hooks"]
        print(f"   Hooks found: {len(hooks['hooks_found'])}")
        print(f"   Event-driven: {'✅' if hooks['event_driven'] else '❌'}")
        print(f"   MCP integration: {'✅' if hooks['mcp_integration'] else '❌'}")
        print(f"   Lefthook integration: {'✅' if hooks['lefthook_integration'] else '❌'}")
        for issue in hooks['issues']:
            print(f"   ❌ {issue}")

        print("\n🛠️  REORGANIZATION PLAN:")
        plan = results["reorganization_plan"]
        for action in plan["actions_required"]:
            print(f"   • {action}")

        total_violations = sum(
            result.get("total_violations", 0)
            for result in results.values()
            if isinstance(result, dict) and "total_violations" in result
        )

        print("\n📊 SUMMARY:")
        print(f"   Total violations: {total_violations}")
        print(f"   Actions needed: {len(plan['actions_required'])}")

        print("\n💾 Detailed report saved to:")
        print(f"   {self.audit_report}")

        print("\n" + "=" * 60)

if __name__ == "__main__":
    auditor = LooseFilesAuditor()
    results = auditor.run_comprehensive_audit()
    auditor.display_audit_results(results)