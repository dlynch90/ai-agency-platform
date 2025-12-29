# ADR 001: Use Pixi as Unified Toolchain Manager

## Status
Accepted

## Context
The codebase requires management of multiple programming languages, tools, and runtimes. Current approach uses multiple package managers (npm, pip, cargo, etc.) leading to dependency conflicts and inconsistent environments.

## Decision
Use Pixi as the unified package manager, runtime manager, and tool chain for all development activities. Pixi will manage Python, Node.js, Rust, and other language ecosystems through a single configuration.

## Consequences

### Positive
- Single source of truth for all dependencies
- Consistent environments across development, CI/CD, and production
- Automatic conflict resolution
- Cross-platform compatibility
- Integration with conda-forge and other channels

### Negative
- Learning curve for team members unfamiliar with Pixi
- Potential lock-in to Pixi ecosystem

### Risks
- Pixi ecosystem maturity and long-term support
- Migration complexity from existing toolchains

## Alternatives Considered
- Using individual package managers (npm, pip, cargo)
- Using Docker for environment isolation
- Using conda/mamba as base package manager

## References
- Pixi Documentation: https://pixi.sh
- Conda-Forge: https://conda-forge.org
