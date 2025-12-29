Zed Tailwind CSS language server can fail with `MODULE_NOT_FOUND` because the expected executable `~/Library/Application Support/Zed/languages/tailwindcss-language-server/node_modules/.bin/tailwindcss-language-server` is missing.

Observed layout:
- `~/Library/Application Support/Zed/languages/tailwindcss-language-server/package.json` depends on `@tailwindcss/language-server`.
- Package ships binaries at `node_modules/@tailwindcss/language-server/bin/{tailwindcss-language-server,css-language-server}`.
- If `node_modules/.bin` is absent, Zed’s launcher path breaks.

Fix (recreate `.bin` shims):
```sh
LS_DIR="$HOME/Library/Application Support/Zed/languages/tailwindcss-language-server"
mkdir -p "$LS_DIR/node_modules/.bin"
ln -sf "../@tailwindcss/language-server/bin/tailwindcss-language-server" "$LS_DIR/node_modules/.bin/tailwindcss-language-server"
ln -sf "../@tailwindcss/language-server/bin/css-language-server" "$LS_DIR/node_modules/.bin/css-language-server"
```

Sanity check (should stay running):
```sh
python3 - <<'PY'
import subprocess, time, os
bin_path=os.path.expanduser('~/Library/Application Support/Zed/languages/tailwindcss-language-server/node_modules/.bin/tailwindcss-language-server')
p=subprocess.Popen(['node', bin_path, '--stdio'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(1)
print('started_ok:', p.poll() is None)
p.terminate()
PY
```
