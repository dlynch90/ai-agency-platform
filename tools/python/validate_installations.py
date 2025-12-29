#!/usr/bin/env python3
"""
Vendor-Compliant Installation Validation using ML Pipelines
Validates all installations and organization with TDD and ML approaches
"""

import sys
import os
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import mlflow
import mlflow.sklearn

class InstallationValidator:
    def __init__(self):
        self.results = {}
        self.venv_path = Path.home() / "Developer" / ".venv"
        self.project_root = Path("/Users/daniellynch/Developer")

    def validate_python_venv(self) -> Dict[str, Any]:
        """Validate Python virtual environment and ML libraries"""
        result = {"status": "unknown", "libraries": {}, "errors": []}

        try:
            # Check if venv exists
            if not self.venv_path.exists():
                result["errors"].append("Virtual environment not found")
                return result

            # Test ML libraries
            libraries = [
                "scikit-learn", "pandas", "numpy", "matplotlib",
                "seaborn", "optuna", "mlflow"
            ]

            for lib in libraries:
                try:
                    if lib == "scikit-learn":
                        __import__("sklearn")
                    else:
                        __import__(lib.replace("-", "_"))
                    result["libraries"][lib] = "installed"
                except ImportError as e:
                    result["libraries"][lib] = f"missing: {e}"
                    result["errors"].append(f"Library {lib} not available")

            result["status"] = "success" if not result["errors"] else "partial"

        except Exception as e:
            result["status"] = "error"
            result["errors"].append(str(e))

        return result

    def validate_vendor_tools(self) -> Dict[str, Any]:
        """Validate vendor tool installations"""
        result = {"status": "unknown", "tools": {}, "errors": []}

        tools = {
            "chezmoi": ["chezmoi", "--version"],
            "1password": ["op", "--version"],
            "ollama": ["ollama", "--version"],
            "adr-tools": ["adr", "--version"],
            "winston": ["node", "-e", "require('winston')"],
            "starship": ["starship", "--version"],
            "oh-my-zsh": ["zsh", "--version"]
        }

        for tool_name, cmd in tools.items():
            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                result["tools"][tool_name] = "installed"
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                result["tools"][tool_name] = f"missing: {e}"
                result["errors"].append(f"Tool {tool_name} not available")

        result["status"] = "success" if not result["errors"] else "partial"
        return result

    def validate_adr_structure(self) -> Dict[str, Any]:
        """Validate ADR structure and records"""
        result = {"status": "unknown", "adr_files": [], "errors": []}

        adr_dir = self.project_root / "docs" / "adr"

        if not adr_dir.exists():
            result["errors"].append("ADR directory not found")
            return result

        adr_files = list(adr_dir.glob("*.md"))
        result["adr_files"] = [f.name for f in adr_files]

        if len(adr_files) < 5:
            result["errors"].append(f"Expected at least 5 ADR files, found {len(adr_files)}")

        result["status"] = "success" if not result["errors"] else "partial"
        return result

    def validate_chezmoi_config(self) -> Dict[str, Any]:
        """Validate Chezmoi configuration"""
        result = {"status": "unknown", "config": {}, "errors": []}

        chezmoi_config = self.project_root / ".chezmoi.toml"

        if not chezmoi_config.exists():
            result["errors"].append("Chezmoi config not found")
            return result

        try:
            # Basic validation - config exists and is readable
            with open(chezmoi_config, 'r') as f:
                content = f.read()
                if "[data]" in content and "log_path" in content:
                    result["config"]["valid_structure"] = True
                else:
                    result["errors"].append("Chezmoi config missing expected structure")

        except Exception as e:
            result["errors"].append(f"Error reading Chezmoi config: {e}")

        result["status"] = "success" if not result["errors"] else "partial"
        return result

    def run_ml_validation(self) -> Dict[str, Any]:
        """Run ML-based validation using installed libraries"""
        result = {"status": "unknown", "metrics": {}, "errors": []}

        try:
            # Create sample dataset for validation
            np.random.seed(42)
            data = {
                'feature1': np.random.randn(100),
                'feature2': np.random.randn(100),
                'target': np.random.randint(0, 2, 100)
            }
            df = pd.DataFrame(data)

            # Train simple model
            X = df[['feature1', 'feature2']]
            y = df['target']
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

            model = RandomForestClassifier(n_estimators=10, random_state=42)
            model.fit(X_train, y_train)

            # Evaluate
            y_pred = model.predict(X_test)
            report = classification_report(y_test, y_pred, output_dict=True)

            result["metrics"] = {
                "accuracy": report['accuracy'],
                "precision": report['weighted avg']['precision'],
                "recall": report['weighted avg']['recall']
            }

            # Log with MLflow
            with mlflow.start_run():
                mlflow.log_metric("accuracy", result["metrics"]["accuracy"])
                mlflow.log_metric("precision", result["metrics"]["precision"])
                mlflow.sklearn.log_model(model, "model")

            result["status"] = "success"

        except Exception as e:
            result["status"] = "error"
            result["errors"].append(f"ML validation failed: {e}")

        return result

    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        report = {
            "timestamp": pd.Timestamp.now().isoformat(),
            "validations": {
                "python_venv": self.validate_python_venv(),
                "vendor_tools": self.validate_vendor_tools(),
                "adr_structure": self.validate_adr_structure(),
                "chezmoi_config": self.validate_chezmoi_config(),
                "ml_validation": self.run_ml_validation()
            }
        }

        # Calculate overall status
        statuses = [v["status"] for v in report["validations"].values()]
        if all(s == "success" for s in statuses):
            report["overall_status"] = "SUCCESS"
        elif any(s == "error" for s in statuses):
            report["overall_status"] = "ERROR"
        else:
            report["overall_status"] = "PARTIAL"

        return report

def main():
    validator = InstallationValidator()
    report = validator.generate_report()

    # Print report
    print(json.dumps(report, indent=2, default=str))

    # Save report
    report_path = Path("/Users/daniellynch/Developer/installation_validation_report.json")
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    # Exit with appropriate code
    if report["overall_status"] == "SUCCESS":
        print("\n🎉 All validations passed!")
        sys.exit(0)
    elif report["overall_status"] == "PARTIAL":
        print("\n⚠️  Some validations passed with warnings")
        sys.exit(1)
    else:
        print("\n❌ Validation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()