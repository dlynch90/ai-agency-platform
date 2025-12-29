macOS maintenance audit results (2025-12-17):

- Homebrew status:
```bash
brew doctor
```
returned: "Your system is ready to brew." (no warnings)

- Outdated Homebrew items:
```text
Formulae:
awscli (2.32.16) < 2.32.18
cargo-nextest (0.9.114) < 0.9.115
huggingface-cli (1.2.2) < 1.2.3
jpeg-turbo (3.1.2) < 3.1.3
libgpg-error (1.57) < 1.58
pre-commit (4.5.0) < 4.5.1
rust-analyzer (2025-12-08) < 2025-12-15
snyk-cli (1.1301.1) < 1.1301.2
tree-sitter (0.26.2) < 0.26.3

Casks:
codex (0.72.0) != 0.73.0
```

- Largest ~/Library/Application Support directories (top offenders):
```text
Antigravity 3.2G
Zed 3.0G
Comet 2.2G
Google 2.0G
Code 818M
Cursor 735M
Cursor-backups 399M
Windsurf 337M
com.openai.atlas 321M
```

- PATH audit (shell): no duplicates and no missing directories detected. Includes mise shims early; Homebrew paths later (/opt/homebrew/bin, /opt/homebrew/sbin).