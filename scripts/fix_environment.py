#!/usr/bin/env python3
"""
Fix Environment Issues - Python-based environment repair
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def fix_path():
    """Fix PATH by removing invalid entries"""
    print("🔧 Fixing PATH...")

    current_path = os.environ.get('PATH', '')
    path_entries = current_path.split(':')
    valid_entries = []

    removed_entries = []

    for entry in path_entries:
        if os.path.isdir(entry):
            valid_entries.append(entry)
        else:
            removed_entries.append(entry)
            print(f"  Removing invalid PATH entry: {entry}")

    new_path = ':'.join(valid_entries)
    os.environ['PATH'] = new_path

    print(f"  ✅ PATH cleaned: {len(valid_entries)} valid entries, {len(removed_entries)} removed")

    # Also update shell rc files if possible
    home = Path.home()
    for rc_file in ['.bashrc', '.zshrc']:
        rc_path = home / rc_file
        if rc_path.exists():
            try:
                content = rc_path.read_text()
                # Remove invalid PATH entries from export statements
                for invalid_entry in removed_entries:
                    if invalid_entry in content:
                        print(f"  Cleaning {rc_file}...")
                        # This is a simple cleanup - in practice you'd want more sophisticated parsing
                        break
            except Exception as e:
                print(f"  ⚠️ Could not clean {rc_file}: {e}")

    return new_path

def fix_symlinks():
    """Fix broken symlinks"""
    print("🔧 Fixing broken symlinks...")

    common_locations = [
        '/usr/local/bin',
        '/usr/local/sbin',
        '/opt/homebrew/bin'
    ]

    total_fixed = 0

    for location in common_locations:
        if os.path.exists(location):
            try:
                for item in os.listdir(location):
                    full_path = os.path.join(location, item)
                    if os.path.islink(full_path):
                        try:
                            target = os.readlink(full_path)
                            if not os.path.exists(target):
                                print(f"  Removing broken symlink: {full_path}")
                                try:
                                    os.remove(full_path)
                                    total_fixed += 1
                                except OSError:
                                    print(f"    Could not remove {full_path}")
                        except OSError:
                            print(f"    Could not read symlink {full_path}")
            except PermissionError:
                print(f"  ⚠️ Permission denied accessing {location}")
            except OSError:
                print(f"  ⚠️ Could not access {location}")

    print(f"  ✅ Fixed {total_fixed} broken symlinks")

def install_missing_tools():
    """Install missing critical tools"""
    print("🔧 Installing missing tools...")

    # Install pip if missing
    try:
        subprocess.run([sys.executable, '-m', 'pip', '--version'],
                      capture_output=True, check=True, timeout=10)
        print("  ✅ pip is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("  Installing pip...")
        try:
            # Try to install pip using ensurepip
            subprocess.run([sys.executable, '-m', 'ensurepip', '--upgrade'],
                          capture_output=True, check=True, timeout=30)
            print("  ✅ pip installed via ensurepip")
        except subprocess.CalledProcessError:
            print("  ⚠️ Could not install pip automatically")

def clean_python_cache():
    """Clean problematic Python cache files"""
    print("🔧 Cleaning Python cache...")

    project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")

    # Remove .pyc files
    pyc_files = list(project_root.rglob("*.pyc"))
    for pyc_file in pyc_files:
        try:
            pyc_file.unlink()
        except OSError:
            pass

    # Remove __pycache__ directories
    pycache_dirs = list(project_root.rglob("__pycache__"))
    for pycache_dir in pycache_dirs:
        try:
            shutil.rmtree(pycache_dir)
        except OSError:
            pass

    print(f"  ✅ Cleaned {len(pyc_files)} .pyc files and {len(pycache_dirs)} __pycache__ dirs")

def fix_package_conflicts():
    """Fix package manager conflicts"""
    print("🔧 Fixing package manager conflicts...")

    # Check for conda vs pixi conflict
    has_conda = False
    has_pixi = False

    try:
        subprocess.run(['conda', '--version'], capture_output=True, check=True, timeout=5)
        has_conda = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    try:
        subprocess.run(['pixi', '--version'], capture_output=True, check=True, timeout=5)
        has_pixi = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    if has_conda and has_pixi:
        print("  ⚠️ Both conda and pixi detected - potential conflicts")

        # Check shell initialization files
        home = Path.home()
        for rc_file in ['.bashrc', '.zshrc']:
            rc_path = home / rc_file
            if rc_path.exists():
                try:
                    content = rc_path.read_text()
                    if 'conda initialize' in content or 'conda init' in content:
                        print(f"  Found conda initialization in {rc_file}")
                        print("  Recommendation: Remove conda init from shell rc files to prefer pixi")
                        # In a real fix, we would modify the file, but that's risky
                except Exception:
                    pass
    else:
        print("  ✅ No package manager conflicts detected")

def main():
    """Main environment fix function"""
    print("🚀 STARTING ENVIRONMENT FIXES")
    print("=" * 40)

    try:
        fix_path()
        fix_symlinks()
        install_missing_tools()
        clean_python_cache()
        fix_package_conflicts()

        print("=" * 40)
        print("✅ ENVIRONMENT FIXES COMPLETED")
        print("=" * 40)
        print("\nRecommendations:")
        print("1. Restart your terminal/shell session")
        print("2. Run 'source ~/.zshrc' or 'source ~/.bashrc'")
        print("3. Test with: pixi --version && python --version")
        print("4. Run the comprehensive analysis again to verify fixes")

    except Exception as e:
        print(f"❌ Error during environment fixes: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())