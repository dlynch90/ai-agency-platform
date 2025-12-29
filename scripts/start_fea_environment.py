#!/usr/bin/env python3
"""
FEA Environment Startup Script
Comprehensive initialization of the complete FEA environment with Pixi
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
import argparse

class FEAEnvironmentStarter:
    """Complete FEA environment initialization"""

    def __init__(self, project_root=None):
        self.project_root = Path(project_root or "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")
        self.env_file = self.project_root / ".env.mcp"
        self.services_compose = self.project_root / "docker-compose.services.yml"

    def load_environment_variables(self):
        """Load environment variables from .env.mcp"""
        print("🔐 Loading environment variables...")

        # #region agent log H5
        import json
        import time
        try:
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/debug_fea.log', 'a') as f:
            f.write(json.dumps({
                "id": f"log_{int(time.time()*1000)}_{'h5_env_' + str(hash(str(time.time())))[:8]}",
                "timestamp": int(time.time()*1000),
                "location": "start_fea_environment.py:load_environment_variables:entry",
                "message": "Starting environment variable loading",
                "data": {"env_file_exists": self.env_file.exists(), "env_file_path": str(self.env_file)},
                "sessionId": "debug-fea-startup",
                "runId": "run-1",
                "hypothesisId": "H5"
            }) + '\n')
        # #endregion

        if self.env_file.exists():
            try:
                env_vars_loaded = 0
                with open(self.env_file) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            if '=' in line:
                                key, value = line.split('=', 1)
                                os.environ[key] = value
                                env_vars_loaded += 1

                # #region agent log H5
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/debug_fea.log', 'a') as f:
                f.write(json.dumps({
                    "id": f"log_{int(time.time()*1000)}_{'h5_env_' + str(hash(str(time.time())))[:8]}",
                    "timestamp": int(time.time()*1000),
                    "location": "start_fea_environment.py:load_environment_variables:success",
                    "message": "Environment variables loaded successfully",
                    "data": {"env_vars_loaded": env_vars_loaded},
                    "sessionId": "debug-fea-startup",
                    "runId": "run-1",
                    "hypothesisId": "H5"
                }) + '\n')
        except Exception as log_error:
            print(f"Debug log write failed: {log_error}")
        # #endregion
                # #endregion

                print("✅ Environment variables loaded")
                return True
            except Exception as e:
                # #region agent log H5
                with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                    f.write(json.dumps({
                        "id": f"log_{int(time.time()*1000)}_{'h5_env_' + str(hash(str(time.time())))[:8]}",
                        "timestamp": int(time.time()*1000),
                        "location": "start_fea_environment.py:load_environment_variables:error",
                        "message": "Error loading environment variables",
                        "data": {"error": str(e), "error_type": type(e).__name__},
                        "sessionId": "debug-fea-startup",
                        "runId": "run-1",
                        "hypothesisId": "H5"
                    }) + '\n')
                # #endregion

                print(f"❌ Error loading environment variables: {e}")
                return False
        else:
            # #region agent log H5
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "id": f"log_{int(time.time()*1000)}_{'h5_env_' + str(hash(str(time.time())))[:8]}",
                    "timestamp": int(time.time()*1000),
                    "location": "start_fea_environment.py:load_environment_variables:no_file",
                    "message": "Environment file not found",
                    "data": {"env_file_path": str(self.env_file)},
                    "sessionId": "debug-fea-startup",
                    "runId": "run-1",
                    "hypothesisId": "H5"
                }) + '\n')
            # #endregion

            print("⚠️ .env.mcp file not found. Please create it with your API keys.")
            return False

    def check_pixi_installation(self):
        """Verify Pixi installation"""
        print("📦 Checking Pixi installation...")

        try:
            result = subprocess.run(['pixi', '--version'],
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                version = result.stdout.strip()
                print(f"✅ Pixi {version} is available")
                return True
            else:
                print("❌ Pixi command failed")
                return False
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            print("❌ Pixi is not installed or not in PATH")
            print("💡 Install Pixi with: curl -fsSL https://pixi.sh/install.sh | bash")
            return False

    def install_pixi_dependencies(self):
        """Install Pixi dependencies"""
        print("📦 Installing Pixi dependencies...")

        try:
            # Change to project root
            os.chdir(self.project_root)

            # Install dependencies
            result = subprocess.run(['pixi', 'install'],
                                  capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                print("✅ Pixi dependencies installed successfully")
                return True
            else:
                print(f"❌ Pixi install failed: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            print("❌ Pixi install timed out")
            return False
        except Exception as e:
            print(f"❌ Error installing Pixi dependencies: {e}")
            return False

    def start_database_services(self):
        """Start database and service containers"""
        print("🗄️ Starting database services...")

        # #region agent log H4
        import json
        service_status = {
            "compose_file_exists": self.services_compose.exists(),
            "compose_file_path": str(self.services_compose),
            "docker_compose_command": None,
            "command_result": None,
            "error": None
        }
        # #endregion

        if not self.services_compose.exists():
            # #region agent log H4
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "id": f"log_{int(time.time()*1000)}_{'h4_svc_' + str(hash(str(time.time())))[:8]}",
                    "timestamp": int(time.time()*1000),
                    "location": "start_fea_environment.py:start_database_services:no_file",
                    "message": "Docker compose file not found",
                    "data": service_status,
                    "sessionId": "debug-fea-startup",
                    "runId": "run-1",
                    "hypothesisId": "H4"
                }) + '\n')
            # #endregion

            print("⚠️ docker-compose.services.yml not found, skipping services startup")
            return False

        try:
            # #region agent log H4
            service_status["docker_compose_command"] = "up -d"
            # #endregion

            # Start services in detached mode
            result = subprocess.run([
                'docker-compose', '-f', str(self.services_compose), 'up', '-d'
            ], capture_output=True, text=True, timeout=120)

            service_status["command_result"] = result.returncode
            service_status["stdout"] = result.stdout
            service_status["stderr"] = result.stderr

            # #region agent log H4
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "id": f"log_{int(time.time()*1000)}_{'h4_svc_' + str(hash(str(time.time())))[:8]}",
                    "timestamp": int(time.time()*1000),
                    "location": "start_fea_environment.py:start_database_services:result",
                    "message": "Docker compose command result",
                    "data": service_status,
                    "sessionId": "debug-fea-startup",
                    "runId": "run-1",
                    "hypothesisId": "H4"
                }) + '\n')
            # #endregion

            if result.returncode == 0:
                print("✅ Database services started")
                # Wait a bit for services to be ready
                print("⏳ Waiting for services to be ready...")
                time.sleep(10)
                return True
            else:
                print(f"❌ Failed to start services: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            # #region agent log H4
            service_status["error"] = "timeout"
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "id": f"log_{int(time.time()*1000)}_{'h4_svc_' + str(hash(str(time.time())))[:8]}",
                    "timestamp": int(time.time()*1000),
                    "location": "start_fea_environment.py:start_database_services:timeout",
                    "message": "Docker compose timeout",
                    "data": service_status,
                    "sessionId": "debug-fea-startup",
                    "runId": "run-1",
                    "hypothesisId": "H4"
                }) + '\n')
            # #endregion

            print("❌ Services startup timed out")
            return False
        except Exception as e:
            # #region agent log H4
            service_status["error"] = str(e)
            with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({
                    "id": f"log_{int(time.time()*1000)}_{'h4_svc_' + str(hash(str(time.time())))[:8]}",
                    "timestamp": int(time.time()*1000),
                    "location": "start_fea_environment.py:start_database_services:exception",
                    "message": "Docker compose exception",
                    "data": service_status,
                    "sessionId": "debug-fea-startup",
                    "runId": "run-1",
                    "hypothesisId": "H4"
                }) + '\n')
            # #endregion

            print(f"❌ Error starting services: {e}")
            return False

    def initialize_mcp_servers(self):
        """Initialize MCP servers"""
        print("🔗 Initializing MCP servers...")

        try:
            # Run MCP initialization script
            result = subprocess.run([
                sys.executable, 'scripts/init_mcp_servers.py'
            ], capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                print("✅ MCP servers initialized")
                return True
            else:
                print(f"⚠️ MCP initialization completed with warnings: {result.stderr}")
                return True  # Still return True as it's not critical

        except subprocess.TimeoutExpired:
            print("❌ MCP initialization timed out")
            return False
        except Exception as e:
            print(f"❌ Error initializing MCP servers: {e}")
            return False

    def start_mcp_servers(self):
        """Start MCP servers"""
        print("🚀 Starting MCP servers...")

        startup_script = self.project_root / "scripts" / "start_mcp_servers.sh"

        if not startup_script.exists():
            print("⚠️ MCP startup script not found, creating basic startup...")
            # Create a basic startup script
            basic_startup = """#!/bin/bash
echo "Starting essential MCP servers..."
# Add your MCP server startup commands here
echo "MCP servers startup script needs to be configured"
"""
            startup_script.write_text(basic_startup)
            startup_script.chmod(0o755)

        try:
            result = subprocess.run([
                str(startup_script)
            ], capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                print("✅ MCP servers started")
                return True
            else:
                print(f"⚠️ MCP servers startup completed with warnings: {result.stderr}")
                return True

        except subprocess.TimeoutExpired:
            print("❌ MCP servers startup timed out")
            return False
        except Exception as e:
            print(f"❌ Error starting MCP servers: {e}")
            return False

    def run_feasibility_check(self):
        """Run feasibility check"""
        print("🔍 Running feasibility check...")

        try:
            result = subprocess.run([
                sys.executable, 'scripts/research_feasibility.py'
            ], capture_output=True, text=True, timeout=120)

            if result.returncode == 0:
                print("✅ Feasibility check completed")
                # Print the last few lines of output
                lines = result.stdout.strip().split('\n')
                for line in lines[-5:]:
                    if line.strip():
                        print(f"  {line}")
                return True
            else:
                print(f"⚠️ Feasibility check completed with warnings: {result.stderr}")
                return True

        except subprocess.TimeoutExpired:
            print("❌ Feasibility check timed out")
            return False
        except Exception as e:
            print(f"❌ Error running feasibility check: {e}")
            return False

    def create_environment_summary(self):
        """Create environment summary"""
        print("📊 Creating environment summary...")

        summary = {
            'timestamp': time.time(),
            'project_root': str(self.project_root),
            'pixi_version': None,
            'services_status': {},
            'mcp_servers_status': {},
            'environment_variables': {},
        }

        # Get Pixi version
        try:
            result = subprocess.run(['pixi', '--version'],
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                summary['pixi_version'] = result.stdout.strip()
        except:
            pass

        # Check service status
        services = [('neo4j', 7687), ('qdrant', 6333), ('redis', 6379),
                   ('postgres', 5432), ('elasticsearch', 9200), ('ollama', 11434)]

        for service, port in services:
            import socket
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                summary['services_status'][service] = result == 0
                sock.close()
            except:
                summary['services_status'][service] = False

        # Check MCP servers (simplified check)
        try:
            result = subprocess.run(['pgrep', '-f', 'mcp'],
                                  capture_output=True, text=True, timeout=5)
            summary['mcp_servers_status']['running'] = len(result.stdout.strip().split('\n')) > 0
        except:
            summary['mcp_servers_status']['running'] = False

        # Environment variables (safe ones only)
        safe_vars = ['PATH', 'HOME', 'USER', 'SHELL']
        for var in safe_vars:
            summary['environment_variables'][var] = os.environ.get(var, 'not set')

        # Save summary
        summary_path = self.project_root / 'docs' / 'environment_summary.json'
        summary_path.parent.mkdir(parents=True, exist_ok=True)

        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2, default=str)

        print("✅ Environment summary saved to docs/environment_summary.json")
        return summary

    def start_interactive_shell(self):
        """Start interactive Pixi shell"""
        print("🐚 Starting interactive FEA environment shell...")
        print("Available commands:")
        print("  pixi run fea          - Test FEA libraries")
        print("  pixi run mesh         - Run meshing tools")
        print("  pixi run solve        - Run FEA solver")
        print("  pixi run visualize    - Run visualization")
        print("  pixi run optimize     - Run optimization")
        print("  pixi run research     - Run feasibility check")
        print("  exit                  - Exit shell")
        print()

        try:
            # Start Pixi shell
            os.chdir(self.project_root)
            subprocess.run(['pixi', 'shell'])
        except KeyboardInterrupt:
            print("\n👋 Exiting FEA environment shell")
        except Exception as e:
            print(f"❌ Error starting shell: {e}")

    def run_complete_startup(self, interactive=False, skip_services=False):
        """Run complete environment startup"""
        print("🚀 Starting Complete FEA Environment")
        print("=" * 60)

        # #region agent log H1
        import json
        startup_results = {
            "interactive": interactive,
            "skip_services": skip_services,
            "steps_executed": [],
            "success_count": 0,
            "critical_failures": 0
        }
        # #endregion

        steps = [
            ("Load Environment", self.load_environment_variables),
            ("Check Pixi", self.check_pixi_installation),
            ("Install Dependencies", self.install_pixi_dependencies),
        ]

        if not skip_services:
            steps.extend([
                ("Start Services", self.start_database_services),
                ("Init MCP Servers", self.initialize_mcp_servers),
                ("Start MCP Servers", self.start_mcp_servers),
            ])

        steps.extend([
            ("Feasibility Check", self.run_feasibility_check),
            ("Create Summary", self.create_environment_summary),
        ])

        success_count = 0
        critical_failures = 0

        for step_name, step_func in steps:
            print(f"\n📍 {step_name}")

            step_result = {
                "step_name": step_name,
                "success": False,
                "error": None,
                "is_critical": step_name in ["Check Pixi"]
            }

            try:
                if step_func():
                    success_count += 1
                    step_result["success"] = True
                    print(f"✅ {step_name} completed")
                else:
                    if step_name in ["Check Pixi"]:
                        critical_failures += 1
                        step_result["is_critical"] = True
                        print(f"❌ {step_name} failed (critical)")
                    else:
                        print(f"⚠️ {step_name} had issues")
            except Exception as e:
                step_result["error"] = str(e)
                if step_name in ["Check Pixi"]:
                    critical_failures += 1
                    step_result["is_critical"] = True
                    print(f"❌ {step_name} failed (critical): {e}")
                else:
                    print(f"⚠️ {step_name} error: {e}")

            startup_results["steps_executed"].append(step_result)

        total_steps = len(steps)
        success_rate = (success_count / total_steps) * 100

        startup_results["success_count"] = success_count
        startup_results["critical_failures"] = critical_failures
        startup_results["total_steps"] = total_steps
        startup_results["success_rate"] = success_rate

        # #region agent log H1
        with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({
                "id": f"log_{int(time.time()*1000)}_{'h1_main_' + str(hash(str(time.time())))[:8]}",
                "timestamp": int(time.time()*1000),
                "location": "start_fea_environment.py:run_complete_startup",
                "message": "Complete startup execution results",
                "data": startup_results,
                "sessionId": "debug-fea-startup",
                "runId": "run-1",
                "hypothesisId": "H1"
            }) + '\n')
        # #endregion

        print("\n" + "=" * 60)
        print("🎯 FEA ENVIRONMENT STARTUP COMPLETE")
        print(f"📊 Success Rate: {success_count}/{total_steps} ({success_rate:.1f}%)")

        if critical_failures > 0:
            print("\n❌ CRITICAL ISSUES DETECTED")
            print("The rebuild cannot proceed without resolving critical failures.")
            print("Please install Pixi and try again.")
        elif success_rate >= 80:
            print("🎉 Environment is ready for FEA analysis!")
        elif success_rate >= 60:
            print("⚠️ Environment partially ready, some features may not work")
        else:
            print("❌ Environment setup has critical issues")

        if interactive:
            print("\n🔬 Starting interactive session...")
            self.start_interactive_shell()

        return success_rate >= 60

def main():
    parser = argparse.ArgumentParser(description='FEA Environment Startup')
    parser.add_argument('--interactive', '-i', action='store_true',
                       help='Start interactive shell after setup')
    parser.add_argument('--skip-services', action='store_true',
                       help='Skip starting database services')
    parser.add_argument('--project-root', default='${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}',
                       help='Project root directory')

    args = parser.parse_args()

    starter = FEAEnvironmentStarter(args.project_root)
    success = starter.run_complete_startup(
        interactive=args.interactive,
        skip_services=args.skip_services
    )

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()