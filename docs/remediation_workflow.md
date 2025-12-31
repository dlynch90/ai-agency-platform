Created a new Codex skill package for symlink auditing and remediation.

- New skill directory: `~/.codex/skills/symlink-health/` with `SKILL.md` + `references/`.
- Core workflow uses existing CLI tools (no saved scripts):
  - `symlinks -r <root>` for summary; `symlinks -rv <root>` for verbose.
  - `symlinks -t <root>` as dry-run for converting absolute/messy links; `symlinks -c <root>` to apply; `symlinks -o` to warn about cross-filesystem links; `symlinks -d` to delete dangling (after review).
  - Broken symlinks via `find <root> -type l ! -exec test -e {} \; -print`.
- Optional provenance inventory to Postgres:
  - Generate TSV via `find ... -type l -print0 | xargs -0 ... readlink ... test -e ... > /tmp/symlink-inventory-<scan_id>.tsv`.
  - Import via `psql` using `\copy symlink_inventory(...) from '<file>' with (format csv, delimiter E'\t')`.
- Added guidance for `chezmoi` and GNU `stow` remediation (dry-runs first) and pragmatic `$HOME` scanning with `find ... -prune`.
- Optional analysis section uses temporary `uv` venv (`mktemp -d`, `uv venv`, `uv pip install pandas networkx rich`) without adding repo scripts.
