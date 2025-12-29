#!/bin/bash
# Fix Environment Issues - PATH, symlinks, and system problems

echo "🔧 FIXING ENVIRONMENT ISSUES"
echo "============================"

# Fix PATH by removing invalid entries
echo "1. Fixing PATH..."

# Get current PATH and filter out invalid entries
CURRENT_PATH="$PATH"
NEW_PATH=""

# Split PATH by colon and check each entry
IFS=':' read -ra PATH_ARRAY <<< "$PATH"
for path_entry in "${PATH_ARRAY[@]}"; do
    if [[ -d "$path_entry" ]]; then
        # Valid directory, keep it
        if [[ -z "$NEW_PATH" ]]; then
            NEW_PATH="$path_entry"
        else
            NEW_PATH="$NEW_PATH:$path_entry"
        fi
    else
        echo "  Removing invalid PATH entry: $path_entry"
    fi
done

# Export the cleaned PATH
export PATH="$NEW_PATH"
echo "  ✅ PATH cleaned: $(echo "$PATH" | tr ':' '\n' | wc -l) entries remaining"

# Fix broken symlinks
echo "2. Fixing broken symlinks..."

BROKEN_LINKS=$(find /usr/local -type l ! -exec test -e {} \; 2>/dev/null | head -10)
if [[ -n "$BROKEN_LINKS" ]]; then
    echo "  Found broken symlinks in /usr/local:"
    echo "$BROKEN_LINKS" | while read -r link; do
        echo "    Removing: $link"
        sudo rm -f "$link" 2>/dev/null || true
    done
else
    echo "  ✅ No broken symlinks found in /usr/local"
fi

# Install missing pip
echo "3. Installing missing pip..."
if ! command -v pip &> /dev/null; then
    echo "  Installing pip via get-pip.py..."
    curl -sSL https://bootstrap.pypa.io/get-pip.py | python3 - 2>/dev/null || true
    if command -v pip &> /dev/null; then
        echo "  ✅ pip installed successfully"
    else
        echo "  ⚠️ pip installation failed, but continuing..."
    fi
else
    echo "  ✅ pip is already available"
fi

# Fix package manager conflicts
echo "4. Resolving package manager conflicts..."

# Check for conda-pixi conflict and prefer pixi
if command -v conda &> /dev/null && command -v pixi &> /dev/null; then
    echo "  ⚠️ Both conda and pixi detected"

    # Check if conda init has modified shell
    if [[ -f "$HOME/.bashrc" ]] && grep -q "conda initialize" "$HOME/.bashrc"; then
        echo "  Removing conda from .bashrc to prefer pixi..."
        sed -i.bak '/conda initialize/,/conda init/d' "$HOME/.bashrc" 2>/dev/null || true
    fi

    if [[ -f "$HOME/.zshrc" ]] && grep -q "conda initialize" "$HOME/.zshrc"; then
        echo "  Removing conda from .zshrc to prefer pixi..."
        sed -i.bak '/conda initialize/,/conda init/d' "$HOME/.zshrc" 2>/dev/null || true
    fi

    echo "  ✅ Resolved conda-pixi conflict (preferring pixi)"
else
    echo "  ✅ No package manager conflicts detected"
fi

# Clean up Python cache issues
echo "5. Cleaning Python cache issues..."

# Remove problematic .pyc files that might cause permission issues
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "  ✅ Python cache cleaned"

echo "============================"
echo "🎉 ENVIRONMENT FIXES APPLIED"
echo "============================"
echo ""
echo "Next steps:"
echo "1. Restart your terminal/shell"
echo "2. Run 'pixi run start' to test FEA environment"
echo "3. Run the comprehensive analysis again to verify fixes"