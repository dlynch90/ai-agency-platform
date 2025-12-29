Repo-wide audit for `/Users/daniellynch/Developer` (option 1) findings + commands:

Key audit commands:
```
find /Users/daniellynch/Developer -type l ! -exec test -e {} \; -print
find /Users/daniellynch/Developer -type l -not -path '*/node_modules/*' -print
rg --files -g 'Taskfile*' -g 'Makefile*' -g 'Justfile' -g '.mise.toml' -g 'mise.toml' /Users/daniellynch/Developer
rg -n "/Users/daniellynch" /Users/daniellynch/Developer --glob '!**/node_modules/**' --glob '!**/.git/**' --glob '!**/.venv/**' --glob '!**/~/**'
sg scan -c sgconfig.yml --filter no-hardcoded-abs-path --globs '!**/node_modules/**' --globs '!**/.git/**' --globs '!**/.venv/**' --globs '!**/~/**'
ps aux | rg -i 'redis|postgres|postmaster|neo4j|kafka|zookeeper|supabase|airflow|temporal|temporal.io|docker|colima|podman|qdrant|datahub|pgbouncer'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
