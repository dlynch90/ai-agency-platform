Reusable PATH audit script for duplicate binaries and broken symlinks across PATH directories:

```
python - <<'PY'
import os
import stat
from collections import defaultdict

path = os.environ.get("PATH", "").split(os.pathsep)

exec_map = defaultdict(list)
broken_links = []

for d in path:
    if not d:
        continue
    try:
        entries = os.listdir(d)
    except (FileNotFoundError, PermissionError):
        continue
    for name in entries:
        full = os.path.join(d, name)
        try:
            st = os.lstat(full)
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(st.st_mode):
            if not os.path.exists(full):
                broken_links.append(full)
        try:
            if os.path.isfile(full) and os.access(full, os.X_OK):
                exec_map[name].append(full)
        except OSError:
            continue

path_order = {d: i for i, d in enumerate(path)}

def sort_key(p):
    return path_order.get(os.path.dirname(p), 10**9)

print("PATH directories:")
for d in path:
    if d:
        print("-", d)

print("\nBroken symlinks in PATH directories:")
if broken_links:
    for p in sorted(broken_links, key=sort_key):
        print(p)
else:
    print("(none)")

print("\nDuplicates (command -> locations, PATH order):")
count = 0
for name, paths in sorted(exec_map.items()):
    if len(paths) > 1:
        count += 1
        ordered = sorted(paths, key=sort_key)
        print(f"{name}:")
        for p in ordered:
            print(f"  - {p}")

print(f"\nDuplicate command names: {count}")
PY
```

Context: used for global binary health checks (mise/brew/cargo/pnpm collisions) and to identify broken symlinks in PATH directories.