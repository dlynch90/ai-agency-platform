In `obot`, avoid blanket-ignoring `/bin/` because the repo contains real tracked tooling scripts under `bin/` (e.g. `bin/gibson`, `bin/gap-analysis`) alongside generated binaries (e.g. `bin/obot`). Prefer a narrow ignore with explicit allowlist:
```gitignore
/bin/*
!/bin/gibson
!/bin/gap-analysis
```
Verify with:
```bash
git check-ignore -v bin/gibson bin/gap-analysis bin/obot
```