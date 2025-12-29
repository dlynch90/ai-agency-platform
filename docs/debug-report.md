# Debug Report - Node.js/NPM/PNPM Issues

**Date:** December 28, 2025
**Status:** CRITICAL - NPM Broken, PNPM Working

## 🔍 Issues Identified

### 1. **CRITICAL: NPM Permission Error**

**Error:** `EPERM: operation not permitted` when accessing `/opt/homebrew/lib/node_modules/npm/node_modules/@sigstore/verify/dist/key/index.js`

**Root Cause:** macOS Apple Provenance security feature blocking file access

- File has `com.apple.provenance` extended attribute
- npm v11.7.0 with Node.js v25.2.1 (Homebrew)
- Affects all npm commands requiring signature verification

**Impact:**

- `npm install`, `npm list`, `npm audit` all fail
- Package installation blocked
- MCP server testing fails
- npm-based tooling unusable

### 2. **Log Directory Permission Issues**

**Error:** Cannot write to `${USER_HOME:-$HOME}/.npm/_logs/`
**Status:** Partially resolved by recreation

### 3. **MCP Server Connectivity Issues**

**Root Cause:** Depends on npm, which is broken
**Impact:** `github-mcp` and other MCP servers cannot be tested

## ✅ Working Components

### PNPM (Fully Functional)

- **Version:** 10.26.2
- **Status:** ✅ Optimized and working perfectly
- **Configuration:** Properly aligned with npm ecosystem
- **Features:** All optimizations from previous audit applied

### Node.js Core

- **Version:** v25.2.1
- **Status:** ✅ Working correctly
- **Runtime:** No issues with basic Node.js execution

### Other Tools

- **npx:** ✅ Working
- **1Password CLI (op):** ✅ Working (v2.32.0)
- **Homebrew:** ✅ Working

## 🛠️ Solutions Implemented

### Immediate Workarounds

1. **Use PNPM instead of npm** for all package management
2. **Recreated npm logs directory** with proper permissions
3. **Disabled problematic npm features** (fund, audit, update-notifier)

### Configuration Status

```yaml
# PNPM (Working)
audit-level: moderate
auto-install-peers: true
cache-dir: ~/.pnpm-cache
fetch-retries: 3
resolution-mode: highest

# NPM (Broken - Apple Provenance blocking)
# Cannot execute any commands
```

## 🔧 Required Fixes

### Option 1: Fix NPM (Recommended)

```bash
# Remove Apple Provenance attributes (requires sudo)
sudo xattr -rd com.apple.provenance /opt/homebrew/lib/node_modules/npm/
sudo xattr -rd com.apple.provenance /opt/homebrew/lib/node_modules/npm/node_modules/@sigstore/

# Alternative: Reinstall Node.js/npm via Homebrew
brew reinstall node
```

### Option 2: Migrate to PNPM (Already Working)

- PNPM is fully functional and optimized
- Can handle all npm workflows
- Better performance and features than npm
- Already configured with best practices

### Option 3: Use Node Version Manager

```bash
# Install nvm and use different Node.js version
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install node
nvm use node
```

## 📊 System Health Status

| Component     | Status     | Version | Notes                     |
| ------------- | ---------- | ------- | ------------------------- |
| Node.js       | ✅ Working | v25.2.1 | Runtime functional        |
| NPM           | ❌ Broken  | 11.7.0  | Apple Provenance blocking |
| PNPM          | ✅ Working | 10.26.2 | Fully optimized           |
| npx           | ✅ Working | -       | Can execute packages      |
| 1Password CLI | ✅ Working | 2.32.0  | Authentication working    |
| Homebrew      | ✅ Working | -       | Package management ok     |

## 🚨 Immediate Actions Required

1. **Choose primary fix approach** (Options 1-3 above)
2. **Use PNPM for all package management** until npm is fixed
3. **Test MCP servers with PNPM** instead of npm
4. **Monitor for similar Apple Provenance issues** with other tools

## 📈 Recommendations

### Short Term

- Use PNPM exclusively for package management
- Avoid npm until Apple Provenance issue is resolved
- Test all workflows with PNPM equivalents

### Long Term

- Consider migrating permanently to PNPM (superior performance)
- Monitor macOS security updates that might cause similar issues
- Implement automated permission checking in development setup

## 🔍 Next Steps

1. Apply one of the fix options above
2. Re-test MCP server connectivity
3. Verify npm functionality (if fixed)
4. Update development workflows to use working tools
5. Document permanent solution for team knowledge base

---

**Debug Session:** Complete
**Primary Issue:** macOS Apple Provenance security blocking npm
**Working Alternative:** PNPM fully functional
**Action Required:** Choose and implement fix approach
