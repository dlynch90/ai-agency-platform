# Testing & OpenCode Setup - Complete Guide

## 🎯 Summary

This guide covers:
1. ✅ OpenCode CLI installation and 1Password integration
2. ✅ Test-Driven Development (TDD) setup with Vitest
3. ✅ Code quality validation tools
4. ✅ Security best practices

## 📦 What's Been Set Up

### 1. OpenCode CLI
- **Version**: 1.0.206
- **Location**: `~/.opencode/bin/opencode`
- **Config**: `~/.config/opencode/`

### 2. Testing Framework
- **Framework**: Vitest v1.6.1
- **Coverage**: @vitest/coverage-v8
- **Configuration**: `vitest.config.ts`
- **Test Files**: 
  - `tests/unit/example.test.ts` (7 passing tests)
  - `tests/integration/api.test.ts` (2 passing tests)

### 3. 1Password Integration
- **CLI Version**: 2.30.3
- **Environment Script**: `.opencode-env.sh`

### 4. Documentation
- `docs/TDD_WORKFLOW.md` - Complete TDD guide
- `docs/OPENCODE_SETUP.md` - OpenCode setup and usage
- `scripts/validate-code.sh` - Pre-commit validation

## 🚀 Quick Start

### Step 1: Enable 1Password CLI Integration

1. Open 1Password desktop app
2. Go to: **Settings → Developer**
3. Enable **"Connect with 1Password CLI"**
4. Enable Touch ID for authentication

### Step 2: Configure API Keys

Edit `.opencode-env.sh` and uncomment your API keys:

```bash
# Edit the file
vim /Users/daniellynch/Developer/.opencode-env.sh

# Uncomment the keys you need
export OPENAI_API_KEY=$(op read "op://Private/OpenAI/credential")
export ANTHROPIC_API_KEY=$(op read "op://Private/Anthropic/api_key")
```

### Step 3: Run OpenCode

```bash
# Load secrets from 1Password
source /Users/daniellynch/Developer/.opencode-env.sh

# Launch OpenCode
cd /Users/daniellynch/Developer
opencode
```

## 🧪 Testing Commands

### Run Tests
```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode for TDD
npm test -- --ui            # Interactive UI
```

### Verify Tests Are Working
```bash
npm test
# Should show: Test Files  2 passed (2)
#              Tests  9 passed (9)
```

### Run Quality Checks
```bash
# Run all validations
./scripts/validate-code.sh

# Individual checks
npm run type-check          # TypeScript validation
npm run lint                # ESLint
npm test                    # Unit tests
```

## 📁 Project Structure

```
/Users/daniellynch/Developer/
├── .opencode-env.sh           # 1Password integration script
├── vitest.config.ts           # Vitest configuration
├── package.json               # Dependencies
├── docs/
│   ├── TDD_WORKFLOW.md        # TDD guide
│   └── OPENCODE_SETUP.md      # OpenCode guide
├── scripts/
│   └── validate-code.sh       # Validation script
└── tests/
    ├── setup.ts               # Global test setup
    ├── unit/                  # Unit tests
    │   └── example.test.ts    ✅ 7 passing tests
    └── integration/           # Integration tests
        └── api.test.ts        ✅ 2 passing tests
```

## 🔐 Security Notes

### API Key Storage (1Password)
- ✅ Store all API keys in 1Password
- ✅ Use `op read` to retrieve secrets
- ✅ Never commit secrets to git
- ❌ Never hardcode API keys in code

### Example 1Password Structure
```
1Password Vault: Private
├── OpenAI
│   └── credential: sk-...
├── Anthropic  
│   └── api_key: sk-ant-...
├── Google AI
│   └── credential: AIza...
└── Groq
    └── api_key: gsk_...
```

## 🎯 TDD Workflow

### Red-Green-Refactor Cycle

1. **RED**: Write a failing test
   ```bash
   npm test -- --watch
   # Write test in tests/unit/myfeature.test.ts
   ```

2. **GREEN**: Make it pass
   ```bash
   # Implement minimal code
   # Watch tests turn green
   ```

3. **REFACTOR**: Improve code
   ```bash
   # Refactor while keeping tests green
   ```

## 📊 Coverage Requirements

Current thresholds (80% minimum):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Check coverage:
```bash
npm test -- --coverage
```

## 🛠️ Troubleshooting

### OpenCode not found
```bash
source ~/.zshrc
which opencode
```

### 1Password CLI not working
```bash
op --version
op whoami

# If not authenticated, enable in 1Password app:
# Settings → Developer → Connect with 1Password CLI
```

### Tests failing
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Run tests
npm test
```

## 📚 Resources

### Documentation
- [TDD Workflow](docs/TDD_WORKFLOW.md)
- [OpenCode Setup](docs/OPENCODE_SETUP.md)

### External Links
- [Vitest Docs](https://vitest.dev)
- [OpenCode Docs](https://opencode.ai/docs)
- [1Password CLI Docs](https://developer.1password.com/docs/cli/)

## ✅ Verification Checklist

Run these to verify everything works:

- [ ] OpenCode installed: `opencode --version`
- [ ] 1Password CLI working: `op --version`
- [ ] Tests passing: `npm test`
- [ ] Type checking: `npm run type-check`
- [ ] Linting: `npm run lint`
- [ ] Environment script exists: `ls -la .opencode-env.sh`
- [ ] Documentation created: `ls docs/`

## 🎓 Next Steps

1. **Configure your API keys in 1Password**
2. **Enable CLI integration in 1Password app**
3. **Source the environment script** before using OpenCode
4. **Write tests** using TDD approach
5. **Run validation** before commits

## 💡 Tips

- Use `npm test -- --watch` for TDD
- Run `./scripts/validate-code.sh` before commits
- Store all secrets in 1Password
- Read the TDD guide for best practices
- Use OpenCode for AI-assisted development

---

**Status**: ✅ All components installed and configured
**Tests**: ✅ 9/9 passing
**Last Updated**: 2025-12-28
