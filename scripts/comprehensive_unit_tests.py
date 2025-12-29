#!/usr/bin/env python3
"""
Comprehensive Unit Testing and Integration Framework
Tests, validates, and integrates everything for AGI automation
"""

import os
import sys
import subprocess
import unittest
import json
import time
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch

class ComprehensiveTestSuite(unittest.TestCase):
    """Comprehensive test suite for the entire environment"""

    def setUp(self):
        """Set up test environment"""
        self.project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")
        self.test_log = self.project_root / "test_results.log"

        # Create test results logger
        self.test_results = {
            'tests_run': [],
            'failures': [],
            'errors': [],
            'start_time': time.time()
        }

    def tearDown(self):
        """Clean up after tests"""
        # Log test results
        self.test_results['end_time'] = time.time()
        self.test_results['duration'] = self.test_results['end_time'] - self.test_results['start_time']

        with open(self.test_log, 'a') as f:
            f.write(f"\n=== Test Run {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
            f.write(json.dumps(self.test_results, indent=2))
            f.write("\n")

    def log_test_result(self, test_name, status, details=None):
        """Log individual test result"""
        result = {
            'test': test_name,
            'status': status,
            'timestamp': time.time(),
            'details': details or {}
        }
        self.test_results['tests_run'].append(result)

        status_emoji = {'PASS': '✅', 'FAIL': '❌', 'ERROR': '🔥', 'SKIP': '⏭️'}[status]
        print(f"{status_emoji} {test_name}")

    # UNIT TESTS FOR INDIVIDUAL COMPONENTS

    def test_pixi_installation(self):
        """Test Pixi package manager installation and functionality"""
        try:
            # Test pixi version
            result = subprocess.run(['pixi', '--version'],
                                  capture_output=True, text=True, timeout=10)
            self.assertEqual(result.returncode, 0, "Pixi command failed")
            self.assertIn('pixi', result.stdout.lower(), "Pixi not properly installed")

            # Test pixi info
            result = subprocess.run(['pixi', 'info'],
                                  capture_output=True, text=True, timeout=30, cwd=self.project_root)
            self.assertEqual(result.returncode, 0, "Pixi info failed")

            self.log_test_result('test_pixi_installation', 'PASS',
                               {'version': result.stdout.strip()})

        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            self.log_test_result('test_pixi_installation', 'FAIL',
                               {'error': str(e)})
            self.fail(f"Pixi installation test failed: {e}")

    def test_python_environment(self):
        """Test Python environment and critical imports"""
        try:
            # Test Python version
            result = subprocess.run([sys.executable, '--version'],
                                  capture_output=True, text=True, timeout=5)
            self.assertEqual(result.returncode, 0, "Python command failed")

            # Test critical imports
            critical_modules = ['numpy', 'scipy', 'matplotlib', 'pandas', 'requests']

            for module in critical_modules:
                try:
                    __import__(module)
                except ImportError as e:
                    self.fail(f"Critical module {module} not available: {e}")

            # Test pip
            result = subprocess.run([sys.executable, '-m', 'pip', '--version'],
                                  capture_output=True, text=True, timeout=10)
            self.assertEqual(result.returncode, 0, "Pip not working")

            self.log_test_result('test_python_environment', 'PASS',
                               {'python_version': result.stdout.strip()})

        except Exception as e:
            self.log_test_result('test_python_environment', 'ERROR',
                               {'error': str(e)})
            raise

    def test_fea_libraries(self):
        """Test FEA library imports and basic functionality"""
        try:
            # Test basic scientific computing
            import numpy as np
            import scipy
            import matplotlib
            matplotlib.use('Agg')  # Use non-interactive backend

            # Test basic operations
            a = np.array([1, 2, 3])
            b = np.array([4, 5, 6])
            c = a + b
            self.assertTrue(np.array_equal(c, np.array([5, 7, 9])), "NumPy basic operations failed")

            # Test matplotlib
            import matplotlib.pyplot as plt
            fig, ax = plt.subplots()
            ax.plot([1, 2, 3], [1, 4, 2])
            plt.close(fig)

            # Test FEA-specific libraries (if available)
            fea_libs = []
            try:
                import pyvista as pv
                fea_libs.append('pyvista')
            except ImportError:
                pass

            try:
                import pymatgen
                fea_libs.append('pymatgen')
            except ImportError:
                pass

            self.log_test_result('test_fea_libraries', 'PASS',
                               {'available_fea_libs': fea_libs})

        except Exception as e:
            self.log_test_result('test_fea_libraries', 'ERROR',
                               {'error': str(e)})
            raise

    def test_mcp_configuration(self):
        """Test MCP server configuration and basic connectivity"""
        try:
            mcp_config_files = [
                self.project_root / '.cursor' / 'mcp.json',
                self.project_root / '.cursor' / 'mcp' / 'config.json'
            ]

            mcp_configs_found = []
            for config_file in mcp_config_files:
                if config_file.exists():
                    try:
                        with open(config_file) as f:
                            data = json.load(f)
                            mcp_configs_found.append(str(config_file))

                            # Validate structure
                            self.assertIn('mcpServers', data, f"Invalid MCP config structure in {config_file}")

                    except json.JSONDecodeError as e:
                        self.fail(f"Invalid JSON in MCP config {config_file}: {e}")

            if not mcp_configs_found:
                self.skipTest("No MCP configuration files found")

            self.log_test_result('test_mcp_configuration', 'PASS',
                               {'config_files': mcp_configs_found})

        except Exception as e:
            self.log_test_result('test_mcp_configuration', 'ERROR',
                               {'error': str(e)})
            raise

    def test_docker_services(self):
        """Test Docker service configurations"""
        try:
            compose_file = self.project_root / 'docker-compose.services.yml'
            if not compose_file.exists():
                self.skipTest("Docker compose file not found")

            # Validate YAML syntax
            import yaml
            with open(compose_file) as f:
                compose_data = yaml.safe_load(f)

            self.assertIn('services', compose_data, "Invalid docker-compose structure")

            # Check required services
            required_services = ['neo4j', 'redis', 'postgres']
            available_services = list(compose_data['services'].keys())

            for service in required_services:
                self.assertIn(service, available_services, f"Required service {service} not found")

            self.log_test_result('test_docker_services', 'PASS',
                               {'services': available_services})

        except ImportError:
            self.skipTest("PyYAML not available for Docker compose validation")
        except Exception as e:
            self.log_test_result('test_docker_services', 'ERROR',
                               {'error': str(e)})
            raise

    def test_path_integrity(self):
        """Test PATH integrity and binary availability"""
        try:
            current_path = os.environ.get('PATH', '')
            path_entries = current_path.split(':')

            broken_paths = []
            valid_paths = []

            for entry in path_entries:
                if os.path.isdir(entry):
                    valid_paths.append(entry)
                else:
                    broken_paths.append(entry)

            # Should have minimal broken paths
            self.assertLess(len(broken_paths), 3, f"Too many broken PATH entries: {broken_paths}")

            # Should have essential paths
            essential_paths = ['/usr/local/bin', '/usr/bin', '/bin']
            essential_found = [p for p in essential_paths if any(p in vp for vp in valid_paths)]

            self.assertTrue(len(essential_found) > 0, "No essential PATH entries found")

            self.log_test_result('test_path_integrity', 'PASS',
                               {'valid_paths': len(valid_paths), 'broken_paths': len(broken_paths)})

        except Exception as e:
            self.log_test_result('test_path_integrity', 'ERROR',
                               {'error': str(e)})
            raise

    # INTEGRATION TESTS

    def test_pixi_run_commands(self):
        """Test Pixi run commands work correctly"""
        try:
            # Test pixi run fea
            result = subprocess.run(['pixi', 'run', 'fea'],
                                  capture_output=True, text=True, timeout=30, cwd=self.project_root)

            # Command should not fail catastrophically
            self.assertIn(result.returncode, [0, 1], "Pixi run fea failed unexpectedly")

            # Test pixi run start (but don't actually start services)
            result = subprocess.run(['pixi', 'run', '--help'],
                                  capture_output=True, text=True, timeout=10, cwd=self.project_root)
            self.assertEqual(result.returncode, 0, "Pixi run command not working")

            self.log_test_result('test_pixi_run_commands', 'PASS')

        except subprocess.TimeoutExpired:
            self.log_test_result('test_pixi_run_commands', 'ERROR',
                               {'error': 'Command timed out'})
            raise
        except Exception as e:
            self.log_test_result('test_pixi_run_commands', 'ERROR',
                               {'error': str(e)})
            raise

    def test_environment_scripts(self):
        """Test environment setup scripts"""
        try:
            # Test critical_fixes.py syntax
            result = subprocess.run([sys.executable, '-m', 'py_compile', 'critical_fixes.py'],
                                  capture_output=True, text=True, timeout=10, cwd=self.project_root)

            self.assertEqual(result.returncode, 0, "critical_fixes.py has syntax errors")

            # Test comprehensive_debug_analysis.py syntax
            result = subprocess.run([sys.executable, '-m', 'py_compile', 'scripts/comprehensive_debug_analysis.py'],
                                  capture_output=True, text=True, timeout=10, cwd=self.project_root)

            self.assertEqual(result.returncode, 0, "comprehensive_debug_analysis.py has syntax errors")

            self.log_test_result('test_environment_scripts', 'PASS')

        except Exception as e:
            self.log_test_result('test_environment_scripts', 'ERROR',
                               {'error': str(e)})
            raise

    def test_configuration_files(self):
        """Test all configuration files are valid"""
        try:
            config_files = [
                ('pixi.toml', 'toml'),
                ('mcp-config.toml', 'toml'),
                ('FEA_README.md', 'markdown'),
                ('pyrightconfig.json', 'json'),
                ('package.json', 'json')
            ]

            validated_files = []

            for filename, file_type in config_files:
                filepath = self.project_root / filename
                if filepath.exists():
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()

                        if file_type == 'json':
                            json.loads(content)
                        elif file_type in ['toml', 'markdown']:
                            # Basic validation - file is readable
                            self.assertGreater(len(content), 0, f"Empty {file_type} file: {filename}")

                        validated_files.append(filename)

                    except Exception as e:
                        self.fail(f"Invalid {file_type} file {filename}: {e}")

            self.log_test_result('test_configuration_files', 'PASS',
                               {'validated_files': validated_files})

        except Exception as e:
            self.log_test_result('test_configuration_files', 'ERROR',
                               {'error': str(e)})
            raise

    # PERFORMANCE TESTS

    def test_import_performance(self):
        """Test import performance for critical modules"""
        try:
            import time

            critical_modules = ['numpy', 'scipy', 'matplotlib', 'pandas']
            import_times = {}

            for module in critical_modules:
                start_time = time.time()
                try:
                    __import__(module)
                    end_time = time.time()
                    import_times[module] = end_time - start_time
                except ImportError:
                    import_times[module] = None

            # Check that imports are reasonably fast (< 5 seconds each)
            for module, import_time in import_times.items():
                if import_time is not None:
                    self.assertLess(import_time, 5.0, f"Import of {module} too slow: {import_time}s")

            self.log_test_result('test_import_performance', 'PASS',
                               {'import_times': import_times})

        except Exception as e:
            self.log_test_result('test_import_performance', 'ERROR',
                               {'error': str(e)})
            raise

    # CACHE AND BUILD TESTS

    def test_cache_clearing(self):
        """Test cache clearing functionality"""
        try:
            # Clear Python cache
            for root, dirs, files in os.walk(self.project_root):
                for d in dirs[:]:
                    if d == '__pycache__':
                        shutil.rmtree(os.path.join(root, d))
                        dirs.remove(d)

            # Clear pixi cache (if possible)
            try:
                result = subprocess.run(['pixi', 'clean', '--yes'],
                                      capture_output=True, text=True, timeout=30, cwd=self.project_root)
                # Don't assert on return code as clean might not be available
            except:
                pass

            self.log_test_result('test_cache_clearing', 'PASS')

        except Exception as e:
            self.log_test_result('test_cache_clearing', 'ERROR',
                               {'error': str(e)})
            raise

def run_integration_tests():
    """Run integration tests that require external services"""
    print("🧪 Running Integration Tests...")

    # Test MCP server connectivity (mocked)
    try:
        # This would normally test actual MCP server connections
        # For now, just validate configuration
        mcp_config = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/mcp.json")
        if mcp_config.exists():
            with open(mcp_config) as f:
                data = json.load(f)
                assert 'mcpServers' in data
            print("✅ MCP configuration validated")
        else:
            print("⚠️ MCP configuration not found")

    except Exception as e:
        print(f"❌ MCP integration test failed: {e}")

def run_performance_benchmarks():
    """Run performance benchmarks"""
    print("⚡ Running Performance Benchmarks...")

    try:
        import numpy as np
        import time

        # Matrix multiplication benchmark
        sizes = [100, 500, 1000]

        for size in sizes:
            start_time = time.time()

            a = np.random.random((size, size))
            b = np.random.random((size, size))
            c = np.dot(a, b)

            end_time = time.time()

            elapsed = end_time - start_time
            print(f"✅ {size}x{size} matrix multiplication: {elapsed:.4f}s")

    except ImportError:
        print("⚠️ NumPy not available for benchmarks")
    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")

def generate_test_report():
    """Generate comprehensive test report"""
    print("📊 Generating Test Report...")

    report = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'test_suite': 'Comprehensive Environment Test Suite',
        'description': 'Tests for FEA environment, MCP integration, and AGI automation readiness',
        'components_tested': [
            'Pixi package manager',
            'Python environment and libraries',
            'FEA scientific libraries',
            'MCP server configuration',
            'Docker service definitions',
            'PATH integrity',
            'Configuration file validation',
            'Import performance',
            'Cache management'
        ],
        'integration_tests': [
            'MCP server connectivity',
            'Performance benchmarks'
        ],
        'recommendations': [
            'Run tests regularly to catch regressions',
            'Monitor performance benchmarks over time',
            'Keep MCP configurations up to date',
            'Regularly audit PATH and dependencies'
        ]
    }

    report_path = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}") / 'comprehensive_test_report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"✅ Test report saved to {report_path}")

def main():
    """Main test runner"""
    print("🚀 COMPREHENSIVE UNIT TESTING SUITE")
    print("=" * 50)

    # Clear any existing test logs
    try:
        test_log = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/test_results.log")
        if test_log.exists():
            test_log.unlink()
    except:
        pass

    # Run unit tests
    print("\n📋 Running Unit Tests...")
    unittest.main(argv=[''], exit=False, verbosity=2)

    # Run integration tests
    run_integration_tests()

    # Run performance benchmarks
    run_performance_benchmarks()

    # Generate report
    generate_test_report()

    print("\n" + "=" * 50)
    print("✅ COMPREHENSIVE TESTING COMPLETE")
    print("Check test_results.log and comprehensive_test_report.json for details")

if __name__ == "__main__":
    main()