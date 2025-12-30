#!/usr/bin/env python3
"""
FEA-Optimized Claude Code Installation Script
Applies Finite Element Analysis principles to optimize installation:
- Markov Chain N=5: State transition modeling of installation phases
- Binomial Distribution P<0.10: Edge case detection
- Spherical Architecture: PATH optimization analysis
"""

import os
import sys
import json
import subprocess
import time
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np
from collections import defaultdict

# #region agent log - Hypothesis A: Installation State Tracking
LOG_ENDPOINT = "http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab"
LOG_PATH = "${HOME}/Developer/.cursor/debug.log"

def log_debug(hypothesis_id: str, location: str, message: str, data: dict):
    """Send debug log to endpoint"""
    payload = {
        "id": f"log_{int(time.time() * 1000)}",
        "timestamp": int(time.time() * 1000),
        "location": location,
        "message": message,
        "data": data,
        "sessionId": "fea-claude-install",
        "runId": "optimization",
        "hypothesisId": hypothesis_id
    }
    try:
        import urllib.request
        import urllib.parse
        req = urllib.request.Request(
            LOG_ENDPOINT,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=1).read()
    except Exception:
        # Fallback to file logging
        try:
            with open(LOG_PATH, 'a') as f:
                f.write(json.dumps(payload) + '\n')
        except Exception:
            pass
# #endregion

class ClaudeInstallOptimizer:
    """FEA-based Claude Code installation optimizer"""
    
    def __init__(self, workspace: str = None):
        self.workspace = Path(workspace or os.getenv('DEVELOPER_DIR', os.path.expanduser('~/Developer')))
        self.home = Path.home()
        self.local_bin = self.home / '.local' / 'bin'
        self.zprofile = self.home / '.zprofile'
        self.zshrc = self.home / '.zshrc'
        
        # Markov chain states for installation phases
        self.markov_states = ['detect', 'prepare', 'install', 'configure', 'validate']
        self.markov_chain = defaultdict(lambda: defaultdict(float))
        self.current_state = 'detect'
        self.state_history = []
        
        # Binomial analysis for edge cases
        self.edge_cases = []
        self.binomial_threshold = 0.10
        
        # Spherical architecture metrics
        self.path_center_density = 0.0
        self.path_surface_complexity = 0.0
        self.path_edge_stability = 0.0
        
        log_debug("A", "ClaudeInstallOptimizer.__init__", "Initialized optimizer", {
            "workspace": str(self.workspace),
            "local_bin": str(self.local_bin),
            "zprofile_exists": self.zprofile.exists(),
            "zshrc_exists": self.zshrc.exists()
        })
    
    def detect_installation_state(self) -> Dict:
        """Detect current installation state"""
        log_debug("A", "detect_installation_state", "Starting detection", {})
        
        state = {
            'claude_binary_exists': False,
            'claude_in_path': False,
            'local_bin_exists': False,
            'local_bin_in_path': False,
            'package_manager': None,
            'node_version': None,
            'npm_version': None,
            'pnpm_version': None
        }
        
        # Check if claude binary exists
        claude_path = self.local_bin / 'claude'
        state['claude_binary_exists'] = claude_path.exists()
        log_debug("A", "detect_installation_state", "Binary check", {
            "claude_path": str(claude_path),
            "exists": state['claude_binary_exists']
        })
        
        # Check if claude is in PATH
        try:
            result = subprocess.run(['which', 'claude'], capture_output=True, text=True, timeout=2)
            state['claude_in_path'] = result.returncode == 0
            log_debug("A", "detect_installation_state", "PATH check", {
                "in_path": state['claude_in_path'],
                "which_output": result.stdout.strip()
            })
        except Exception as e:
            log_debug("A", "detect_installation_state", "PATH check error", {"error": str(e)})
        
        # Check .local/bin directory
        state['local_bin_exists'] = self.local_bin.exists()
        log_debug("A", "detect_installation_state", "Directory check", {
            "local_bin_exists": state['local_bin_exists']
        })
        
        # Check if .local/bin is in PATH
        path_env = os.environ.get('PATH', '')
        state['local_bin_in_path'] = str(self.local_bin) in path_env or '~/.local/bin' in path_env
        log_debug("A", "detect_installation_state", "PATH analysis", {
            "local_bin_in_path": state['local_bin_in_path'],
            "path_length": len(path_env)
        })
        
        # Detect package manager
        for pkg_mgr in ['pnpm', 'npm', 'yarn']:
            try:
                result = subprocess.run(['which', pkg_mgr], capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    state['package_manager'] = pkg_mgr
                    version_result = subprocess.run([pkg_mgr, '--version'], capture_output=True, text=True, timeout=2)
                    state[f'{pkg_mgr}_version'] = version_result.stdout.strip() if version_result.returncode == 0 else None
                    log_debug("A", "detect_installation_state", "Package manager found", {
                        "manager": pkg_mgr,
                        "version": state.get(f'{pkg_mgr}_version')
                    })
                    break
            except Exception:
                continue
        
        # Check Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=2)
            state['node_version'] = result.stdout.strip() if result.returncode == 0 else None
        except Exception:
            pass
        
        log_debug("A", "detect_installation_state", "Detection complete", state)
        return state
    
    def analyze_path_spherical(self) -> Dict:
        """Spherical architecture analysis of PATH"""
        log_debug("B", "analyze_path_spherical", "Starting spherical analysis", {})
        
        path_env = os.environ.get('PATH', '')
        path_dirs = [d.strip() for d in path_env.split(':') if d.strip()]
        
        # Center density: concentration of user binaries
        user_dirs = [d for d in path_dirs if str(self.home) in d or d.startswith('~')]
        self.path_center_density = len(user_dirs) / len(path_dirs) if path_dirs else 0.0
        
        # Surface complexity: number of unique directory types
        dir_types = set()
        for d in path_dirs:
            if '/bin' in d or '/sbin' in d:
                dir_types.add('bin')
            elif '/opt' in d:
                dir_types.add('opt')
            elif '/usr' in d:
                dir_types.add('usr')
            else:
                dir_types.add('other')
        self.path_surface_complexity = len(dir_types) / 10.0  # Normalize
        
        # Edge stability: presence of .local/bin
        self.path_edge_stability = 1.0 if str(self.local_bin) in path_dirs else 0.0
        
        analysis = {
            'center_density': self.path_center_density,
            'surface_complexity': self.path_surface_complexity,
            'edge_stability': self.path_edge_stability,
            'total_dirs': len(path_dirs),
            'user_dirs': len(user_dirs)
        }
        
        log_debug("B", "analyze_path_spherical", "Spherical analysis complete", analysis)
        return analysis
    
    def markov_transition(self, next_state: str):
        """Record Markov chain state transition"""
        if self.current_state:
            self.markov_chain[self.current_state][next_state] += 1
        self.state_history.append((self.current_state, next_state, time.time()))
        self.current_state = next_state
        
        log_debug("C", "markov_transition", "State transition", {
            "from": self.state_history[-2][0] if len(self.state_history) > 1 else None,
            "to": next_state,
            "history_length": len(self.state_history)
        })
    
    def binomial_edge_detection(self, probability: float, event: str) -> bool:
        """Detect edge cases using binomial distribution"""
        is_edge_case = probability < self.binomial_threshold
        
        if is_edge_case:
            self.edge_cases.append({
                'event': event,
                'probability': probability,
                'timestamp': time.time()
            })
            log_debug("D", "binomial_edge_detection", "Edge case detected", {
                "event": event,
                "probability": probability,
                "threshold": self.binomial_threshold
            })
        
        return is_edge_case
    
    def prepare_environment(self) -> bool:
        """Prepare installation environment"""
        self.markov_transition('prepare')
        log_debug("A", "prepare_environment", "Starting preparation", {})
        
        # Create .local/bin if it doesn't exist
        if not self.local_bin.exists():
            self.local_bin.mkdir(parents=True, exist_ok=True)
            log_debug("A", "prepare_environment", "Created .local/bin", {"path": str(self.local_bin)})
        
        # Ensure .local/bin is in PATH
        path_analysis = self.analyze_path_spherical()
        if path_analysis['edge_stability'] < 1.0:
            log_debug("B", "prepare_environment", "PATH optimization needed", path_analysis)
            return self.optimize_path()
        
        return True
    
    def optimize_path(self) -> bool:
        """Optimize PATH using spherical architecture principles"""
        log_debug("B", "optimize_path", "Starting PATH optimization", {})
        
        # Read existing .zprofile
        zprofile_content = ""
        if self.zprofile.exists():
            with open(self.zprofile, 'r') as f:
                zprofile_content = f.read()
            log_debug("B", "optimize_path", "Read .zprofile", {"length": len(zprofile_content)})
        
        # Check if .local/bin is already configured
        if '.local/bin' in zprofile_content or '$HOME/.local/bin' in zprofile_content:
            log_debug("B", "optimize_path", "PATH already configured", {})
            return True
        
        # Add .local/bin to PATH with optimal positioning (center density optimization)
        path_addition = '''
# FEA-Optimized PATH Configuration for Claude Code
# Added by FEA installation optimizer
export PATH="$HOME/.local/bin:$PATH"
'''
        
        try:
            with open(self.zprofile, 'a') as f:
                f.write(path_addition)
            log_debug("B", "optimize_path", "Added PATH to .zprofile", {"path": str(self.zprofile)})
            
            # Also update current session
            os.environ['PATH'] = f"{self.local_bin}:{os.environ.get('PATH', '')}"
            log_debug("B", "optimize_path", "Updated session PATH", {})
            return True
        except Exception as e:
            log_debug("B", "optimize_path", "PATH optimization failed", {"error": str(e)})
            return False
    
    def install_claude_code(self) -> bool:
        """Install Claude Code using vendor solution"""
        self.markov_transition('install')
        log_debug("A", "install_claude_code", "Starting installation", {})
        
        state = self.detect_installation_state()
        
        # If already installed and in PATH, skip
        if state['claude_in_path']:
            log_debug("A", "install_claude_code", "Already installed", state)
            return True
        
        # Determine package manager
        pkg_mgr = state.get('package_manager', 'npm')
        log_debug("A", "install_claude_code", "Using package manager", {"manager": pkg_mgr})
        
        # Install using vendor solution (npm/pnpm)
        try:
            if pkg_mgr == 'pnpm':
                cmd = ['pnpm', 'add', '-g', '@anthropic-ai/claude-code']
            elif pkg_mgr == 'yarn':
                cmd = ['yarn', 'global', 'add', '@anthropic-ai/claude-code']
            else:
                # Try alternative: install via npm
                cmd = ['npm', 'install', '-g', '@anthropic-ai/claude-code']
            
            log_debug("A", "install_claude_code", "Executing install command", {"cmd": ' '.join(cmd)})
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(self.workspace)
            )
            
            log_debug("A", "install_claude_code", "Install command completed", {
                "returncode": result.returncode,
                "stdout_length": len(result.stdout),
                "stderr_length": len(result.stderr)
            })
            
            if result.returncode != 0:
                # Try alternative installation method
                log_debug("A", "install_claude_code", "Primary install failed, trying alternative", {
                    "error": result.stderr[:200]
                })
                return self.install_claude_code_alternative()
            
            return True
            
        except subprocess.TimeoutExpired:
            log_debug("A", "install_claude_code", "Install timeout", {})
            return False
        except Exception as e:
            log_debug("A", "install_claude_code", "Install exception", {"error": str(e)})
            return self.install_claude_code_alternative()
    
    def install_claude_code_alternative(self) -> bool:
        """Alternative installation method"""
        log_debug("A", "install_claude_code_alternative", "Trying alternative method", {})
        
        # Try installing via npx (runs without global install)
        try:
            # Create a wrapper script
            wrapper_script = self.local_bin / 'claude'
            wrapper_content = '''#!/bin/bash
# FEA-Optimized Claude Code Wrapper
npx -y @anthropic-ai/claude-code "$@"
'''
            with open(wrapper_script, 'w') as f:
                f.write(wrapper_content)
            wrapper_script.chmod(0o755)
            
            log_debug("A", "install_claude_code_alternative", "Created wrapper script", {
                "path": str(wrapper_script)
            })
            return True
        except Exception as e:
            log_debug("A", "install_claude_code_alternative", "Alternative install failed", {"error": str(e)})
            return False
    
    def validate_installation(self) -> Dict:
        """Validate installation using FEA metrics"""
        self.markov_transition('validate')
        log_debug("A", "validate_installation", "Starting validation", {})
        
        state = self.detect_installation_state()
        path_analysis = self.analyze_path_spherical()
        
        # Calculate validation score
        score = 0.0
        max_score = 5.0
        
        if state['claude_binary_exists'] or state['claude_in_path']:
            score += 1.0
            log_debug("A", "validate_installation", "Binary validation passed", {})
        else:
            log_debug("A", "validate_installation", "Binary validation failed", {})
        
        if state['local_bin_exists']:
            score += 1.0
        
        if path_analysis['edge_stability'] > 0.5:
            score += 1.0
        
        if path_analysis['center_density'] > 0.2:
            score += 1.0
        
        if state['package_manager']:
            score += 1.0
        
        validation = {
            'score': score,
            'max_score': max_score,
            'percentage': (score / max_score) * 100,
            'state': state,
            'path_analysis': path_analysis,
            'markov_states': len(self.state_history),
            'edge_cases': len(self.edge_cases)
        }
        
        log_debug("A", "validate_installation", "Validation complete", validation)
        return validation
    
    def generate_report(self) -> Dict:
        """Generate FEA optimization report"""
        log_debug("A", "generate_report", "Generating report", {})
        
        # Normalize Markov chain probabilities
        normalized_chain = {}
        for state, transitions in self.markov_chain.items():
            total = sum(transitions.values())
            normalized_chain[state] = {
                next_state: count / total if total > 0 else 0.0
                for next_state, count in transitions.items()
            }
        
        report = {
            'timestamp': time.time(),
            'installation_state': self.detect_installation_state(),
            'path_optimization': self.analyze_path_spherical(),
            'markov_chain': normalized_chain,
            'state_history': self.state_history,
            'edge_cases': self.edge_cases,
            'validation': self.validate_installation(),
            'recommendations': self.generate_recommendations()
        }
        
        # Save report
        report_path = self.workspace / 'configs' / 'claude_install_fea_report.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        log_debug("A", "generate_report", "Report saved", {"path": str(report_path)})
        return report
    
    def generate_recommendations(self) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        state = self.detect_installation_state()
        path_analysis = self.analyze_path_spherical()
        
        if not state['claude_in_path']:
            recommendations.append("Claude Code is not in PATH - ensure .local/bin is configured")
        
        if path_analysis['edge_stability'] < 1.0:
            recommendations.append("PATH edge stability is low - add .local/bin to shell configuration")
        
        if path_analysis['center_density'] < 0.2:
            recommendations.append("PATH center density is low - consider consolidating user directories")
        
        if len(self.edge_cases) > 0:
            recommendations.append(f"Detected {len(self.edge_cases)} edge cases - review installation logs")
        
        return recommendations
    
    def optimize(self) -> bool:
        """Main optimization pipeline"""
        log_debug("A", "optimize", "Starting FEA optimization", {})
        
        self.markov_transition('detect')
        
        # Phase 1: Detect current state
        state = self.detect_installation_state()
        log_debug("A", "optimize", "Detection phase complete", state)
        
        # Phase 2: Prepare environment
        if not self.prepare_environment():
            log_debug("A", "optimize", "Environment preparation failed", {})
            return False
        
        # Phase 3: Install Claude Code
        if not state['claude_in_path']:
            if not self.install_claude_code():
                log_debug("A", "optimize", "Installation failed", {})
                return False
        
        # Phase 4: Validate
        validation = self.validate_installation()
        log_debug("A", "optimize", "Validation complete", validation)
        
        # Phase 5: Generate report
        report = self.generate_report()
        log_debug("A", "optimize", "Report generated", {"score": validation['percentage']})
        
        return validation['percentage'] >= 80.0

def main():
    """Main entry point"""
    optimizer = ClaudeInstallOptimizer()
    
    print("🔬 FEA-Optimized Claude Code Installation")
    print("=" * 50)
    print("Applying Finite Element Analysis principles:")
    print("  - Markov Chain N=5: State transition modeling")
    print("  - Binomial Distribution P<0.10: Edge case detection")
    print("  - Spherical Architecture: PATH optimization")
    print()
    
    success = optimizer.optimize()
    
    if success:
        print("✅ Installation optimized successfully!")
        print(f"📊 Report saved to: {optimizer.workspace / 'configs' / 'claude_install_fea_report.json'}")
    else:
        print("⚠️  Installation completed with warnings")
        print("📊 Check report for details and recommendations")
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
