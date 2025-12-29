#!/usr/bin/env python3
"""
Final Comprehensive Debugging Summary
Complete analysis of all systems, gaps, and optimizations
"""

import os
import json
from pathlib import Path

def generate_final_summary():
    """Generate comprehensive debugging summary"""

    workspace = Path(os.getenv('DEVELOPER_DIR', os.path.expanduser('~/Developer')))
    summary = {
        'timestamp': str(Path.cwd()),
        'system_status': {},
        'gap_analysis': {},
        'working_components': [],
        'failed_components': [],
        'recommendations': [],
        'next_steps': []
    }

    print("🔬 FINAL COMPREHENSIVE DEBUGGING SUMMARY")
    print("=" * 60)

    # Check available analysis results
    available_analyses = []

    # 1. Check FEA Gap Analysis
    fea_path = workspace / 'configs' / 'clean_20step_analysis.json'
    if fea_path.exists():
        try:
            with open(fea_path, 'r') as f:
                fea_data = json.load(f)
            summary['system_status']['fea_gap_analysis'] = {
                'status': 'working',
                'gaps_found': len(fea_data.get('gaps', {})),
                'health_score': fea_data.get('metrics', {}).get('overall', {}).get('composite_score', 0)
            }
            available_analyses.append('FEA Gap Analysis')
            summary['working_components'].append('fea_gap_analysis')
            print("✅ FEA Gap Analysis: Working")
        except Exception as e:
            summary['failed_components'].append({'component': 'fea_gap_analysis', 'error': str(e)})
            print("❌ FEA Gap Analysis: Failed to load")

    # 2. Check Claude Integration
    claude_path = workspace / 'configs' / 'fea_claude_integrated_optimization.json'
    if claude_path.exists():
        try:
            with open(claude_path, 'r') as f:
                claude_data = json.load(f)
            summary['system_status']['claude_integration'] = {
                'status': 'working',
                'integrated_score': claude_data.get('summary', {}).get('integrated_optimization_score', 0)
            }
            available_analyses.append('Claude Code Integration')
            summary['working_components'].append('claude_integration')
            print("✅ Claude Code Integration: Working")
        except Exception as e:
            summary['failed_components'].append({'component': 'claude_integration', 'error': str(e)})
            print("❌ Claude Code Integration: Failed to load")

    # 3. Check MCP Server Status
    mcp_ports = {'redis': 6379, 'neo4j': 7687, 'ollama': 11434}
    mcp_status = {'reachable': 0, 'total': len(mcp_ports)}

    import socket
    for service, port in mcp_ports.items():
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            if result == 0:
                mcp_status['reachable'] += 1
        except:
            pass

    summary['system_status']['mcp_servers'] = mcp_status
    if mcp_status['reachable'] > 0:
        available_analyses.append('MCP Server Connectivity')
        summary['working_components'].append('mcp_servers')
        print(f"✅ MCP Servers: {mcp_status['reachable']}/{mcp_status['total']} reachable")
    else:
        summary['failed_components'].append({'component': 'mcp_servers', 'error': 'No servers reachable'})
        print("❌ MCP Servers: Not reachable")

    # 4. Check CLI Tools
    cli_tools = ['python3', 'git', 'curl', 'docker']
    cli_status = {'available': 0, 'total': len(cli_tools)}

    import subprocess
    for tool in cli_tools:
        try:
            result = subprocess.run([tool, '--version'], capture_output=True, timeout=2)
            if result.returncode == 0:
                cli_status['available'] += 1
        except:
            pass

    summary['system_status']['cli_tools'] = cli_status
    if cli_status['available'] > 0:
        available_analyses.append('CLI Tools')
        summary['working_components'].append('cli_tools')
        print(f"✅ CLI Tools: {cli_status['available']}/{cli_status['total']} available")
    else:
        summary['failed_components'].append({'component': 'cli_tools', 'error': 'No tools available'})
        print("❌ CLI Tools: Not available")

    # 5. System Health Check
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        summary['system_status']['system_health'] = {
            'cpu_usage': cpu,
            'memory_usage': mem.percent,
            'status': 'healthy' if cpu < 80 and mem.percent < 85 else 'needs_attention'
        }
        available_analyses.append('System Health Monitoring')
        summary['working_components'].append('system_health')
        print("✅ System Health Monitoring: Active")
    except Exception as e:
        summary['failed_components'].append({'component': 'system_health', 'error': str(e)})
        print("❌ System Health Monitoring: Failed")

    # Comprehensive Gap Analysis
    total_gaps = 0
    if 'fea_gap_analysis' in summary['system_status']:
        total_gaps += summary['system_status']['fea_gap_analysis'].get('gaps_found', 0)

    summary['gap_analysis'] = {
        'total_gaps_identified': total_gaps,
        'working_components': len(summary['working_components']),
        'failed_components': len(summary['failed_components']),
        'available_analyses': available_analyses
    }

    print()
    print("📊 COMPREHENSIVE ANALYSIS RESULTS")
    print("=" * 60)

    print(f"Available Analyses: {len(available_analyses)}")
    for analysis in available_analyses:
        print(f"  • {analysis}")

    print()
    print(f"Working Components: {len(summary['working_components'])}")
    for component in summary['working_components']:
        print(f"  • {component.replace('_', ' ').title()}")

    if summary['failed_components']:
        print()
        print(f"Failed Components: {len(summary['failed_components'])}")
        for failed in summary['failed_components']:
            print(f"  • {failed['component'].replace('_', ' ').title()}: {failed['error']}")

    print()
    print(f"Total Gaps Identified: {total_gaps}")

    # Generate Recommendations
    recommendations = []

    if total_gaps > 0:
        recommendations.append("Address identified gaps in system configuration and dependencies")

    if len(summary['working_components']) < 4:
        recommendations.append("Restore failed components and improve system reliability")

    if summary['system_status'].get('mcp_servers', {}).get('reachable', 0) < 3:
        recommendations.append("Ensure all MCP servers are running and accessible")

    if summary['system_status'].get('cli_tools', {}).get('available', 0) < 4:
        recommendations.append("Install missing CLI tools for complete development environment")

    recommendations.extend([
        "Implement automated monitoring and alerting for all components",
        "Set up regular gap analysis and system health checks",
        "Establish comprehensive backup and disaster recovery procedures",
        "Configure automated security updates and vulnerability scanning",
        "Create detailed runbooks for system maintenance and troubleshooting"
    ])

    summary['recommendations'] = recommendations

    print()
    print("💡 KEY RECOMMENDATIONS")
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"{i}. {rec}")

    # Next Steps
    next_steps = [
        "Run automated remediation scripts to fix identified gaps",
        "Implement monitoring and alerting for system health",
        "Set up automated backup and recovery procedures",
        "Configure security hardening and access controls",
        "Establish comprehensive testing and validation pipelines",
        "Create documentation and runbooks for system maintenance",
        "Implement continuous integration and deployment workflows",
        "Set up performance monitoring and optimization tracking",
        "Configure automated security scanning and compliance checks",
        "Establish disaster recovery and business continuity plans"
    ]

    summary['next_steps'] = next_steps

    print()
    print("🚀 NEXT STEPS")
    for i, step in enumerate(next_steps[:5], 1):
        print(f"{i}. {step}")

    # Save comprehensive summary
    summary_path = workspace / 'configs' / 'final_debugging_summary.json'
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print()
    print("=" * 60)
    print("✅ COMPREHENSIVE DEBUGGING COMPLETE")
    print(f"📊 Summary saved: {summary_path}")
    print(f"🔍 Working Components: {len(summary['working_components'])}")
    print(f"🔧 Gaps Identified: {total_gaps}")
    print(f"💡 Recommendations: {len(recommendations)}")
    print("=" * 60)

    return summary

if __name__ == '__main__':
    generate_final_summary()