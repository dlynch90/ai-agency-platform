Golden-path recommendation for /Users/daniellynch/Developer: keep mise tasks as SSOT for toolchain/cache ops, and have Taskfile tasks call mise tasks to avoid duplication. Cache lifecycle commands to standardize (vendor-first):
```
# status/inspect
uv cache size
uv cache dir
mise cache prune --dry-run
pnpm store prune --reporter=silent

# clean (destructive)
uv cache prune
mise cache prune
pnpm store prune
```
Local config inventory: `/Users/daniellynch/Developer/.mise.toml` already defines `health:cache`, `cache:clean`, `cache:status`, and `UV_CACHE_DIR`; `/Users/daniellynch/Developer/Taskfile.yml` defines `hygiene:caches` and `clean`. Recommendation: consolidate by mapping `task hygiene:caches` -> `mise run cache:clean` and ensure `cache:status` is the single status command.
Auth standardization pattern: use 1Password (`op run --env-file=<template> -- <command>`) to inject tokens (e.g., `HF_TOKEN`) and run `hf auth login --token $HF_TOKEN` when needed; do not store tokens in repo.