#!/usr/bin/env python3
"""
Audit Loose Files in Root Directory
Categorizes files by type and prepares for organization
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
import mimetypes
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LooseFilesAuditor:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()
        self.audit_results = {}

        # File categorization rules
        self.categorization_rules = {
            "documentation": {
                "extensions": [".md", ".txt", ".rst", ".adoc", ".pdf"],
                "patterns": ["readme", "changelog", "license", "contributing", "adr"],
                "target_dir": "docs"
            },
            "scripts": {
                "extensions": [".sh", ".bash", ".zsh", ".ps1", ".py", ".js", ".ts"],
                "patterns": ["script", "install", "setup", "build", "deploy", "test"],
                "target_dir": "scripts"
            },
            "configuration": {
                "extensions": [".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf"],
                "patterns": ["config", "settings", "env", "dockerfile", "makefile"],
                "target_dir": "configs"
            },
            "tests": {
                "extensions": [".test.js", ".test.ts", ".test.py", ".spec.js", ".spec.ts"],
                "patterns": ["test", "spec", "e2e", "integration"],
                "target_dir": "testing"
            },
            "infrastructure": {
                "extensions": [".tf", ".hcl", ".dockerfile"],
                "patterns": ["docker", "terraform", "kubernetes", "infra"],
                "target_dir": "infra"
            },
            "data": {
                "extensions": [".db", ".sqlite", ".csv", ".json"],
                "patterns": ["data", "database", "cache"],
                "target_dir": "data"
            },
            "logs": {
                "extensions": [".log"],
                "patterns": ["log", "report", "audit"],
                "target_dir": "logs"
            },
            "api": {
                "extensions": [".graphql", ".proto"],
                "patterns": ["schema", "api", "federation"],
                "target_dir": "api"
            }
        }

        # Files/directories to exclude from audit
        self.exclude_patterns = [
            ".git", ".DS_Store", "node_modules", ".pixi", ".venv", "venv311",
            ".cursor", ".vscode", ".idea", "__pycache__", ".pytest_cache",
            "target", "build", "dist", ".next", ".nuxt", "coverage",
            "*.tmp", "*.bak", "*.swp", "*.pyc"
        ]

    def should_exclude_file(self, file_path: Path) -> bool:
        """Check if file should be excluded from audit"""
        file_name = file_path.name

        # Check exclude patterns
        for pattern in self.exclude_patterns:
            if pattern in str(file_path) or file_name.startswith('.') or file_name.endswith('.tmp'):
                return True

        # Skip directories (we only want loose files in root)
        if file_path.is_dir():
            return True

        return False

    def categorize_file(self, file_path: Path) -> str:
        """Categorize a file based on its properties"""
        file_name = file_path.name.lower()
        file_extension = file_path.suffix.lower()

        # Check each category
        for category, rules in self.categorization_rules.items():
            # Check extensions
            if file_extension in rules["extensions"]:
                return category

            # Check patterns in filename
            for pattern in rules["patterns"]:
                if pattern.lower() in file_name:
                    return category

        # Special categorization for certain files
        if file_name.startswith("adr") or file_name.startswith("adr_"):
            return "documentation"

        # Default category for uncategorized files
        return "uncategorized"

    def get_file_info(self, file_path: Path) -> Dict[str, Any]:
        """Get detailed information about a file"""
        try:
            stat_info = file_path.stat()
            mime_type, _ = mimetypes.guess_type(str(file_path))

            # Try to read first few lines to understand content
            content_preview = ""
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content_preview = f.read(200).strip()
            except:
                content_preview = "[binary or unreadable file]"

            return {
                "name": file_path.name,
                "path": str(file_path),
                "relative_path": str(file_path.relative_to(self.workspace_path)),
                "size_bytes": stat_info.st_size,
                "size_human": self._format_file_size(stat_info.st_size),
                "modified_time": stat_info.st_mtime,
                "mime_type": mime_type,
                "content_preview": content_preview[:100] + "..." if len(content_preview) > 100 else content_preview,
                "is_executable": os.access(file_path, os.X_OK),
                "is_text_file": self._is_text_file(file_path)
            }
        except Exception as e:
            return {
                "name": file_path.name,
                "path": str(file_path),
                "error": str(e)
            }

    def _format_file_size(self, size_bytes: int) -> str:
        """Format file size in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return ".1f"
            size_bytes /= 1024.0
        return ".1f"

    def _is_text_file(self, file_path: Path) -> bool:
        """Check if file is a text file"""
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                # Check if chunk contains null bytes (indicates binary)
                return b'\x00' not in chunk
        except:
            return False

    def audit_loose_files(self) -> Dict[str, Any]:
        """Audit all loose files in the workspace root"""
        logger.info("Starting loose files audit...")

        loose_files = []
        categorized_files = {}

        # Initialize categories
        for category in self.categorization_rules.keys():
            categorized_files[category] = []

        categorized_files["uncategorized"] = []

        # Scan root directory for loose files
        for item in self.workspace_path.iterdir():
            if self.should_exclude_file(item):
                continue

            if item.is_file():
                file_info = self.get_file_info(item)
                category = self.categorize_file(item)

                file_info["category"] = category
                file_info["target_directory"] = self.categorization_rules.get(category, {}).get("target_dir", "uncategorized")

                loose_files.append(file_info)
                categorized_files[category].append(file_info)

                logger.debug(f"Categorized {item.name} as {category}")

        # Generate audit statistics
        total_files = len(loose_files)
        total_size = sum(f.get("size_bytes", 0) for f in loose_files)

        audit_stats = {
            "total_loose_files": total_files,
            "total_size_bytes": total_size,
            "total_size_human": self._format_file_size(total_size),
            "categories": {}
        }

        for category, files in categorized_files.items():
            if files:  # Only include non-empty categories
                category_size = sum(f.get("size_bytes", 0) for f in files)
                audit_stats["categories"][category] = {
                    "count": len(files),
                    "size_bytes": category_size,
                    "size_human": self._format_file_size(category_size),
                    "target_directory": self.categorization_rules.get(category, {}).get("target_dir", "unknown")
                }

        audit_results = {
            "metadata": {
                "audit_type": "loose_files_audit",
                "workspace_path": str(self.workspace_path),
                "audit_date": "2025-12-28",
                "version": "1.0"
            },
            "statistics": audit_stats,
            "files": loose_files,
            "categorized_files": categorized_files,
            "organization_plan": self._generate_organization_plan(categorized_files)
        }

        self.audit_results = audit_results
        logger.info(f"Audit complete. Found {total_files} loose files in root directory.")

        return audit_results

    def _generate_organization_plan(self, categorized_files: Dict[str, List]) -> Dict[str, Any]:
        """Generate a plan for organizing loose files"""
        organization_plan = {
            "actions_required": [],
            "directories_to_create": set(),
            "files_to_move": [],
            "risks_and_considerations": []
        }

        # Identify actions needed
        for category, files in categorized_files.items():
            if not files:
                continue

            target_dir = self.categorization_rules.get(category, {}).get("target_dir", "uncategorized")

            if target_dir != "uncategorized":
                organization_plan["directories_to_create"].add(target_dir)
                organization_plan["actions_required"].append(
                    f"Move {len(files)} {category} files to {target_dir}/ directory"
                )

                for file_info in files:
                    organization_plan["files_to_move"].append({
                        "source": file_info["relative_path"],
                        "destination": f"{target_dir}/{file_info['name']}",
                        "category": category
                    })

        organization_plan["directories_to_create"] = list(organization_plan["directories_to_create"])

        # Add risks and considerations
        if categorized_files.get("scripts"):
            organization_plan["risks_and_considerations"].append(
                "Scripts may contain hardcoded paths that need updating after move"
            )

        if categorized_files.get("configuration"):
            organization_plan["risks_and_considerations"].append(
                "Configuration files may reference relative paths that need adjustment"
            )

        if categorized_files.get("uncategorized"):
            uncategorized_count = len(categorized_files["uncategorized"])
            organization_plan["risks_and_considerations"].append(
                f"{uncategorized_count} files could not be automatically categorized - manual review required"
            )

        return organization_plan

    def save_audit_report(self, output_path: Path) -> None:
        """Save audit results to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.audit_results, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Loose files audit saved to {output_path}")

def main():
    workspace_path = "/Users/daniellynch/Developer"

    auditor = LooseFilesAuditor(workspace_path)
    audit_results = auditor.audit_loose_files()

    output_path = Path(workspace_path) / "docs" / "audit" / "loose-files-audit.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    auditor.save_audit_report(output_path)

    # Print summary
    stats = audit_results["statistics"]

    print("\n=== LOOSE FILES AUDIT ===")
    print(f"Total loose files in root: {stats['total_loose_files']}")
    print(f"Total size: {stats['total_size_human']}")

    print("\nFiles by category:")
    for category, cat_stats in stats["categories"].items():
        print(f"  {category}: {cat_stats['count']} files ({cat_stats['size_human']}) → {cat_stats['target_directory']}/")

    organization = audit_results["organization_plan"]
    print(f"\nOrganization Plan:")
    print(f"  Directories to create: {len(organization['directories_to_create'])}")
    print(f"  Files to move: {len(organization['files_to_move'])}")

    if organization["actions_required"]:
        print(f"\nActions Required:")
        for action in organization["actions_required"]:
            print(f"  • {action}")

    if organization["risks_and_considerations"]:
        print(f"\nRisks & Considerations:")
        for risk in organization["risks_and_considerations"]:
            print(f"  ⚠️  {risk}")

    print(f"\nDetailed audit saved to: {output_path}")

if __name__ == "__main__":
    main()