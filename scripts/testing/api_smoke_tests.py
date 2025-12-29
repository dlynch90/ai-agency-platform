#!/usr/bin/env python3
"""
Comprehensive API Smoke Tests
Tests all database services, APIs, and integrations
"""

import asyncio
import aiohttp
import asyncpg
import redis.asyncio as redis
import json
import sys
from typing import Dict, List, Any
from pathlib import Path
import time
import psycopg2

async def test_postgresql() -> Dict[str, Any]:
    """Test PostgreSQL connection and basic operations"""
    try:
        # Synchronous test for PostgreSQL
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="postgres",
            user="postgres",
            connect_timeout=5
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return {"status": "healthy", "version": version[:50] + "..."}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def test_redis() -> Dict[str, Any]:
    """Test Redis connection and basic operations"""
    try:
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        pong = await r.ping()
        await r.set('smoke_test', 'passed')
        value = await r.get('smoke_test')
        await r.delete('smoke_test')
        await r.aclose()
        return {"status": "healthy", "ping": pong, "test": value}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def test_neo4j() -> Dict[str, Any]:
    """Test Neo4j connection"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:7474', timeout=5) as response:
                data = await response.json()
                return {"status": "healthy", "version": data.get('neo4j_version', 'unknown')}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def test_qdrant() -> Dict[str, Any]:
    """Test Qdrant vector database"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:6333/health', timeout=5) as response:
                return {"status": "healthy", "response": response.status}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def test_graphql_endpoint() -> Dict[str, Any]:
    """Test GraphQL endpoint if available"""
    try:
        query = """
        query {
          systemStatus {
            cpuUsage
            memoryUsage
            activeServices
          }
        }
        """

        async with aiohttp.ClientSession() as session:
            async with session.post(
                'http://localhost:4000/graphql',
                json={'query': query},
                timeout=5
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {"status": "healthy", "data": data}
                else:
                    return {"status": "unhealthy", "status_code": response.status}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def test_rest_api_endpoints() -> Dict[str, Any]:
    """Test REST API endpoints"""
    endpoints = [
        'http://localhost:8000/health',
        'http://localhost:3000/health',
        'http://localhost:4000/health'
    ]

    results = {}
    async with aiohttp.ClientSession() as session:
        for endpoint in endpoints:
            try:
                async with session.get(endpoint, timeout=3) as response:
                    results[endpoint] = {
                        "status": "healthy" if response.status < 400 else "unhealthy",
                        "status_code": response.status
                    }
            except Exception as e:
                results[endpoint] = {"status": "unhealthy", "error": str(e)}

    return results

def test_python_libraries() -> Dict[str, Any]:
    """Test Python ML/AI libraries"""
    results = {}

    libraries_to_test = [
        'torch', 'numpy', 'pandas', 'matplotlib', 'scikit-learn',
        'fastapi', 'pydantic', 'uvicorn', 'requests', 'aiohttp'
    ]

    for lib in libraries_to_test:
        try:
            __import__(lib)
            results[lib] = {"status": "available"}
        except ImportError:
            results[lib] = {"status": "missing"}

    return results

def test_cli_tools() -> Dict[str, Any]:
    """Test CLI tool availability"""
    import subprocess

    tools_to_test = [
        'rustc', 'cargo', 'node', 'npm', 'python3', 'java', 'javac',
        'go', 'gcc', 'git', 'docker', 'kubectl', 'biome'
    ]

    results = {}
    for tool in tools_to_test:
        try:
            result = subprocess.run([tool, '--version'],
                                  capture_output=True, text=True, timeout=5)
            results[tool] = {
                "status": "available",
                "version": result.stdout.split('\n')[0][:50] if result.stdout else "unknown"
            }
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            results[tool] = {"status": "unavailable"}

    return results

async def run_all_tests() -> Dict[str, Any]:
    """Run all smoke tests"""
    print("🚀 Starting Comprehensive API Smoke Tests...")
    print("=" * 60)

    start_time = time.time()

    results = {
        "timestamp": time.time(),
        "tests": {}
    }

    # Database tests
    print("🔍 Testing Databases...")
    results["tests"]["postgresql"] = await test_postgresql()
    results["tests"]["redis"] = await test_redis()
    results["tests"]["neo4j"] = await test_neo4j()
    results["tests"]["qdrant"] = await test_qdrant()

    # API tests
    print("🔍 Testing APIs...")
    results["tests"]["graphql"] = await test_graphql_endpoint()
    results["tests"]["rest_endpoints"] = await test_rest_api_endpoints()

    # Library tests
    print("🔍 Testing Libraries...")
    results["tests"]["python_libraries"] = test_python_libraries()

    # CLI tools test
    print("🔍 Testing CLI Tools...")
    results["tests"]["cli_tools"] = test_cli_tools()

    # Summary
    results["duration"] = time.time() - start_time
    results["summary"] = {
        "total_tests": len(results["tests"]),
        "passed_tests": sum(1 for test in results["tests"].values()
                           if isinstance(test, dict) and test.get("status") == "healthy"),
        "failed_tests": sum(1 for test in results["tests"].values()
                           if isinstance(test, dict) and test.get("status") != "healthy")
    }

    return results

def print_results(results: Dict[str, Any]):
    """Print test results"""
    print("\n📊 TEST RESULTS SUMMARY")
    print("=" * 60)

    summary = results["summary"]
    print(f"Total Tests: {summary['total_tests']}")
    print(f"Passed: {summary['passed_tests']}")
    print(f"Failed: {summary['failed_tests']}")
    print(".2f")

    print("\n🔍 DETAILED RESULTS:")
    for test_name, test_result in results["tests"].items():
        if isinstance(test_result, dict):
            status = test_result.get("status", "unknown")
            emoji = "✅" if status == "healthy" or status == "available" else "❌"
            print(f"{emoji} {test_name}: {status}")

            if status == "unhealthy" and "error" in test_result:
                print(f"   Error: {test_result['error'][:100]}...")
        elif isinstance(test_result, dict):
            # Handle nested results like REST endpoints
            for endpoint, endpoint_result in test_result.items():
                status = endpoint_result.get("status", "unknown")
                emoji = "✅" if status == "healthy" else "❌"
                print(f"{emoji} {endpoint}: {status}")

    # Overall status
    if summary["failed_tests"] == 0:
        print("\n🎉 ALL TESTS PASSED! Environment is healthy.")
    else:
        print(f"\n⚠️  {summary['failed_tests']} tests failed. Check logs for details.")

def save_results(results: Dict[str, Any]):
    """Save test results to file"""
    output_dir = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/logs/audit")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"api_smoke_test_{int(time.time())}.json"

    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n📄 Results saved to: {output_file}")

async def main():
    """Main function"""
    try:
        results = await run_all_tests()
        print_results(results)
        save_results(results)

        # Exit with appropriate code
        sys.exit(0 if results["summary"]["failed_tests"] == 0 else 1)

    except Exception as e:
        print(f"❌ Smoke test failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())