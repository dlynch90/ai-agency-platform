# ADR 0002: Package Management Strategy

## Status
Accepted

## Context
The polyglot environment requires managing dependencies across multiple programming languages and ecosystems. Traditional package managers are language-specific and don't handle cross-language dependencies well. A unified approach is needed.

## Decision
Use Pixi as the primary package manager with the following hierarchy:

### Package Manager Hierarchy
```
┌─────────────────┐
│      Pixi       │ ← Primary package manager
│  (Conda-based)  │
└─────────────────┘
         │
    ┌────┼────┐
    │    │    │
┌───▼──┐┌─▼─┐┌▼──┐
│Conda ││Pip││Poetry│
└──────┘└───┘└─────┘
```

### Language-Specific Managers (Secondary)
- **Python**: poetry/pip (via Pixi)
- **Node.js**: pnpm/npm (via Pixi)
- **Rust**: cargo (via Pixi)
- **Java**: maven/gradle (via Pixi)
- **Go**: go modules (via Pixi)
- **C/C++**: conan/cmake (via Pixi)

## Implementation

### Pixi Configuration Structure
```toml
[workspace]
name = "polyglot-dev-env"
channels = ["conda-forge", "pytorch", "nvidia"]
platforms = ["osx-arm64", "linux-64"]

[feature.python-core]
dependencies = { python = "3.12", pip = "*", poetry = "*" }

[feature.nodejs-core]
dependencies = { nodejs = "20", pnpm = "*" }

[environments]
python-dev = ["python-core", "python-ml"]
full-stack = ["python-core", "nodejs-core", "rust-core"]
```

### Dependency Resolution Strategy
1. **Pixi First**: All dependencies declared in Pixi
2. **Feature Flags**: Optional components controlled by features
3. **Version Pinning**: Exact versions for reproducibility
4. **Channel Priority**: conda-forge > language-specific > custom

## Consequences

### Positive
- **Unified Interface**: Single command for all package operations
- **Cross-Platform**: Consistent environments across OS/architectures
- **Reproducible**: Locked dependency versions
- **Fast**: Parallel installation and caching

### Negative
- **Learning Curve**: New package manager concepts
- **Size**: Larger environment sizes due to conda
- **Compatibility**: Some packages may not be available

### Risks
- **Breaking Changes**: Pixi API evolution
- **Package Availability**: Not all packages in conda-forge
- **Performance**: Conda solve time for complex environments

## Alternatives Considered

### Alternative 1: Native Package Managers Only
- **Pros**: Language-native tools, full ecosystem access
- **Cons**: Complex orchestration, version conflicts, manual management

### Alternative 2: Docker-based Environments
- **Pros**: Complete isolation, reproducible builds
- **Cons**: Resource intensive, slower startup, complex networking

### Alternative 2: Nix Package Manager
- **Pros**: Declarative, atomic upgrades, excellent reproducibility
- **Cons**: Steep learning curve, smaller ecosystem, complex expressions

## Migration Strategy

### Phase 1: Assessment (Week 1)
- [x] Audit current package management approach
- [x] Identify conflicting dependencies
- [x] Document migration requirements

### Phase 2: Core Migration (Week 2)
- [ ] Migrate Python dependencies to Pixi
- [ ] Migrate Node.js dependencies to Pixi
- [ ] Establish feature-based environments

### Phase 3: Advanced Features (Week 3)
- [ ] Implement cross-language dependency management
- [ ] Set up automated testing for environments
- [ ] Document environment activation procedures

### Phase 4: Optimization (Week 4)
- [ ] Optimize environment sizes
- [ ] Implement caching strategies
- [ ] Set up automated updates

## Validation Criteria
- [ ] All dependencies installable via Pixi
- [ ] Environment activation < 30 seconds
- [ ] Cross-platform compatibility (macOS/Linux)
- [ ] Reproducible builds across machines
- [ ] Automated testing passes in all environments