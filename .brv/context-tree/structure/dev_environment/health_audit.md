Environment health audit notes for /Users/daniellynch/Developer:
- BSD find on macOS did not support `-xtype`; use this to detect broken symlinks:
```
find /Users/daniellynch/Developer -type l ! -exec test -e {} \; -print
```
- Root git repo uses Lefthook-managed hooks at `.git/hooks/` for `pre-commit`, `pre-push`, `commit-msg`, `prepare-commit-msg`; `git config --local core.hooksPath` and `git config --global core.hooksPath` were unset.
- Local services observed listening: Redis on 6379 and Postgres on 5432; Colima daemon running; no qdrant/neo4j/kafka/zookeeper detected on host.
- Disk usage high: /System/Volumes/Data at 93% used; largest items in repo were `.venv` (~4.3G), `ai-ml-central` (~2.2G), `vendor-apps` (~525M), `shared` (~241M), `node_modules` (~217M), `.git` (~123M), and a `~` directory (~184M).