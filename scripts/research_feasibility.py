#!/usr/bin/env python3
"""
FEA Research Feasibility Script
Evaluates the feasibility and readiness of the Pixi FEA environment
"""

import sys
import importlib
import subprocess
import time
from pathlib import Path
import json

class FEAFeasibilityChecker:
    """Comprehensive feasibility checker for FEA environment"""

    def __init__(self):
        self.results = {}
        self.project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")

    def check_python_packages(self):
        """Check availability of Python scientific packages"""
        print("🔬 Checking Python scientific packages...")

        packages = [
            ('numpy', 'Numerical computing'),
            ('scipy', 'Scientific computing'),
            ('matplotlib', 'Plotting and visualization'),
            ('pandas', 'Data analysis'),
            ('sympy', 'Symbolic mathematics'),
            ('scikit-learn', 'Machine learning'),
            ('pyvista', '3D visualization'),
            ('pymatgen', 'Materials science'),
            ('ase', 'Atomic simulation'),
            ('pyomo', 'Optimization'),
            ('nlopt', 'Nonlinear optimization'),
            ('openmdao', 'Multidisciplinary optimization'),
        ]

        results = {}
        for package, description in packages:
            try:
                importlib.import_module(package)
                results[package] = {'status': 'available', 'description': description}
                print(f"  ✅ {package}: {description}")
            except ImportError:
                results[package] = {'status': 'missing', 'description': description}
                print(f"  ❌ {package}: {description} - MISSING")

        self.results['python_packages'] = results
        return results

    def check_fea_libraries(self):
        """Check FEA-specific libraries"""
        print("\n🏗️ Checking FEA libraries...")

        fea_packages = [
            ('fenics', 'Finite element library (FEniCS)'),
            ('dolfin', 'FEniCS core library'),
            ('mshr', 'FEniCS mesh generation'),
            ('dealii', 'C++ finite element library'),
            ('mfem', 'Lightweight FEM library'),
            ('libmesh', 'C++ FEM framework'),
            ('gmsh', '3D mesh generator'),
            ('tetgen', 'Tetrahedral mesh generator'),
            ('netgen', 'Automatic mesh generator'),
        ]

        results = {}
        for package, description in fea_packages:
            try:
                importlib.import_module(package)
                results[package] = {'status': 'available', 'description': description}
                print(f"  ✅ {package}: {description}")
            except ImportError:
                results[package] = {'status': 'missing', 'description': description}
                print(f"  ⚠️ {package}: {description} - MISSING")

        self.results['fea_libraries'] = results
        return results

    def check_command_line_tools(self):
        """Check availability of command-line FEA tools"""
        print("\n🛠️ Checking command-line FEA tools...")

        tools = [
            ('gmsh', '3D finite element mesh generator'),
            ('calculix', '3D finite element structural analysis'),
            ('code-aster', 'Finite element solver'),
            ('getfem', 'Generic finite element library'),
            ('mfront', 'Material knowledge management'),
        ]

        results = {}
        for tool, description in tools:
            try:
                result = subprocess.run([tool, '--version'],
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    version = result.stdout.strip().split('\n')[0]
                    results[tool] = {'status': 'available', 'version': version, 'description': description}
                    print(f"  ✅ {tool}: {description} - {version}")
                else:
                    results[tool] = {'status': 'error', 'description': description}
                    print(f"  ❌ {tool}: {description} - ERROR")
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                results[tool] = {'status': 'missing', 'description': description}
                print(f"  ⚠️ {tool}: {description} - MISSING")

        self.results['command_line_tools'] = results
        return results

    def check_mcp_servers(self):
        """Check MCP server availability"""
        print("\n🔗 Checking MCP servers...")

        mcp_servers = [
            ('@modelcontextprotocol/server-sequential-thinking', 'Structured analysis'),
            ('@modelcontextprotocol/server-ollama', 'Local AI models'),
            ('@modelcontextprotocol/server-filesystem', 'File operations'),
            ('@modelcontextprotocol/server-git', 'Version control'),
            ('@modelcontextprotocol/server-brave-search', 'Web search'),
            ('@modelcontextprotocol/server-github', 'Code exploration'),
            ('@modelcontextprotocol/server-task-master', 'Project management'),
            ('@modelcontextprotocol/server-neo4j', 'Graph database'),
            ('@modelcontextprotocol/server-qdrant', 'Vector search'),
        ]

        results = {}
        for server, description in mcp_servers:
            try:
                # Check if npm package exists
                result = subprocess.run(['npm', 'list', '-g', server],
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0 and server in result.stdout:
                    results[server] = {'status': 'available', 'description': description}
                    print(f"  ✅ {server}: {description}")
                else:
                    results[server] = {'status': 'missing', 'description': description}
                    print(f"  ⚠️ {server}: {description} - MISSING")
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
                results[server] = {'status': 'error', 'description': description}
                print(f"  ❌ {server}: {description} - ERROR")

        self.results['mcp_servers'] = results
        return results

    def check_services(self):
        """Check database and service availability"""
        print("\n🗄️ Checking services...")

        services = [
            ('neo4j', 7687, 'Graph database'),
            ('qdrant', 6333, 'Vector database'),
            ('redis', 6379, 'Cache database'),
            ('postgres', 5432, 'Relational database'),
            ('elasticsearch', 9200, 'Search engine'),
            ('ollama', 11434, 'AI model server'),
        ]

        results = {}
        for service, port, description in services:
            import socket
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(('localhost', port))
                sock.close()

                if result == 0:
                    results[service] = {'status': 'running', 'port': port, 'description': description}
                    print(f"  ✅ {service}: {description} (port {port}) - RUNNING")
                else:
                    results[service] = {'status': 'stopped', 'port': port, 'description': description}
                    print(f"  ⚠️ {service}: {description} (port {port}) - STOPPED")
            except:
                results[service] = {'status': 'error', 'port': port, 'description': description}
                print(f"  ❌ {service}: {description} (port {port}) - ERROR")

        self.results['services'] = results
        return results

    def check_pixi_environment(self):
        """Check Pixi environment configuration"""
        print("\n📦 Checking Pixi environment...")

        results = {}

        # Check if pixi is available
        try:
            result = subprocess.run(['pixi', '--version'],
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                version = result.stdout.strip()
                results['pixi'] = {'status': 'available', 'version': version}
                print(f"  ✅ Pixi: {version}")
            else:
                results['pixi'] = {'status': 'error'}
                print("  ❌ Pixi: ERROR")
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            results['pixi'] = {'status': 'missing'}
            print("  ⚠️ Pixi: MISSING")

        # Check pixi.toml
        pixi_toml = self.project_root / 'pixi.toml'
        if pixi_toml.exists():
            results['pixi_toml'] = {'status': 'present', 'path': str(pixi_toml)}
            print(f"  ✅ pixi.toml: {pixi_toml}")
        else:
            results['pixi_toml'] = {'status': 'missing'}
            print("  ⚠️ pixi.toml: MISSING")

        self.results['pixi_environment'] = results
        return results

    def run_performance_test(self):
        """Run basic performance test"""
        print("\n⚡ Running performance test...")

        results = {}

        # Test numpy performance
        try:
            start_time = time.time()
            import numpy as np
            a = np.random.random((1000, 1000))
            b = np.random.random((1000, 1000))
            c = np.dot(a, b)
            end_time = time.time()

            results['numpy_matrix_mult'] = {
                'status': 'completed',
                'time': end_time - start_time,
                'description': f'1000x1000 matrix multiplication'
            }
            print(f"  ✅ NumPy performance test: {end_time - start_time:.4f}s")
        except ImportError:
            results['numpy_matrix_mult'] = {'status': 'skipped', 'reason': 'numpy not available'}
            print("  ⚠️ NumPy performance test: SKIPPED")

        # Test scipy solve
        try:
            start_time = time.time()
            import scipy.linalg
            A = np.random.random((500, 500))
            b = np.random.random(500)
            x = scipy.linalg.solve(A, b)
            end_time = time.time()

            results['scipy_solve'] = {
                'status': 'completed',
                'time': end_time - start_time,
                'description': '500x500 linear system solve'
            }
            print(".4f"        except (ImportError, np.linalg.LinAlgError):
            results['scipy_solve'] = {'status': 'skipped', 'reason': 'scipy not available'}
            print("  ⚠️ SciPy performance test: SKIPPED")

        self.results['performance_tests'] = results
        return results

    def generate_report(self):
        """Generate comprehensive feasibility report"""
        print("\n📊 Generating feasibility report...")

        report = {
            'timestamp': time.time(),
            'summary': {},
            'recommendations': [],
            'critical_issues': []
        }

        # Calculate summary statistics
        total_checks = 0
        available_count = 0

        for category, items in self.results.items():
            for item, details in items.items():
                total_checks += 1
                if details.get('status') in ['available', 'running', 'present', 'completed']:
                    available_count += 1

        availability_percentage = (available_count / total_checks) * 100 if total_checks > 0 else 0

        report['summary'] = {
            'total_checks': total_checks,
            'available_count': available_count,
            'availability_percentage': availability_percentage,
            'feasibility_score': 'HIGH' if availability_percentage >= 80 else 'MEDIUM' if availability_percentage >= 60 else 'LOW'
        }

        # Generate recommendations
        if availability_percentage < 80:
            report['recommendations'].append("Install missing Python packages using: pixi add <package>")
            report['recommendations'].append("Set up missing services using: docker-compose up -d")
            report['recommendations'].append("Install MCP servers using: npm install -g @modelcontextprotocol/server-*")

        if not self.results.get('pixi_environment', {}).get('pixi', {}).get('status') == 'available':
            report['critical_issues'].append("Pixi package manager is not available")
            report['recommendations'].append("Install Pixi: curl -fsSL https://pixi.sh/install.sh | bash")

        # Save report
        report_path = self.project_root / 'docs' / 'reports' / 'fea_feasibility_report.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)

        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print("  ✅ Report saved to: docs/reports/fea_feasibility_report.json"
        return report

    def run_complete_check(self):
        """Run all feasibility checks"""
        print("🚀 Starting FEA Environment Feasibility Check")
        print("=" * 60)

        checks = [
            self.check_pixi_environment,
            self.check_python_packages,
            self.check_fea_libraries,
            self.check_command_line_tools,
            self.check_mcp_servers,
            self.check_services,
            self.run_performance_test,
        ]

        for check in checks:
            try:
                check()
            except Exception as e:
                print(f"❌ Error in {check.__name__}: {e}")

        report = self.generate_report()

        print("\n" + "=" * 60)
        print("🎯 FEASIBILITY CHECK COMPLETE")
        print(f"📊 Availability: {report['summary']['availability_percentage']:.1f}%")
        print(f"🎖️ Feasibility: {report['summary']['feasibility_score']}")

        if report['critical_issues']:
            print("\n🚨 CRITICAL ISSUES:")
            for issue in report['critical_issues']:
                print(f"  • {issue}")

        if report['recommendations']:
            print("\n💡 RECOMMENDATIONS:")
            for rec in report['recommendations']:
                print(f"  • {rec}")

        return report

if __name__ == "__main__":
    checker = FEAFeasibilityChecker()
    checker.run_complete_check()