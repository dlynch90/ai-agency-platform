macOS CPU spike audit (2025-12-21): system is MacBookPro18,2 (Apple M1 Max 10 cores, 64GB) on macOS 26.1 / Darwin 25.1.0; load averages were extremely high (~70+) with CPU near 0% idle.

Top CPU offenders observed via `ps -axo ... -r`:
- Cursor Electron renderers (`Cursor Helper (Renderer)`) >100% CPU.
- `comprehensive-cursor-audit.py` consumed ~75% CPU; script contains very heavy loops (e.g., `precision=1000000` Riemann sum) and will burn CPU by design.
- Multiple `claude` ripgrep jobs running with `--no-ignore --hidden` across `~/Developer` (expensive; matches prior runaway rg pattern).
- `next build` (`node ... next/dist/bin/next build`) and various `npm exec` MCP servers also contributed.

Tooling note: PATH in this environment omitted `/usr/sbin`, so built-in macOS tools like `lsof`, `taskpolicy`, `sysctl` were initially "command not found" unless invoked as `/usr/sbin/<tool>`.

1Password CLI injection debugging:
- `op` v2.32.0 authenticated as service account (empathy-first-media.1password.com).
- Repo contained multiple `op://` references; name-based ones like `op://Development/GitHub/token` failed because item names didn't exist.
- UUID-based refs in `shared/configs/registry/credentials.toml` worked.
- Fixed `packages/system-manifest/manifest.json` secret sources to UUID/field-based refs:
  - `GITHUB_TOKEN` -> `op://Development/dvbdv7bap6cha7r3fv7laqx7mi/password`
  - `ANTHROPIC_API_KEY` -> `op://Development/m5yadhrmxd4cq6mphipnlocjmu/credential`
  - `DATABASE_URL` -> `op://Development/hv3sr42hy2w7bj2u2vzvjgaecy/7vbetdp73mqyvqbp7vrdcrbavy`
- Verified with `op read <ref> | wc -c` (length-only check; no secret disclosure); JSON validated with `jq`.

Added monitoring/benchmark tools via Homebrew: `bottom` and `hyperfine` (note: `mise` shims may take precedence over brew binaries).