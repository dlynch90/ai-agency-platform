Dangling links/processes/resources follow-up (2025-12-21).

Symlinks:
- Deleted 973 dangling symlinks under archived folder `~/Desktop/master documents/Code detailsj/.hidden-old`.
  - Verified after deletion: 0 broken symlinks remaining in that subtree.
  - Report kept at: `/tmp/hidden-old-broken.20251220-224315.txt` and `/tmp/hidden-old-broken.20251220-224315.nul`.
  - Note (BSD/macOS): `mktemp` only replaces trailing `XXXXXX`; templates like `.XXXXXX.nul` may not randomize. Use a trailing `XXXXXX` template and add suffix separately.
- Post-clean checks: broken symlink counts are 0 for `~/.local/bin`, `~/.local/share/mise/shims`, `~/.config`, `~/.ssh`, `~/.claude`, and `/Users/daniellynch/Developer`.

Shims/PATH:
- `mise doctor` shows shims on PATH; no broken symlink shims; PATH contains no non-existent directories.

Processes/resources:
- Zombie/defunct processes count: 0.
- High-CPU `find` processes from the symlink/package audit were detected and terminated; confirmed no remaining `find . -name package.json` processes.
- `lsof -nP +L1` showed many deleted-file handles (common on macOS due to frequently rewritten caches); top holders included `node`, `python3.*`, `uv`, `Cursor`, `limactl`, and `op`. No deleted handles referenced `chezmoi-diff` temp directories (count 0).
- Disk usage snapshot: `~/.local/share/mise` ~19G, `~/.cache` ~11G, `~/Developer` ~8G, `~/.local/share/uv` ~483M.
