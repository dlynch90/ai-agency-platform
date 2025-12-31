#!/usr/bin/env python3
"""
VENDOR-BASED CODEBASE CLEANUP ENGINE
====================================

Uses ML-powered analysis to identify and eliminate:
- Custom code violations
- Codebase bloat and technical debt
- Duplicate files and stale content
- Architecture violations
- Security vulnerabilities

Vendor Tools Integration:
- ast-grep: AST-based code analysis
- jq: JSON processing and validation
- chezmoi: Configuration management
- ML models: Pattern recognition and optimization
"""

import os
import sys
import json
import subprocess
import hashlib
from pathlib import Path
from typing import Dict, List, Set, Tuple
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity

class VendorCodebaseCleanup:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.violations = []
        self.duplicates = []
        self.bloat_files = []
        self.custom_code = []

        #region agent log H3: Architecture Enforcement Violation
        import json
        import os
        log_entry = {
            "sessionId": "debug-session-20part",
            "runId": "initial-run",
            "hypothesisId": "H3",
            "location": "scripts/vendor-codebase-cleanup.py:26",
            "message": "Initializing cleanup engine, checking architecture compliance",
            "data": {
                "root_path": str(root_path),
                "root_files_count": len(list(Path(root_path).glob('*'))),
                "required_dirs_present": self._check_required_dirs()
            },
            "timestamp": int(__import__('time').time() * 1000)
        }
        with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        #endregion

        # Vendor tool configurations
        self.vendor_tools = {
            'ast_grep': 'ast-grep',
            'jq': 'jq',
            'chezmoi': 'chezmoi',
            'fd': 'fd',
            'rg': 'rg'
        }

    def _check_ml_dependencies(self) -> Dict:
        """Check if ML dependencies are available"""
        try:
            import numpy
            import pandas
            import sklearn
            return {"numpy": True, "pandas": True, "sklearn": True}
        except ImportError as e:
            return {"error": str(e)}

    def _check_vendor_tools(self) -> Dict:
        """Check which vendor tools are available"""
        tools_status = {}
        for name, cmd in self.vendor_tools.items():
            try:
                result = subprocess.run([cmd, '--version'], capture_output=True, text=True, timeout=5)
                tools_status[name] = result.returncode == 0
            except:
                tools_status[name] = False
        return tools_status

    def _check_required_dirs(self) -> Dict:
        """Check if required directories exist"""
        required = ['docs', 'scripts', 'configs', 'testing', 'infra', 'data', 'api', 'graphql']
        present = {}
        for dir_name in required:
            present[dir_name] = (self.root_path / dir_name).exists()
        return present

    def run_vendor_audit(self) -> Dict:
        """Run comprehensive vendor-based audit using multiple tools"""
        print("🔍 Running Vendor-Based Codebase Audit...")

        #region agent log H1: ML Environment Setup Failure
        import json
        import os
        log_entry = {
            "sessionId": "debug-session-20part",
            "runId": "initial-run",
            "hypothesisId": "H1",
            "location": "scripts/vendor-codebase-cleanup.py:47",
            "message": "Starting vendor audit with ML environment check",
            "data": {
                "python_version": sys.version,
                "working_directory": os.getcwd(),
                "pixi_available": bool(os.system("which pixi > /dev/null 2>&1") == 0),
                "ml_libs_available": self._check_ml_dependencies()
            },
            "timestamp": int(__import__('time').time() * 1000)
        }
        with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        #endregion

        results = {
            'architecture_violations': self._audit_architecture(),
            'custom_code_violations': self._audit_custom_code(),
            'duplicate_files': self._find_duplicates_ml(),
            'bloat_analysis': self._analyze_bloat(),
            'security_violations': self._audit_security(),
            'optimization_opportunities': self._analyze_optimization()
        }

        #region agent log H2: Vendor Tool Integration Gap
        log_entry = {
            "sessionId": "debug-session-20part",
            "runId": "initial-run",
            "hypothesisId": "H2",
            "location": "scripts/vendor-codebase-cleanup.py:65",
            "message": "Completed audit phases, checking vendor tool integration",
            "data": {
                "tools_checked": list(self.vendor_tools.keys()),
                "tools_available": self._check_vendor_tools(),
                "audit_results_count": sum(len(v) if isinstance(v, list) else 0 for v in results.values())
            },
            "timestamp": int(__import__('time').time() * 1000)
        }
        with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        #endregion

        return results

    def _audit_architecture(self) -> List[Dict]:
        """Audit architecture violations using vendor tools"""
        violations = []

        #region agent log H3: Architecture Enforcement Violation - Root Files Check
        import json
        root_files = list(self.root_path.glob('*'))
        loose_files = [f for f in root_files if f.is_file()]
        allowed_files = ['.gitignore', 'README.md', 'LICENSE', 'pyproject.toml', 'pixi.toml', 'pixi.lock', 'package.json', 'package-lock.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml']

        log_entry = {
            "sessionId": "debug-session-20part",
            "runId": "initial-run",
            "hypothesisId": "H3",
            "location": "scripts/vendor-codebase-cleanup.py:75",
            "message": "Auditing root directory for architecture violations",
            "data": {
                "total_root_items": len(root_files),
                "loose_files_count": len(loose_files),
                "allowed_files_present": [f.name for f in loose_files if f.name in allowed_files],
                "violating_files": [f.name for f in loose_files if f.name not in allowed_files]
            },
            "timestamp": int(__import__('time').time() * 1000)
        }
        with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        #endregion

        for file_path in loose_files:
            if file_path.name not in allowed_files:
                violations.append({
                    'type': 'architecture_violation',
                    'severity': 'high',
                    'file': str(file_path),
                    'message': f'Loose file in root directory: {file_path.name}',
                    'fix': f'Move to appropriate directory (/scripts, /docs, /configs)'
                })

        # Check directory structure compliance
        required_dirs = ['docs', 'scripts', 'configs', 'testing', 'infra', 'data', 'api', 'graphql']
        missing_dirs = []
        for dir_name in required_dirs:
            if not (self.root_path / dir_name).exists():
                missing_dirs.append(dir_name)

        if missing_dirs:
            violations.append({
                'type': 'architecture_violation',
                'severity': 'medium',
                'file': 'directory_structure',
                'message': f'Missing required directories: {missing_dirs}',
                'fix': f'Create directories: {missing_dirs}'
            })

        return violations

    def _audit_custom_code(self) -> List[Dict]:
        """Audit custom code violations using ast-grep and ML analysis"""
        violations = []

        # Use ast-grep to find custom implementations
        custom_patterns = [
            # Custom React components
            r'function\s+[A-Z][a-zA-Z]*\s*\(',
            r'const\s+[A-Z][a-zA-Z]*\s*=',
            # Custom hooks
            r'function\s+use[A-Z][a-zA-Z]*',
            r'const\s+use[A-Z][a-zA-Z]*',
            # Custom utilities
            r'export\s+(const|function)\s+[a-z][a-zA-Z]*Util',
            # Hardcoded paths
            r'path\.join\(__dirname',
            r'resolve\(__dirname',
            # Console.log statements
            r'console\.log\(',
        ]

        for pattern in custom_patterns:
            #region agent log H4: GPU Acceleration Configuration - Custom Code Pattern Check
            import json
            log_entry = {
                "sessionId": "debug-session-20part",
                "runId": "initial-run",
                "hypothesisId": "H4",
                "location": "scripts/vendor-codebase-cleanup.py:120",
                "message": "Checking custom code pattern with vendor tools",
                "data": {
                    "pattern": pattern,
                    "ast_grep_available": self.vendor_tools.get('ast_grep') in self._check_vendor_tools()
                },
                "timestamp": int(__import__('time').time() * 1000)
            }
            with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
            #endregion

            try:
                result = subprocess.run(
                    [self.vendor_tools['ast_grep'], '--pattern', pattern, '--json'],
                    cwd=self.root_path,
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0 and result.stdout.strip():
                    matches = json.loads(result.stdout)
                    #region agent log H4: Custom Code Violations Found
                    log_entry = {
                        "sessionId": "debug-session-20part",
                        "runId": "initial-run",
                        "hypothesisId": "H4",
                        "location": "scripts/vendor-codebase-cleanup.py:135",
                        "message": "Custom code violations detected",
                        "data": {
                            "pattern": pattern,
                            "matches_found": len(matches),
                            "sample_files": [m.get('file', 'unknown') for m in matches[:5]]
                        },
                        "timestamp": int(__import__('time').time() * 1000)
                    }
                    with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
                        f.write(json.dumps(log_entry) + '\n')
                    #endregion

                    for match in matches:
                        violations.append({
                            'type': 'custom_code_violation',
                            'severity': 'high',
                            'file': match.get('file', 'unknown'),
                            'line': match.get('line', 0),
                            'message': f'Custom implementation detected: {pattern}',
                            'fix': 'Replace with vendor solution or library'
                        })
            except Exception as e:
                print(f"Warning: Could not run ast-grep pattern {pattern}: {e}")
                #region agent log H4: Tool Execution Failed
                log_entry = {
                    "sessionId": "debug-session-20part",
                    "runId": "initial-run",
                    "hypothesisId": "H4",
                    "location": "scripts/vendor-codebase-cleanup.py:155",
                    "message": "Vendor tool execution failed",
                    "data": {
                        "pattern": pattern,
                        "error": str(e),
                        "tool": self.vendor_tools.get('ast_grep')
                    },
                    "timestamp": int(__import__('time').time() * 1000)
                }
                with open('/Users/daniellynch/Developer/.cursor/debug.log', 'a') as f:
                    f.write(json.dumps(log_entry) + '\n')
                #endregion

        return violations

    def _find_duplicates_ml(self) -> List[Dict]:
        """Use ML to find duplicate files based on content similarity"""
        duplicates = []

        # Get all source files
        source_files = []
        for ext in ['.js', '.ts', '.py', '.jsx', '.tsx', '.rs', '.go']:
            source_files.extend(list(self.root_path.rglob(f'*{ext}')))

        if len(source_files) < 2:
            return duplicates

        # Extract content and compute similarity
        file_contents = []
        file_paths = []

        for file_path in source_files[:100]:  # Limit for performance
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if len(content.strip()) > 100:  # Skip very small files
                        file_contents.append(content)
                        file_paths.append(file_path)
            except Exception:
                continue

        if len(file_contents) < 2:
            return duplicates

        # Vectorize content using TF-IDF
        vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        try:
            tfidf_matrix = vectorizer.fit_transform(file_contents)

            # Compute similarity matrix
            similarity_matrix = cosine_similarity(tfidf_matrix)

            # Find duplicates using DBSCAN clustering
            clustering = DBSCAN(eps=0.95, min_samples=2, metric='precomputed')
            distance_matrix = 1 - similarity_matrix
            clusters = clustering.fit_predict(distance_matrix)

            # Group duplicates
            duplicate_groups = {}
            for i, cluster in enumerate(clusters):
                if cluster != -1:  # Not noise
                    if cluster not in duplicate_groups:
                        duplicate_groups[cluster] = []
                    duplicate_groups[cluster].append(file_paths[i])

            for cluster, files in duplicate_groups.items():
                if len(files) > 1:
                    duplicates.append({
                        'type': 'duplicate_files',
                        'severity': 'medium',
                        'files': [str(f) for f in files],
                        'similarity': 'high',
                        'fix': 'Consolidate duplicate implementations'
                    })

        except Exception as e:
            print(f"Warning: ML-based duplicate detection failed: {e}")

        return duplicates

    def _analyze_bloat(self) -> List[Dict]:
        """Analyze codebase bloat using file size and complexity metrics"""
        bloat_files = []

        # Check for large files
        for file_path in self.root_path.rglob('*'):
            if file_path.is_file():
                try:
                    size = file_path.stat().st_size
                    if size > 10 * 1024 * 1024:  # 10MB
                        bloat_files.append({
                            'type': 'file_bloat',
                            'severity': 'medium',
                            'file': str(file_path),
                            'size': size,
                            'message': f'Large file detected: {size / (1024*1024):.1f}MB',
                            'fix': 'Split large files or optimize content'
                        })
                except Exception:
                    continue

        # Check for empty directories
        for dir_path in self.root_path.rglob('*'):
            if dir_path.is_dir():
                try:
                    if not any(dir_path.iterdir()):
                        bloat_files.append({
                            'type': 'empty_directory',
                            'severity': 'low',
                            'file': str(dir_path),
                            'message': 'Empty directory',
                            'fix': 'Remove empty directories'
                        })
                except Exception:
                    continue

        return bloat_files

    def _audit_security(self) -> List[Dict]:
        """Audit security violations using vendor tools"""
        violations = []

        # Check for hardcoded secrets
        secret_patterns = [
            r'password\s*=',
            r'secret\s*=',
            r'key\s*=',
            r'token\s*=',
            r'api_key\s*='
        ]

        for pattern in secret_patterns:
            try:
                result = subprocess.run(
                    [self.vendor_tools['rg'], pattern, '--json'],
                    cwd=self.root_path,
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0 and result.stdout.strip():
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        try:
                            match = json.loads(line)
                            if 'data' in match and 'lines' in match['data']:
                                violations.append({
                                    'type': 'security_violation',
                                    'severity': 'critical',
                                    'file': match['data']['path']['text'],
                                    'line': match['data']['line_number'],
                                    'message': 'Potential hardcoded secret detected',
                                    'fix': 'Use 1Password or environment variables'
                                })
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                print(f"Warning: Could not run security pattern {pattern}: {e}")

        return violations

    def _analyze_optimization(self) -> List[Dict]:
        """Analyze optimization opportunities"""
        opportunities = []

        # Check for unused imports (basic analysis)
        for file_path in self.root_path.rglob('*.{js,ts,py}'):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Simple heuristic for unused imports
                import_lines = [line.strip() for line in content.split('\n')
                              if line.strip().startswith(('import', 'from', 'const', 'let', 'var'))]

                if len(import_lines) > 20:
                    opportunities.append({
                        'type': 'optimization_opportunity',
                        'severity': 'low',
                        'file': str(file_path),
                        'message': f'High import count: {len(import_lines)} imports',
                        'fix': 'Review and optimize imports'
                    })

            except Exception:
                continue

        return opportunities

    def generate_cleanup_report(self, results: Dict) -> str:
        """Generate comprehensive cleanup report"""
        report = "# Vendor-Based Codebase Cleanup Report\n\n"

        total_violations = sum(len(v) for v in results.values() if isinstance(v, list))

        report += f"## Summary\n"
        report += f"- Total violations found: {total_violations}\n\n"

        for category, violations in results.items():
            if isinstance(violations, list) and violations:
                report += f"## {category.replace('_', ' ').title()}\n"
                for violation in violations[:10]:  # Limit for readability
                    severity_emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢'}
                    emoji = severity_emoji.get(violation.get('severity', 'low'), '⚪')
                    report += f"- {emoji} **{violation.get('type', 'unknown')}**: {violation.get('message', '')}\n"
                    if 'file' in violation:
                        report += f"  - File: `{violation['file']}`\n"
                    if 'fix' in violation:
                        report += f"  - Fix: {violation['fix']}\n"
                report += "\n"

        return report

    def apply_automated_fixes(self, results: Dict, dry_run: bool = True) -> List[str]:
        """Apply automated fixes using vendor tools"""
        fixes_applied = []

        if dry_run:
            print("🔧 DRY RUN MODE - No changes will be made")
            return fixes_applied

        # Fix empty directories
        for violation in results.get('bloat_analysis', []):
            if violation.get('type') == 'empty_directory':
                try:
                    os.rmdir(violation['file'])
                    fixes_applied.append(f"Removed empty directory: {violation['file']}")
                except Exception as e:
                    print(f"Could not remove directory {violation['file']}: {e}")

        return fixes_applied

def main():
    if len(sys.argv) < 2:
        print("Usage: python vendor-codebase-cleanup.py <path>")
        sys.exit(1)

    root_path = sys.argv[1]
    dry_run = '--dry-run' in sys.argv

    cleanup = VendorCodebaseCleanup(root_path)
    results = cleanup.run_vendor_audit()

    # Generate and save report
    report = cleanup.generate_cleanup_report(results)
    report_path = Path(root_path) / 'docs' / 'vendor-cleanup-report.md'
    report_path.parent.mkdir(exist_ok=True)

    with open(report_path, 'w') as f:
        f.write(report)

    print(f"📊 Cleanup report saved to: {report_path}")

    # Apply automated fixes
    fixes = cleanup.apply_automated_fixes(results, dry_run=dry_run)
    if fixes:
        print("✅ Applied fixes:")
        for fix in fixes:
            print(f"  - {fix}")

    # Summary
    total_violations = sum(len(v) for v in results.values() if isinstance(v, list))
    print(f"\n📈 Summary: {total_violations} violations found")
    print(f"📋 Full report: {report_path}")

if __name__ == '__main__':
    main()