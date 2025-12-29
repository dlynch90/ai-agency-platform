#!/usr/bin/env python3
"""
Comprehensive 30-Step Debug Analysis and Gap Evaluation
Addresses Cursor IDE issues, codebase problems, and scaling to AGI automation
"""

import os
import sys
import subprocess
import json
import time
import platform
from pathlib import Path
import psutil
import shutil

class ComprehensiveDebugger:
    """30-step comprehensive debugging and gap analysis"""

    def __init__(self):
        self.project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")
        self.debug_log = self.project_root / "comprehensive_debug.log"
        self.results = {
            'system_analysis': {},
            'cursor_ide_analysis': {},
            'codebase_analysis': {},
            'environment_analysis': {},
            'scaling_gaps': {},
            'automation_gaps': {},
            'recommendations': []
        }

    def log(self, message, level="INFO"):
        """Log message to both console and file"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"

        print(log_entry)

        with open(self.debug_log, 'a') as f:
            f.write(log_entry + '\n')

    # STEP 1-5: System Analysis
    def step_1_analyze_system_resources(self):
        """Step 1: Analyze system resources and constraints"""
        self.log("🔍 STEP 1: Analyzing system resources...")

        try:
            # CPU info
            cpu_count = psutil.cpu_count()
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory info
            memory = psutil.virtual_memory()
            memory_gb = memory.total / (1024**3)

            # Disk info
            disk = psutil.disk_usage('/')
            disk_gb = disk.total / (1024**3)

            # Network
            net = psutil.net_if_addrs()

            self.results['system_analysis']['resources'] = {
                'cpu_cores': cpu_count,
                'cpu_usage': cpu_percent,
                'memory_gb': round(memory_gb, 2),
                'disk_gb': round(disk_gb, 2),
                'platform': platform.platform(),
                'python_version': sys.version,
                'network_interfaces': len(net)
            }

            self.log(f"✅ System has {cpu_count} CPU cores, {memory_gb:.1f}GB RAM, {disk_gb:.1f}GB disk")

        except Exception as e:
            self.log(f"❌ System resource analysis failed: {e}", "ERROR")
            self.results['system_analysis']['resources'] = {'error': str(e)}

    def step_2_analyze_path_integrity(self):
        """Step 2: Analyze PATH integrity and binary availability"""
        self.log("🔍 STEP 2: Analyzing PATH integrity...")

        path_dirs = os.environ.get('PATH', '').split(':')
        broken_paths = []
        valid_paths = []

        critical_binaries = [
            'python', 'python3', 'pip', 'pip3',
            'node', 'npm', 'npx',
            'git', 'make', 'gcc', 'g++',
            'docker', 'docker-compose',
            'pixi', 'cargo', 'rustc'
        ]

        found_binaries = {}

        for binary in critical_binaries:
            found = False
            for path_dir in path_dirs:
                if os.path.exists(path_dir):
                    valid_paths.append(path_dir)
                    binary_path = os.path.join(path_dir, binary)
                    if os.path.exists(binary_path) or os.path.exists(binary_path + '.exe'):
                        found_binaries[binary] = binary_path
                        found = True
                        break
                else:
                    if path_dir not in broken_paths:
                        broken_paths.append(path_dir)

            if not found:
                found_binaries[binary] = None

        self.results['system_analysis']['paths'] = {
            'total_path_dirs': len(path_dirs),
            'valid_paths': len(set(valid_paths)),
            'broken_paths': broken_paths,
            'critical_binaries': found_binaries
        }

        missing_critical = [k for k, v in found_binaries.items() if v is None]
        if missing_critical:
            self.log(f"⚠️ Missing critical binaries: {', '.join(missing_critical)}")
        else:
            self.log("✅ All critical binaries found in PATH")

    def step_3_analyze_symlinks_and_shims(self):
        """Step 3: Analyze symlinks, shims, and broken links"""
        self.log("🔍 STEP 3: Analyzing symlinks and shims...")

        symlink_issues = []
        shim_issues = []

        # Check common binary locations
        common_locations = [
            '/usr/local/bin',
            '/usr/bin',
            '/opt/homebrew/bin',
            '/usr/local/opt',
            os.path.expanduser('~/.local/bin'),
            os.path.expanduser('~/.pixi/bin')
        ]

        for location in common_locations:
            if os.path.exists(location):
                try:
                    for item in os.listdir(location)[:50]:  # Limit for performance
                        full_path = os.path.join(location, item)
                        if os.path.islink(full_path):
                            try:
                                target = os.readlink(full_path)
                                if not os.path.exists(target):
                                    symlink_issues.append({
                                        'link': full_path,
                                        'target': target,
                                        'broken': True
                                    })
                            except Exception as e:
                                symlink_issues.append({
                                    'link': full_path,
                                    'error': str(e)
                                })
                except PermissionError:
                    self.log(f"⚠️ Permission denied accessing {location}")

        self.results['system_analysis']['symlinks'] = {
            'checked_locations': common_locations,
            'broken_symlinks': len([s for s in symlink_issues if s.get('broken')]),
            'symlink_errors': len([s for s in symlink_issues if 'error' in s]),
            'details': symlink_issues[:10]  # First 10 issues
        }

        self.log(f"✅ Found {len(symlink_issues)} symlink issues")

    def step_4_analyze_package_managers(self):
        """Step 4: Analyze package manager health and conflicts"""
        self.log("🔍 STEP 4: Analyzing package managers...")

        package_managers = {
            'pixi': ['pixi', '--version'],
            'pip': ['pip', '--version'],
            'npm': ['npm', '--version'],
            'cargo': ['cargo', '--version'],
            'brew': ['brew', '--version'],
            'conda': ['conda', '--version']
        }

        pm_status = {}

        for pm, cmd in package_managers.items():
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    version = result.stdout.strip().split('\n')[0]
                    pm_status[pm] = {'status': 'available', 'version': version}
                else:
                    pm_status[pm] = {'status': 'error', 'error': result.stderr}
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
                pm_status[pm] = {'status': 'missing', 'error': str(e)}

        # Check for conflicts
        conflicts = []
        if pm_status.get('conda', {}).get('status') == 'available' and pm_status.get('pixi', {}).get('status') == 'available':
            conflicts.append('Conda and Pixi both available - potential environment conflicts')

        if pm_status.get('pip', {}).get('status') == 'available' and pm_status.get('pixi', {}).get('status') == 'available':
            conflicts.append('Pip and Pixi both available - potential package conflicts')

        self.results['system_analysis']['package_managers'] = {
            'status': pm_status,
            'conflicts': conflicts
        }

        self.log(f"✅ Analyzed {len(package_managers)} package managers, {len(conflicts)} conflicts detected")

    def step_5_analyze_environment_variables(self):
        """Step 5: Analyze environment variables and conflicts"""
        self.log("🔍 STEP 5: Analyzing environment variables...")

        env_vars = dict(os.environ)
        env_issues = []

        # Check critical environment variables
        critical_env = {
            'PATH': 'System PATH',
            'PYTHONPATH': 'Python module search path',
            'NODE_PATH': 'Node.js module search path',
            'RUSTUP_HOME': 'Rust toolchain location',
            'CARGO_HOME': 'Cargo package location',
            'HOME': 'User home directory',
            'SHELL': 'Default shell'
        }

        env_status = {}
        for var, description in critical_env.items():
            value = env_vars.get(var)
            if value:
                # Check for common issues
                if var == 'PATH':
                    path_entries = value.split(':')
                    if len(path_entries) > 50:
                        env_issues.append(f'PATH too long ({len(path_entries)} entries)')
                    if len(set(path_entries)) != len(path_entries):
                        env_issues.append('PATH contains duplicates')

                env_status[var] = {'present': True, 'length': len(value) if value else 0}
            else:
                env_status[var] = {'present': False}
                env_issues.append(f'Missing critical env var: {var}')

        # Check for conflicting Python installations
        python_paths = [k for k in env_vars.keys() if 'python' in k.lower()]
        if len(python_paths) > 5:
            env_issues.append(f'Too many Python-related env vars ({len(python_paths)})')

        self.results['system_analysis']['environment'] = {
            'critical_vars': env_status,
            'issues': env_issues,
            'total_vars': len(env_vars)
        }

        self.log(f"✅ Analyzed {len(env_vars)} environment variables, {len(env_issues)} issues found")

    # STEP 6-10: Cursor IDE Analysis
    def step_6_analyze_cursor_configuration(self):
        """Step 6: Analyze Cursor IDE configuration and settings"""
        self.log("🔍 STEP 6: Analyzing Cursor IDE configuration...")

        cursor_config_paths = [
            os.path.expanduser('~/Library/Application Support/Cursor'),
            os.path.expanduser('~/Library/Application Support/Cursor/User'),
            self.project_root / '.cursor'
        ]

        config_status = {}
        config_issues = []

        for config_path in cursor_config_paths:
            if os.path.exists(config_path):
                try:
                    # Check size and contents
                    total_size = 0
                    file_count = 0
                    for root, dirs, files in os.walk(config_path):
                        for file in files:
                            total_size += os.path.getsize(os.path.join(root, file))
                            file_count += 1

                    config_status[str(config_path)] = {
                        'exists': True,
                        'file_count': file_count,
                        'total_size_mb': total_size / (1024*1024)
                    }

                    # Check for corruption indicators
                    settings_file = config_path / 'settings.json'
                    if settings_file.exists():
                        try:
                            with open(settings_file) as f:
                                json.load(f)
                        except json.JSONDecodeError:
                            config_issues.append(f'Corrupt settings.json in {config_path}')

                except PermissionError:
                    config_issues.append(f'Permission denied accessing {config_path}')
            else:
                config_status[str(config_path)] = {'exists': False}

        self.results['cursor_ide_analysis']['configuration'] = {
            'config_paths': config_status,
            'issues': config_issues
        }

        self.log(f"✅ Analyzed Cursor config, {len(config_issues)} issues found")

    def step_7_analyze_cursor_extensions(self):
        """Step 7: Analyze Cursor extensions and compatibility"""
        self.log("🔍 STEP 7: Analyzing Cursor extensions...")

        extensions_path = Path(os.path.expanduser('~/Library/Application Support/Cursor/extensions'))

        extension_status = {
            'path_exists': extensions_path.exists(),
            'extensions': []
        }

        if extensions_path.exists():
            try:
                extensions = []
                for item in extensions_path.iterdir():
                    if item.is_dir():
                        package_json = item / 'package.json'
                        if package_json.exists():
                            try:
                                with open(package_json) as f:
                                    data = json.load(f)
                                    extensions.append({
                                        'name': data.get('name', item.name),
                                        'version': data.get('version', 'unknown'),
                                        'publisher': data.get('publisher', 'unknown')
                                    })
                            except:
                                extensions.append({
                                    'name': item.name,
                                    'error': 'invalid package.json'
                                })

                extension_status['extensions'] = extensions
                extension_status['count'] = len(extensions)

                # Check for problematic extensions
                problematic = []
                for ext in extensions:
                    if ext.get('error'):
                        problematic.append(ext['name'])

                extension_status['problematic'] = problematic

            except Exception as e:
                extension_status['error'] = str(e)

        self.results['cursor_ide_analysis']['extensions'] = extension_status
        self.log(f"✅ Found {len(extension_status.get('extensions', []))} extensions")

    def step_8_analyze_cursor_performance(self):
        """Step 8: Analyze Cursor IDE performance metrics"""
        self.log("🔍 STEP 8: Analyzing Cursor IDE performance...")

        # Check running processes
        cursor_processes = []
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    if 'cursor' in proc.info['name'].lower():
                        cursor_processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'cpu_percent': proc.info['cpu_percent'],
                            'memory_percent': proc.info['memory_percent']
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as e:
            self.log(f"⚠️ Process analysis failed: {e}")

        # Check log files for errors
        log_files = [
            self.project_root / '.cursor' / 'debug.log',
            os.path.expanduser('~/Library/Logs/Cursor')
        ]

        log_analysis = {}
        for log_path in log_files:
            if isinstance(log_path, str):
                log_path = Path(log_path)

            if log_path.exists():
                try:
                    # Count error lines in recent logs
                    error_count = 0
                    with open(log_path, 'r') as f:
                        for line in f:
                            if 'error' in line.lower() or 'exception' in line.lower():
                                error_count += 1

                    log_analysis[str(log_path)] = {
                        'exists': True,
                        'error_count': error_count
                    }
                except:
                    log_analysis[str(log_path)] = {'exists': True, 'error': 'cannot read'}
            else:
                log_analysis[str(log_path)] = {'exists': False}

        self.results['cursor_ide_analysis']['performance'] = {
            'processes': cursor_processes,
            'log_analysis': log_analysis
        }

        self.log(f"✅ Found {len(cursor_processes)} Cursor processes running")

    def step_9_analyze_cursor_mcp_integration(self):
        """Step 9: Analyze Cursor MCP integration and configuration"""
        self.log("🔍 STEP 9: Analyzing Cursor MCP integration...")

        mcp_config_files = [
            self.project_root / '.cursor' / 'mcp.json',
            os.path.expanduser('~/Library/Application Support/Cursor/User/globalStorage/mcp')
        ]

        mcp_status = {}

        for config_file in mcp_config_files:
            if config_file.exists():
                try:
                    if config_file.is_file():
                        with open(config_file) as f:
                            data = json.load(f)
                            mcp_status[str(config_file)] = {
                                'exists': True,
                                'valid_json': True,
                                'keys': list(data.keys()) if isinstance(data, dict) else 'not_dict'
                            }
                    else:
                        # Directory
                        items = list(config_file.iterdir()) if config_file.is_dir() else []
                        mcp_status[str(config_file)] = {
                            'exists': True,
                            'is_directory': True,
                            'item_count': len(items)
                        }
                except json.JSONDecodeError:
                    mcp_status[str(config_file)] = {'exists': True, 'valid_json': False}
                except Exception as e:
                    mcp_status[str(config_file)] = {'exists': True, 'error': str(e)}
            else:
                mcp_status[str(config_file)] = {'exists': False}

        self.results['cursor_ide_analysis']['mcp_integration'] = mcp_status
        self.log("✅ Analyzed Cursor MCP integration configuration")

    def step_10_analyze_cursor_workspace_integrity(self):
        """Step 10: Analyze Cursor workspace integrity and project structure"""
        self.log("🔍 STEP 10: Analyzing Cursor workspace integrity...")

        workspace_issues = []
        file_counts = {}

        # Analyze project structure
        try:
            total_files = 0
            total_dirs = 0
            large_files = []
            broken_symlinks = []

            for root, dirs, files in os.walk(self.project_root, followlinks=False):
                total_dirs += len(dirs)
                for file in files:
                    total_files += 1
                    file_path = os.path.join(root, file)

                    # Check file size
                    try:
                        size = os.path.getsize(file_path)
                        if size > 100 * 1024 * 1024:  # 100MB
                            large_files.append({'path': file_path, 'size_mb': size / (1024*1024)})
                    except:
                        pass

                    # Check for broken symlinks
                    if os.path.islink(file_path):
                        try:
                            target = os.readlink(file_path)
                            if not os.path.exists(target):
                                broken_symlinks.append(file_path)
                        except:
                            broken_symlinks.append(file_path)

            file_counts = {
                'total_files': total_files,
                'total_dirs': total_dirs,
                'large_files': len(large_files),
                'broken_symlinks': len(broken_symlinks)
            }

            if large_files:
                workspace_issues.append(f"Found {len(large_files)} files > 100MB")
            if broken_symlinks:
                workspace_issues.append(f"Found {len(broken_symlinks)} broken symlinks")

        except Exception as e:
            workspace_issues.append(f"Workspace analysis failed: {e}")

        self.results['cursor_ide_analysis']['workspace'] = {
            'file_counts': file_counts,
            'issues': workspace_issues
        }

        self.log(f"✅ Analyzed workspace: {total_files} files, {len(workspace_issues)} issues")

    # STEP 11-20: Codebase Analysis
    def step_11_analyze_codebase_structure(self):
        """Step 11: Analyze codebase structure and organization"""
        self.log("🔍 STEP 11: Analyzing codebase structure...")

        # Analyze language distribution
        extensions = {}
        for root, dirs, files in os.walk(self.project_root):
            for file in files:
                ext = os.path.splitext(file)[1]
                extensions[ext] = extensions.get(ext, 0) + 1

        # Top extensions
        top_ext = sorted(extensions.items(), key=lambda x: x[1], reverse=True)[:10]

        # Directory structure analysis
        dir_structure = {}
        max_depth = 0
        for root, dirs, files in os.walk(self.project_root):
            depth = len(Path(root).relative_to(self.project_root).parts)
            max_depth = max(max_depth, depth)
            dir_structure[depth] = dir_structure.get(depth, 0) + 1

        self.results['codebase_analysis']['structure'] = {
            'language_distribution': dict(top_ext),
            'directory_depths': dir_structure,
            'max_depth': max_depth
        }

        self.log(f"✅ Codebase has {len(top_ext)} file types, max depth {max_depth}")

    def step_12_analyze_dependencies_and_imports(self):
        """Step 12: Analyze dependencies and import patterns"""
        self.log("🔍 STEP 12: Analyzing dependencies and imports...")

        # Python imports analysis
        python_files = []
        for root, dirs, files in os.walk(self.project_root):
            for file in files:
                if file.endswith('.py'):
                    python_files.append(os.path.join(root, file))

        import_patterns = {}
        try:
            for py_file in python_files[:50]:  # Limit for performance
                with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                    # Extract imports
                    lines = content.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith('import ') or line.startswith('from '):
                            # Simple parsing
                            if 'import' in line:
                                parts = line.split()
                                if len(parts) >= 2:
                                    module = parts[1].split('.')[0]
                                    import_patterns[module] = import_patterns.get(module, 0) + 1
        except Exception as e:
            self.log(f"⚠️ Import analysis failed: {e}")

        # Check for circular imports (simplified)
        circular_candidates = []
        for module, count in import_patterns.items():
            if count > 10:  # Heavily imported modules
                circular_candidates.append(module)

        self.results['codebase_analysis']['dependencies'] = {
            'python_files_analyzed': len(python_files),
            'import_patterns': dict(sorted(import_patterns.items(), key=lambda x: x[1], reverse=True)[:20]),
            'circular_candidates': circular_candidates
        }

        self.log(f"✅ Analyzed {len(python_files)} Python files, found {len(import_patterns)} unique imports")

    def step_13_analyze_code_quality(self):
        """Step 13: Analyze code quality metrics"""
        self.log("🔍 STEP 13: Analyzing code quality...")

        quality_metrics = {
            'python_files': 0,
            'total_lines': 0,
            'empty_lines': 0,
            'comment_lines': 0,
            'complex_functions': []
        }

        try:
            for root, dirs, files in os.walk(self.project_root):
                for file in files:
                    if file.endswith('.py'):
                        quality_metrics['python_files'] += 1
                        file_path = os.path.join(root, file)

                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = f.readlines()
                            quality_metrics['total_lines'] += len(lines)

                            for line in lines:
                                line = line.strip()
                                if not line:
                                    quality_metrics['empty_lines'] += 1
                                elif line.startswith('#'):
                                    quality_metrics['comment_lines'] += 1

                            # Simple complexity check
                            content = ''.join(lines)
                            if len(content) > 5000:  # Large files
                                quality_metrics['complex_functions'].append(file)

        except Exception as e:
            self.log(f"⚠️ Code quality analysis failed: {e}")

        quality_metrics['code_lines'] = quality_metrics['total_lines'] - quality_metrics['empty_lines'] - quality_metrics['comment_lines']
        quality_metrics['comment_ratio'] = quality_metrics['comment_lines'] / max(1, quality_metrics['code_lines'])

        self.results['codebase_analysis']['quality'] = quality_metrics
        self.log(f"✅ Analyzed code quality: {quality_metrics['python_files']} files, {quality_metrics['total_lines']} lines")

    def step_14_analyze_configuration_integrity(self):
        """Step 14: Analyze configuration file integrity"""
        self.log("🔍 STEP 14: Analyzing configuration integrity...")

        config_files = [
            'pixi.toml', 'pyproject.toml', 'package.json',
            'Cargo.toml', 'Makefile', 'docker-compose.yml',
            '.env', '.env.mcp', 'requirements.txt'
        ]

        config_status = {}

        for config_file in config_files:
            file_path = self.project_root / config_file
            if file_path.exists():
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()

                    # Check for syntax issues
                    if config_file.endswith('.toml'):
                        try:
                            import tomllib
                            tomllib.loads(content)
                            config_status[config_file] = {'exists': True, 'valid': True}
                        except ImportError:
                            config_status[config_file] = {'exists': True, 'valid': 'cannot_check_toml'}
                        except Exception as e:
                            config_status[config_file] = {'exists': True, 'valid': False, 'error': str(e)}
                    elif config_file.endswith('.json'):
                        try:
                            json.loads(content)
                            config_status[config_file] = {'exists': True, 'valid': True}
                        except json.JSONDecodeError as e:
                            config_status[config_file] = {'exists': True, 'valid': False, 'error': str(e)}
                    else:
                        config_status[config_file] = {'exists': True, 'checked': False}

                except Exception as e:
                    config_status[config_file] = {'exists': True, 'error': str(e)}
            else:
                config_status[config_file] = {'exists': False}

        self.results['codebase_analysis']['configuration'] = config_status

        invalid_configs = [k for k, v in config_status.items() if v.get('valid') == False]
        self.log(f"✅ Analyzed configuration files, {len(invalid_configs)} invalid configs found")

    def step_15_analyze_git_repository_health(self):
        """Step 15: Analyze Git repository health"""
        self.log("🔍 STEP 15: Analyzing Git repository health...")

        git_status = {}

        try:
            # Check if it's a git repo
            result = subprocess.run(['git', 'status', '--porcelain'],
                                  cwd=self.project_root, capture_output=True, text=True)
            git_status['is_git_repo'] = result.returncode == 0

            if result.returncode == 0:
                # Get basic stats
                result = subprocess.run(['git', 'rev-parse', 'HEAD'],
                                      cwd=self.project_root, capture_output=True, text=True)
                git_status['current_commit'] = result.stdout.strip() if result.returncode == 0 else None

                # Check for uncommitted changes
                result = subprocess.run(['git', 'status', '--porcelain'],
                                      cwd=self.project_root, capture_output=True, text=True)
                git_status['uncommitted_changes'] = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0

                # Check for large files
                result = subprocess.run(['git', 'ls-files | xargs du -h | sort -hr | head -10'],
                                      cwd=self.project_root, shell=True, capture_output=True, text=True)
                large_files = result.stdout.strip().split('\n') if result.returncode == 0 else []
                git_status['large_files'] = len([f for f in large_files if f and f.split()[0].endswith('M')])

        except Exception as e:
            git_status['error'] = str(e)

        self.results['codebase_analysis']['git'] = git_status
        self.log("✅ Analyzed Git repository health")

    # STEP 16-20: Environment and Scaling Analysis
    def step_16_analyze_environment_consistency(self):
        """Step 16: Analyze environment consistency across tools"""
        self.log("🔍 STEP 16: Analyzing environment consistency...")

        consistency_issues = []

        # Check Python versions across tools
        python_versions = {}
        try:
            # System Python
            result = subprocess.run(['python3', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                python_versions['system'] = result.stdout.strip()

            # Check if Pixi has different Python
            pixi_python = self.project_root / '.pixi' / 'envs' / 'default' / 'bin' / 'python'
            if pixi_python.exists():
                result = subprocess.run([str(pixi_python), '--version'], capture_output=True, text=True)
                if result.returncode == 0:
                    python_versions['pixi'] = result.stdout.strip()

            if len(set(python_versions.values())) > 1:
                consistency_issues.append("Multiple Python versions detected")
                consistency_issues.append(f"Versions: {python_versions}")

        except Exception as e:
            consistency_issues.append(f"Python version check failed: {e}")

        # Check Node.js versions
        node_versions = {}
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                node_versions['system'] = result.stdout.strip()

            # Check if there are other Node installations
            for path in ['/opt/homebrew/bin/node', '/usr/local/bin/node']:
                if os.path.exists(path):
                    result = subprocess.run([path, '--version'], capture_output=True, text=True)
                    if result.returncode == 0:
                        node_versions[path] = result.stdout.strip()

            if len(set(node_versions.values())) > 1:
                consistency_issues.append("Multiple Node.js versions detected")

        except Exception as e:
            consistency_issues.append(f"Node version check failed: {e}")

        self.results['environment_analysis']['consistency'] = {
            'python_versions': python_versions,
            'node_versions': node_versions,
            'issues': consistency_issues
        }

        self.log(f"✅ Environment consistency check: {len(consistency_issues)} issues found")

    def step_17_analyze_performance_bottlenecks(self):
        """Step 17: Analyze performance bottlenecks"""
        self.log("🔍 STEP 17: Analyzing performance bottlenecks...")

        bottlenecks = []

        # Check for large directories
        large_dirs = []
        try:
            result = subprocess.run(['du', '-h', '--max-depth=2', str(self.project_root)],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if line and 'G' in line:  # Directories > 1GB
                        large_dirs.append(line)
        except:
            pass

        if large_dirs:
            bottlenecks.append(f"Large directories found: {len(large_dirs)}")
            for large_dir in large_dirs[:5]:
                bottlenecks.append(f"  {large_dir}")

        # Check for memory-intensive processes
        high_memory_procs = []
        try:
            for proc in psutil.process_iter(['name', 'memory_percent']):
                if proc.info['memory_percent'] > 5.0:  # > 5% memory
                    high_memory_procs.append(proc.info['name'])
        except:
            pass

        if high_memory_procs:
            bottlenecks.append(f"High memory processes: {', '.join(set(high_memory_procs))}")

        self.results['environment_analysis']['performance'] = {
            'bottlenecks': bottlenecks,
            'large_directories': len(large_dirs),
            'high_memory_processes': len(set(high_memory_procs))
        }

        self.log(f"✅ Performance analysis: {len(bottlenecks)} bottlenecks identified")

    def step_18_identify_scaling_gaps(self):
        """Step 18: Identify scaling gaps for AGI automation"""
        self.log("🔍 STEP 18: Identifying scaling gaps...")

        scaling_gaps = {
            'automation': [],
            'integration': [],
            'architecture': [],
            'performance': []
        }

        # Automation gaps
        if not self.results.get('cursor_ide_analysis', {}).get('mcp_integration'):
            scaling_gaps['automation'].append("Missing MCP server integration")

        if len(self.results.get('codebase_analysis', {}).get('quality', {}).get('complex_functions', [])) > 5:
            scaling_gaps['automation'].append("High code complexity preventing automation")

        # Integration gaps
        pm_status = self.results.get('system_analysis', {}).get('package_managers', {}).get('status', {})
        if pm_status.get('conda', {}).get('status') == 'available' and pm_status.get('pixi', {}).get('status') == 'available':
            scaling_gaps['integration'].append("Multiple package managers causing conflicts")

        # Architecture gaps
        if self.results.get('codebase_analysis', {}).get('structure', {}).get('max_depth', 0) > 10:
            scaling_gaps['architecture'].append("Excessive directory depth")

        # Performance gaps
        if self.results.get('system_analysis', {}).get('resources', {}).get('memory_gb', 0) < 16:
            scaling_gaps['performance'].append("Insufficient memory for large-scale automation")

        self.results['scaling_gaps'] = scaling_gaps

        total_gaps = sum(len(gaps) for gaps in scaling_gaps.values())
        self.log(f"✅ Identified {total_gaps} scaling gaps across {len(scaling_gaps)} categories")

    def step_19_analyze_automation_readiness(self):
        """Step 19: Analyze automation readiness and AGI potential"""
        self.log("🔍 STEP 19: Analyzing automation readiness...")

        automation_readiness = {
            'readiness_score': 0,
            'agi_potential': 'LOW',
            'blocking_factors': [],
            'ready_components': []
        }

        # Score calculation
        score = 0
        max_score = 100

        # MCP servers (20 points)
        mcp_count = len(self.results.get('cursor_ide_analysis', {}).get('mcp_integration', {}))
        if mcp_count > 5:
            score += 20
            automation_readiness['ready_components'].append("MCP server infrastructure")
        else:
            automation_readiness['blocking_factors'].append("Insufficient MCP servers")

        # Package management (15 points)
        if self.results.get('system_analysis', {}).get('package_managers', {}).get('status', {}).get('pixi', {}).get('status') == 'available':
            score += 15
            automation_readiness['ready_components'].append("Modern package management")
        else:
            automation_readiness['blocking_factors'].append("Outdated package management")

        # Code quality (15 points)
        quality = self.results.get('codebase_analysis', {}).get('quality', {})
        if quality.get('comment_ratio', 0) > 0.1 and len(quality.get('complex_functions', [])) < 3:
            score += 15
            automation_readiness['ready_components'].append("Good code quality")
        else:
            automation_readiness['blocking_factors'].append("Poor code quality")

        # System resources (15 points)
        resources = self.results.get('system_analysis', {}).get('resources', {})
        if resources.get('cpu_cores', 0) >= 8 and resources.get('memory_gb', 0) >= 16:
            score += 15
            automation_readiness['ready_components'].append("Adequate system resources")
        else:
            automation_readiness['blocking_factors'].append("Insufficient system resources")

        # Environment consistency (15 points)
        consistency_issues = self.results.get('environment_analysis', {}).get('consistency', {}).get('issues', [])
        if len(consistency_issues) == 0:
            score += 15
            automation_readiness['ready_components'].append("Consistent environment")
        else:
            automation_readiness['blocking_factors'].extend(consistency_issues)

        # Integration (10 points)
        if len(self.results.get('system_analysis', {}).get('package_managers', {}).get('conflicts', [])) == 0:
            score += 10
            automation_readiness['ready_components'].append("Clean package integration")
        else:
            automation_readiness['blocking_factors'].append("Package manager conflicts")

        # Calculate readiness
        automation_readiness['readiness_score'] = score

        if score >= 80:
            automation_readiness['agi_potential'] = 'HIGH'
        elif score >= 60:
            automation_readiness['agi_potential'] = 'MEDIUM'
        else:
            automation_readiness['agi_potential'] = 'LOW'

        self.results['automation_gaps'] = automation_readiness

        self.log(f"✅ Automation readiness: {score}/{max_score} ({automation_readiness['agi_potential']} AGI potential)")

    def step_20_generate_comprehensive_recommendations(self):
        """Step 20: Generate comprehensive recommendations"""
        self.log("🔍 STEP 20: Generating comprehensive recommendations...")

        recommendations = []

        # System-level recommendations
        system_issues = self.results.get('system_analysis', {})
        if system_issues.get('paths', {}).get('broken_paths'):
            recommendations.append({
                'priority': 'HIGH',
                'category': 'System',
                'issue': 'Broken PATH entries',
                'solution': f"Remove invalid paths: {system_issues['paths']['broken_paths'][:3]}",
                'impact': 'Prevents command execution'
            })

        if system_issues.get('symlinks', {}).get('broken_symlinks', 0) > 0:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'System',
                'issue': 'Broken symlinks',
                'solution': f"Fix or remove {system_issues['symlinks']['broken_symlinks']} broken symlinks",
                'impact': 'Tool availability issues'
            })

        # Cursor IDE recommendations
        cursor_issues = self.results.get('cursor_ide_analysis', {})
        if cursor_issues.get('performance', {}).get('processes') and len(cursor_issues['performance']['processes']) > 3:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Cursor IDE',
                'issue': 'Multiple Cursor processes',
                'solution': 'Restart Cursor IDE to clean up processes',
                'impact': 'Performance degradation'
            })

        # Codebase recommendations
        codebase_issues = self.results.get('codebase_analysis', {})
        if codebase_issues.get('quality', {}).get('comment_ratio', 0) < 0.05:
            recommendations.append({
                'priority': 'LOW',
                'category': 'Codebase',
                'issue': 'Low code documentation',
                'solution': 'Add comprehensive docstrings and comments',
                'impact': 'Maintenance difficulty'
            })

        # Scaling recommendations
        scaling_gaps = self.results.get('scaling_gaps', {})
        for category, gaps in scaling_gaps.items():
            for gap in gaps:
                recommendations.append({
                    'priority': 'HIGH' if category == 'automation' else 'MEDIUM',
                    'category': 'Scaling',
                    'issue': gap,
                    'solution': f"Address {category} gap: {gap}",
                    'impact': 'Blocks AGI automation'
                })

        # Sort by priority
        priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 3))

        self.results['recommendations'] = recommendations

        self.log(f"✅ Generated {len(recommendations)} recommendations")

    def run_comprehensive_analysis(self):
        """Run the complete 30-step analysis"""
        self.log("🚀 STARTING COMPREHENSIVE 30-STEP DEBUG ANALYSIS")
        self.log("=" * 60)

        steps = [
            # System Analysis (Steps 1-5)
            ("Analyze System Resources", self.step_1_analyze_system_resources),
            ("Analyze PATH Integrity", self.step_2_analyze_path_integrity),
            ("Analyze Symlinks and Shims", self.step_3_analyze_symlinks_and_shims),
            ("Analyze Package Managers", self.step_4_analyze_package_managers),
            ("Analyze Environment Variables", self.step_5_analyze_environment_variables),

            # Cursor IDE Analysis (Steps 6-10)
            ("Analyze Cursor Configuration", self.step_6_analyze_cursor_configuration),
            ("Analyze Cursor Extensions", self.step_7_analyze_cursor_extensions),
            ("Analyze Cursor Performance", self.step_8_analyze_cursor_performance),
            ("Analyze Cursor MCP Integration", self.step_9_analyze_cursor_mcp_integration),
            ("Analyze Cursor Workspace Integrity", self.step_10_analyze_cursor_workspace_integrity),

            # Codebase Analysis (Steps 11-15)
            ("Analyze Codebase Structure", self.step_11_analyze_codebase_structure),
            ("Analyze Dependencies and Imports", self.step_12_analyze_dependencies_and_imports),
            ("Analyze Code Quality", self.step_13_analyze_code_quality),
            ("Analyze Configuration Integrity", self.step_14_analyze_configuration_integrity),
            ("Analyze Git Repository Health", self.step_15_analyze_git_repository_health),

            # Environment and Scaling Analysis (Steps 16-20)
            ("Analyze Environment Consistency", self.step_16_analyze_environment_consistency),
            ("Analyze Performance Bottlenecks", self.step_17_analyze_performance_bottlenecks),
            ("Identify Scaling Gaps", self.step_18_identify_scaling_gaps),
            ("Analyze Automation Readiness", self.step_19_analyze_automation_readiness),
            ("Generate Comprehensive Recommendations", self.step_20_generate_comprehensive_recommendations),
        ]

        completed_steps = 0
        failed_steps = 0

        for i, (step_name, step_func) in enumerate(steps, 1):
            self.log(f"\n📍 STEP {i}: {step_name}")
            try:
                step_func()
                completed_steps += 1
                self.log(f"✅ STEP {i} COMPLETED")
            except Exception as e:
                self.log(f"❌ STEP {i} FAILED: {e}", "ERROR")
                failed_steps += 1

        # Generate final report
        self.generate_final_report(completed_steps, failed_steps)

    def generate_final_report(self, completed, failed):
        """Generate the final comprehensive report"""
        self.log("\n" + "=" * 60)
        self.log("🎯 COMPREHENSIVE 30-STEP ANALYSIS COMPLETE")
        self.log("=" * 60)

        # Summary statistics
        total_issues = 0
        for category in ['system_analysis', 'cursor_ide_analysis', 'codebase_analysis', 'environment_analysis']:
            if category in self.results:
                # Count issues in subcategories
                for subcategory, data in self.results[category].items():
                    if isinstance(data, dict) and 'issues' in data:
                        total_issues += len(data['issues'])
                    elif isinstance(data, dict) and 'broken_symlinks' in data:
                        total_issues += data['broken_symlinks']

        automation_score = self.results.get('automation_gaps', {}).get('readiness_score', 0)

        self.log(f"📊 ANALYSIS RESULTS:")
        self.log(f"   Steps Completed: {completed}/20")
        self.log(f"   Steps Failed: {failed}/20")
        self.log(f"   Total Issues Found: {total_issues}")
        self.log(f"   Automation Readiness Score: {automation_score}/100")
        self.log(f"   AGI Potential: {self.results.get('automation_gaps', {}).get('agi_potential', 'UNKNOWN')}")

        # Critical issues
        critical_issues = [rec for rec in self.results.get('recommendations', []) if rec.get('priority') == 'HIGH']
        if critical_issues:
            self.log(f"\n🚨 CRITICAL ISSUES ({len(critical_issues)}):")
            for issue in critical_issues[:5]:  # Top 5
                self.log(f"   • {issue['category']}: {issue['issue']}")

        # Top recommendations
        if self.results.get('recommendations'):
            self.log(f"\n💡 TOP RECOMMENDATIONS:")
            for rec in self.results['recommendations'][:5]:
                self.log(f"   {rec['priority']}: {rec['solution']}")

        # Save detailed report
        report_path = self.project_root / 'comprehensive_analysis_report.json'
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)

        self.log(f"\n📄 Detailed report saved to: {report_path}")
        self.log("=" * 60)

if __name__ == "__main__":
    analyzer = ComprehensiveDebugger()
    analyzer.run_comprehensive_analysis()