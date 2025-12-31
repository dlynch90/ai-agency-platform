Symlink health audit + remediations executed (2025-12-21).

Findings + fixes:
- `/Users/daniellynch/Developer`: 0 broken symlinks. Remaining YELLOW (absolute) symlinks reported by `symlinks -r`:
  - `.venv/bin/python -> ~/.local/share/uv/python/.../bin/python3.12` (likely uv-managed; left unchanged)
  - `packages/@shared/config/src/litellm/config.yaml -> ~/.config/litellm/config.yaml` (intentional; left unchanged)
- Converted `/Users/daniellynch/Developer/Projects` from absolute target to relative target:
  - before: `/Users/daniellynch/Projects`
  - after: `../Projects` (still green)
- Fixed broken `pipx` shared interpreter symlinks under `~/.local/pipx/shared/bin` by running:
  - `pipx upgrade-shared -v`
  This recreated the shared libs venv using the default python (`mise` python 3.12.8) and removed the stale `python3.14` links.
- Removed 6 broken symlinks in Claude plugin marketplace repo `~/.claude/plugins/marketplaces/claude-code-workflows/{frontend,backend}/agents/{guides,rules,templates}`; they pointed to non-existent `../../agents/{guides,rules,templates}`.

Post-fix status checks:
- Broken symlink counts: `~/.local` = 0, `~/.claude` = 0, `~/Projects` = 0.
- Archived folder `~/Desktop/master documents/Code detailsj/.hidden-old` still contains 973 broken symlinks (left untouched as archive).

Commands used (key):
- Broken symlinks: `find <root> -type l ! -exec test -e {} \; -print`
- Summary issues: `symlinks -r <root>`
- pipx repair: `pipx upgrade-shared -v`
- Targeted symlink update: `ln -sfn <target> <link>`
