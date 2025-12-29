#!/usr/bin/env python3
"""
Comprehensive System Diagnostic - Debug Mode Instrumentation
Tests all MCP servers, CLI tools, polyglot stack, and real-world use cases
"""

import json
import time
import subprocess
import os
import sys
import asyncio
import aiohttp
from pathlib import Path
import logging
import psutil
import socket
import requests
from typing import Dict, List, Any, Optional

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')

class ComprehensiveSystemDiagnostic:
    """Complete system diagnostic with instrumentation"""

    def __init__(self):
        self.project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")
        self.diagnostic_report = self.project_root / "comprehensive_diagnostic_report.json"
        self.debug_log_path = self.project_root / ".cursor" / "debug.log"

        # #region agent log H_REAL_WORLD_1
        with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({
                "id": f"log_{int(time.time()*1000)}_{'real_world_1_' + str(hash(str(time.time())))[:8]}",
                "timestamp": int(time.time()*1000),
                "location": "comprehensive_system_diagnostic.py:ComprehensiveSystemDiagnostic:__init__",
                "message": "Real-world use case 1: AI Agency Client Management System - System diagnostic initialized",
                "data": {"diagnostic_type": "comprehensive", "use_case": "ai_agency_client_mgmt"},
                "sessionId": "debug-real-world-diagnostic",
                "runId": "run-1",
                "hypothesisId": "H_REAL_WORLD_1"
            }) + '\n')
        # #endregion

    def log_instrumentation(self, message: str, data: Dict[str, Any], hypothesis_id: str):
        """Instrumented logging for debug mode"""
        log_entry = {
            "id": f"log_{int(time.time()*1000)}_{str(hash(message + str(time.time())))[:8]}",
            "timestamp": int(time.time()*1000),
            "location": f"comprehensive_system_diagnostic.py:{sys._getframe(1).f_code.co_name}",
            "message": message,
            "data": data,
            "sessionId": "debug-real-world-diagnostic",
            "runId": "run-1",
            "hypothesisId": hypothesis_id
        }
        try:
            with open(self.debug_log_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            print(f"Debug log write failed: {e}")

    async def run_api_smoke_test(self, service_name: str, url: str, expected_status: int = 200) -> Dict[str, Any]:
        """Async API smoke test with instrumentation"""
        self.log_instrumentation(
            f"Testing API endpoint for {service_name}",
            {"url": url, "expected_status": expected_status},
            "H_API_SMOKE_1"
        )

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url) as response:
                    result = {
                        "service": service_name,
                        "url": url,
                        "status_code": response.status,
                        "success": response.status == expected_status,
                        "response_time": None,
                        "error": None
                    }

                    self.log_instrumentation(
                        f"API test result for {service_name}",
                        result,
                        "H_API_SMOKE_1"
                    )

                    return result

        except Exception as e:
            result = {
                "service": service_name,
                "url": url,
                "status_code": None,
                "success": False,
                "response_time": None,
                "error": str(e)
            }

            self.log_instrumentation(
                f"API test failed for {service_name}",
                result,
                "H_API_SMOKE_1"
            )

            return result

    def test_mcp_servers(self) -> Dict[str, Any]:
        """Test all MCP server connectivity"""
        self.log_instrumentation("Testing MCP server connectivity", {}, "H_MCP_SERVERS_1")

        mcp_servers = {
            "sequential-thinking": "http://localhost:8001",
            "ollama": "http://localhost:11434",
            "file-system": "http://localhost:8003",
            "git": "http://localhost:8004",
            "brave-search": "http://localhost:8005",
            "github": "http://localhost:8006",
            "task-master": "http://localhost:8007",
            "neo4j": "http://localhost:7687",
            "qdrant": "http://localhost:6333",
            "elasticsearch": "http://localhost:9200",
            "kubernetes": "http://localhost:8011",
            "docker": "http://localhost:8012",
            "aws": "http://localhost:8013",
            "openai": "http://localhost:8014",
            "anthropic": "http://localhost:8015",
            "tavily": "http://localhost:8016",
            "exa": "http://localhost:8017",
            "firecrawl": "http://localhost:8018",
            "deepwiki": "http://localhost:8019",
            "huggingface": "http://localhost:8020"
        }

        results = {}
        for name, url in mcp_servers.items():
            try:
                response = requests.get(url, timeout=5)
                results[name] = {
                    "url": url,
                    "status": "running" if response.status_code < 500 else "error",
                    "response_code": response.status_code
                }
            except:
                results[name] = {
                    "url": url,
                    "status": "not_running",
                    "response_code": None
                }

        self.log_instrumentation("MCP server test results", results, "H_MCP_SERVERS_1")
        return results

    def test_cli_tools(self) -> Dict[str, Any]:
        """Test all CLI tools availability"""
        self.log_instrumentation("Testing CLI tools availability", {}, "H_CLI_TOOLS_1")

        cli_tools = {
            # Core CLI Tools
            "fd": "fd --version",
            "rg": "rg --version",
            "fzf": "fzf --version",
            "bat": "bat --version",
            "jq": "jq --version",
            "yq": "yq --version",
            "tree": "tree --version",
            "htop": "htop --version",
            "gh": "gh --version",
            "pass": "pass --version",
            "stow": "stow --version",
            "zoxide": "zoxide --version",
            "navi": "navi --version",
            "tldr": "tldr --version",
            "neofetch": "neofetch --version",

            # Development Tools
            "python": "python --version",
            "node": "node --version",
            "npm": "npm --version",
            "pnpm": "pnpm --version",
            "rustc": "rustc --version",
            "cargo": "cargo --version",
            "go": "go version",
            "java": "java --version",

            # Version Managers
            "pyenv": "pyenv --version",
            "rbenv": "rbenv --version",
            "nvm": "nvm --version",

            # Code Analysis
            "ast-grep": "ast-grep --version",
            "ruff": "ruff --version",
            "mypy": "mypy --version",
            "oxlint": "oxlint --version",

            # Performance Tools
            "py-spy": "py-spy --version",

            # Cloud Tools
            "kubectl": "kubectl version --client",
            "aws": "aws --version",

            # AI Tools
            "ollama": "ollama --version",

            # Shell Tools
            "zsh": "zsh --version",
            "tmux": "tmux -V",
            "starship": "starship --version",
            "atuin": "atuin --version"
        }

        results = {}
        for tool, command in cli_tools.items():
            try:
                result = subprocess.run(command.split(), capture_output=True, text=True, timeout=10)
                results[tool] = {
                    "available": result.returncode == 0,
                    "version": result.stdout.strip() if result.returncode == 0 else None,
                    "error": result.stderr.strip() if result.returncode != 0 else None
                }
            except:
                results[tool] = {
                    "available": False,
                    "version": None,
                    "error": "Command failed or timed out"
                }

        self.log_instrumentation("CLI tools test results", results, "H_CLI_TOOLS_1")
        return results

    def test_database_connectivity(self) -> Dict[str, Any]:
        """Test database connectivity"""
        self.log_instrumentation("Testing database connectivity", {}, "H_DATABASE_1")

        databases = {
            "postgresql": {"host": "localhost", "port": 5432},
            "neo4j": {"host": "localhost", "port": 7687},
            "redis": {"host": "localhost", "port": 6379},
            "qdrant": {"host": "localhost", "port": 6333},
            "elasticsearch": {"host": "localhost", "port": 9200}
        }

        results = {}
        for name, config in databases.items():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((config["host"], config["port"]))
                sock.close()

                results[name] = {
                    "host": config["host"],
                    "port": config["port"],
                    "connected": result == 0,
                    "error": None
                }
            except Exception as e:
                results[name] = {
                    "host": config["host"],
                    "port": config["port"],
                    "connected": False,
                    "error": str(e)
                }

        self.log_instrumentation("Database connectivity test results", results, "H_DATABASE_1")
        return results

    def test_pixi_environment(self) -> Dict[str, Any]:
        """Test Pixi environment functionality"""
        self.log_instrumentation("Testing Pixi environment", {}, "H_PIXI_1")

        try:
            # Test pixi installation
            result = subprocess.run(["pixi", "--version"], capture_output=True, text=True, timeout=10)
            pixi_version = result.stdout.strip() if result.returncode == 0 else None

            # Test environment activation
            os.chdir(self.project_root)
            result = subprocess.run(["pixi", "run", "test"], capture_output=True, text=True, timeout=30)
            test_success = "Scientific stack ready" in result.stdout

            results = {
                "pixi_installed": pixi_version is not None,
                "pixi_version": pixi_version,
                "environment_test": test_success,
                "project_root": str(self.project_root)
            }

        except Exception as e:
            results = {
                "pixi_installed": False,
                "pixi_version": None,
                "environment_test": False,
                "error": str(e),
                "project_root": str(self.project_root)
            }

        self.log_instrumentation("Pixi environment test results", results, "H_PIXI_1")
        return results

    def test_graphql_endpoints(self) -> Dict[str, Any]:
        """Test GraphQL endpoints"""
        self.log_instrumentation("Testing GraphQL endpoints", {}, "H_GRAPHQL_1")

        graphql_endpoints = [
            "http://localhost:4000/graphql",  # Common GraphQL port
            "http://localhost:3000/graphql",  # Next.js default
            "http://localhost:8000/graphql",  # Django Graphene
        ]

        results = {}
        for url in graphql_endpoints:
            try:
                # Simple introspection query
                query = {"query": "{__schema{types{name}}}"}
                response = requests.post(url, json=query, timeout=10)

                results[url] = {
                    "status_code": response.status_code,
                    "has_schema": "__schema" in response.text if response.status_code == 200 else False,
                    "error": None
                }
            except Exception as e:
                results[url] = {
                    "status_code": None,
                    "has_schema": False,
                    "error": str(e)
                }

        self.log_instrumentation("GraphQL endpoint test results", results, "H_GRAPHQL_1")
        return results

    def define_real_world_use_cases(self) -> List[Dict[str, Any]]:
        """Define 20 real-world use cases for AI agency app development"""
        self.log_instrumentation("Defining real-world use cases", {}, "H_USE_CASES_1")

        use_cases = [
            {
                "id": "uc_1",
                "name": "Client Onboarding Automation",
                "description": "Automated client intake, contract generation, and project setup",
                "technologies": ["Next.js", "Prisma", "PostgreSQL", "Stripe", "SendGrid"],
                "mcp_servers": ["sequential-thinking", "github", "brave-search"],
                "complexity": "High",
                "estimated_hours": 80
            },
            {
                "id": "uc_2",
                "name": "AI Content Generation Pipeline",
                "description": "Multi-platform content creation and distribution system",
                "technologies": ["Python", "FastAPI", "OpenAI", "AWS S3", "Redis"],
                "mcp_servers": ["ollama", "anthropic", "firecrawl"],
                "complexity": "High",
                "estimated_hours": 120
            },
            {
                "id": "uc_3",
                "name": "Client Analytics Dashboard",
                "description": "Real-time client performance metrics and ROI tracking",
                "technologies": ["React", "GraphQL", "Neo4j", "D3.js", "WebSocket"],
                "mcp_servers": ["task-master", "elasticsearch", "kubernetes"],
                "complexity": "Medium",
                "estimated_hours": 100
            },
            {
                "id": "uc_4",
                "name": "Automated Social Media Management",
                "description": "AI-powered social media content scheduling and engagement",
                "technologies": ["Node.js", "MongoDB", "Twitter API", "Instagram API", "Queue"],
                "mcp_servers": ["tavily", "deepwiki", "github"],
                "complexity": "Medium",
                "estimated_hours": 90
            },
            {
                "id": "uc_5",
                "name": "SEO Optimization Platform",
                "description": "Automated SEO analysis, content optimization, and reporting",
                "technologies": ["Django", "Celery", "PostgreSQL", "Elasticsearch", "React"],
                "mcp_servers": ["brave-search", "exa", "anthropic"],
                "complexity": "High",
                "estimated_hours": 150
            },
            {
                "id": "uc_6",
                "name": "E-commerce AI Assistant",
                "description": "Intelligent product recommendations and customer support",
                "technologies": ["FastAPI", "Redis", "Pinecone", "Stripe", "Twilio"],
                "mcp_servers": ["ollama", "qdrant", "openai"],
                "complexity": "High",
                "estimated_hours": 130
            },
            {
                "id": "uc_7",
                "name": "Marketing Campaign Optimizer",
                "description": "AI-driven A/B testing and campaign performance optimization",
                "technologies": ["Python", "scikit-learn", "PostgreSQL", "Apache Spark", "Airflow"],
                "mcp_servers": ["sequential-thinking", "task-master", "elasticsearch"],
                "complexity": "High",
                "estimated_hours": 160
            },
            {
                "id": "uc_8",
                "name": "Client Communication Hub",
                "description": "Unified messaging platform with AI responses",
                "technologies": ["Node.js", "Socket.io", "MongoDB", "OpenAI", "Twilio"],
                "mcp_servers": ["anthropic", "tavily", "github"],
                "complexity": "Medium",
                "estimated_hours": 110
            },
            {
                "id": "uc_9",
                "name": "Project Management Intelligence",
                "description": "AI-enhanced project tracking and resource allocation",
                "technologies": ["React", "GraphQL", "Neo4j", "Python", "FastAPI"],
                "mcp_servers": ["task-master", "neo4j", "kubernetes"],
                "complexity": "High",
                "estimated_hours": 140
            },
            {
                "id": "uc_10",
                "name": "Automated Reporting System",
                "description": "Generate comprehensive client reports with AI insights",
                "technologies": ["Python", "Jinja2", "PostgreSQL", "PDFKit", "Celery"],
                "mcp_servers": ["anthropic", "elasticsearch", "github"],
                "complexity": "Medium",
                "estimated_hours": 85
            },
            {
                "id": "uc_11",
                "name": "Lead Generation Engine",
                "description": "AI-powered lead identification and qualification",
                "technologies": ["Python", "BeautifulSoup", "LinkedIn API", "PostgreSQL", "scikit-learn"],
                "mcp_servers": ["brave-search", "firecrawl", "exa"],
                "complexity": "High",
                "estimated_hours": 120
            },
            {
                "id": "uc_12",
                "name": "Customer Support Chatbot",
                "description": "Intelligent customer support with knowledge base integration",
                "technologies": ["Node.js", "Express", "MongoDB", "OpenAI", "Dialogflow"],
                "mcp_servers": ["ollama", "anthropic", "deepwiki"],
                "complexity": "Medium",
                "estimated_hours": 95
            },
            {
                "id": "uc_13",
                "name": "Competitive Analysis Tool",
                "description": "Automated competitor monitoring and analysis",
                "technologies": ["Python", "Selenium", "PostgreSQL", "Apache Kafka", "Tableau"],
                "mcp_servers": ["tavily", "firecrawl", "brave-search"],
                "complexity": "High",
                "estimated_hours": 135
            },
            {
                "id": "uc_14",
                "name": "Personalized Email Campaigns",
                "description": "AI-driven email personalization and automation",
                "technologies": ["Python", "FastAPI", "PostgreSQL", "SendGrid", "Redis"],
                "mcp_servers": ["anthropic", "elasticsearch", "github"],
                "complexity": "Medium",
                "estimated_hours": 105
            },
            {
                "id": "uc_15",
                "name": "Real-time Collaboration Platform",
                "description": "Live collaboration tools for agency teams",
                "technologies": ["React", "Socket.io", "MongoDB", "Redis", "WebRTC"],
                "mcp_servers": ["task-master", "kubernetes", "github"],
                "complexity": "High",
                "estimated_hours": 180
            },
            {
                "id": "uc_16",
                "name": "Budget Tracking & Forecasting",
                "description": "AI-powered financial planning and budget optimization",
                "technologies": ["Python", "Pandas", "PostgreSQL", "Prophet", "FastAPI"],
                "mcp_servers": ["sequential-thinking", "elasticsearch", "anthropic"],
                "complexity": "Medium",
                "estimated_hours": 115
            },
            {
                "id": "uc_17",
                "name": "Content Performance Analytics",
                "description": "Advanced content performance tracking and insights",
                "technologies": ["Python", "Apache Spark", "Elasticsearch", "Kibana", "Airflow"],
                "mcp_servers": ["elasticsearch", "tavily", "anthropic"],
                "complexity": "High",
                "estimated_hours": 145
            },
            {
                "id": "uc_18",
                "name": "Client Portal & Self-Service",
                "description": "Secure client portal with self-service capabilities",
                "technologies": ["Next.js", "Prisma", "PostgreSQL", "NextAuth.js", "Stripe"],
                "mcp_servers": ["github", "kubernetes", "anthropic"],
                "complexity": "Medium",
                "estimated_hours": 125
            },
            {
                "id": "uc_19",
                "name": "Voice Assistant Integration",
                "description": "Voice-enabled AI assistant for client interactions",
                "technologies": ["Python", "FastAPI", "Google Speech API", "Redis", "WebSocket"],
                "mcp_servers": ["ollama", "anthropic", "openai"],
                "complexity": "High",
                "estimated_hours": 155
            },
            {
                "id": "uc_20",
                "name": "Agency Knowledge Base",
                "description": "Centralized knowledge management with AI search",
                "technologies": ["React", "GraphQL", "Neo4j", "Elasticsearch", "Python"],
                "mcp_servers": ["neo4j", "elasticsearch", "anthropic", "deepwiki"],
                "complexity": "High",
                "estimated_hours": 170
            }
        ]

        self.log_instrumentation("Real-world use cases defined", {"count": len(use_cases)}, "H_USE_CASES_1")
        return use_cases

    def run_comprehensive_diagnostic(self) -> Dict[str, Any]:
        """Run complete diagnostic suite"""
        self.log_instrumentation("Starting comprehensive system diagnostic", {}, "H_COMPREHENSIVE_1")

        diagnostic_results = {
            "timestamp": time.time(),
            "mcp_servers": self.test_mcp_servers(),
            "cli_tools": self.test_cli_tools(),
            "databases": self.test_database_connectivity(),
            "pixi_environment": self.test_pixi_environment(),
            "graphql_endpoints": self.test_graphql_endpoints(),
            "real_world_use_cases": self.define_real_world_use_cases(),
            "system_info": {
                "cpu_count": psutil.cpu_count(),
                "memory_gb": psutil.virtual_memory().total / (1024**3),
                "disk_usage": psutil.disk_usage('/').percent,
                "platform": platform.platform()
            }
        }

        # Save comprehensive report
        with open(self.diagnostic_report, 'w') as f:
            json.dump(diagnostic_results, f, indent=2, default=str)

        self.log_instrumentation("Comprehensive diagnostic completed", {
            "report_path": str(self.diagnostic_report),
            "total_use_cases": len(diagnostic_results["real_world_use_cases"])
        }, "H_COMPREHENSIVE_1")

        return diagnostic_results

    def generate_gap_analysis_report(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate finite element gap analysis"""
        self.log_instrumentation("Generating finite element gap analysis", {}, "H_GAP_ANALYSIS_1")

        gaps = {
            "mcp_servers_gaps": [],
            "cli_tools_gaps": [],
            "database_gaps": [],
            "infrastructure_gaps": [],
            "integration_gaps": []
        }

        # MCP Servers gaps
        for server, status in results["mcp_servers"].items():
            if status["status"] != "running":
                gaps["mcp_servers_gaps"].append({
                    "server": server,
                    "issue": f"Server not running (status: {status['status']})",
                    "solution": f"Start {server} MCP server on {status['url']}"
                })

        # CLI Tools gaps
        for tool, status in results["cli_tools"].items():
            if not status["available"]:
                gaps["cli_tools_gaps"].append({
                    "tool": tool,
                    "issue": f"Tool not available: {status.get('error', 'Unknown error')}",
                    "solution": f"Install {tool} via appropriate package manager"
                })

        # Database gaps
        for db, status in results["databases"].items():
            if not status["connected"]:
                gaps["database_gaps"].append({
                    "database": db,
                    "issue": f"Database not accessible on {status['host']}:{status['port']}",
                    "solution": f"Start {db} service and ensure connectivity"
                })

        # Infrastructure gaps
        if not results["pixi_environment"]["pixi_installed"]:
            gaps["infrastructure_gaps"].append({
                "component": "Pixi",
                "issue": "Pixi package manager not installed",
                "solution": "Install Pixi: curl -fsSL https://pixi.sh/install.sh | bash"
            })

        gap_analysis = {
            "total_gaps": sum(len(gaps[category]) for category in gaps.keys()),
            "gaps_by_category": gaps,
            "critical_gaps": [gap for category in gaps.values() for gap in category if "critical" in str(gap).lower()],
            "recommendations": [
                "Install missing MCP servers using docker-compose.services.yml",
                "Install missing CLI tools via Homebrew and npm",
                "Start database services using Docker Compose",
                "Configure GraphQL endpoints for API testing",
                "Set up Prisma schema for PostgreSQL integration",
                "Configure Neo4j for graph database operations"
            ]
        }

        self.log_instrumentation("Gap analysis completed", gap_analysis, "H_GAP_ANALYSIS_1")
        return gap_analysis

async def main():
    """Main diagnostic execution"""
    diagnostic = ComprehensiveSystemDiagnostic()

    print("🚀 Starting Comprehensive System Diagnostic...")
    print("=" * 60)

    # Run comprehensive diagnostic
    results = diagnostic.run_comprehensive_diagnostic()

    # Generate gap analysis
    gap_analysis = diagnostic.generate_gap_analysis_report(results)

    # Display results
    print("\n📊 DIAGNOSTIC RESULTS:")
    print(f"✅ MCP Servers Tested: {len(results['mcp_servers'])}")
    print(f"✅ CLI Tools Tested: {len(results['cli_tools'])}")
    print(f"✅ Databases Tested: {len(results['databases'])}")
    print(f"✅ Real-world Use Cases Defined: {len(results['real_world_use_cases'])}")
    print(f"❌ Total Gaps Found: {gap_analysis['total_gaps']}")

    print("\n🔧 TOP ISSUES TO FIX:")
    for category, gaps in gap_analysis["gaps_by_category"].items():
        if gaps:
            print(f"\n{category.upper().replace('_', ' ')}:")
            for gap in gaps[:3]:  # Show top 3 per category
                print(f"  • {gap.get('tool', gap.get('server', gap.get('database', 'Unknown')))}: {gap['issue']}")

    print("\n💡 RECOMMENDATIONS:")
    for rec in gap_analysis["recommendations"]:
        print(f"  • {rec}")

    print("\n📄 Detailed report saved to:")
    print(f"  {diagnostic.diagnostic_report}")

    print("\n" + "=" * 60)
    print("🎯 DIAGNOSTIC COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())