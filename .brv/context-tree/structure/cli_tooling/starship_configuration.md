## Starship audit + CLI discovery (dr-sosa)

Repo findings:
```text
- No starship.toml found in /Users/daniellynch/Projects/dr-sosa
- No references to `starship`, `STARSHIP_CONFIG`, or `starship init` in repo docs/config/scripts (scoped grep to config/docs/shell/ci-related extensions)
- Repo already uses a “hyper-parameters” pattern via docs/parameters.yml + docs/project-manifest.yml and uses mise.toml as toolchain/task SSOT.
- mise.toml pins Python 3.12.8 + uv 0.5.14 (suggest using `mise x -- uv ...` for reproducible orchestration).
```

Starship vendor CLI (local):
```text
starship 1.17.1

Usage: starship <COMMAND>
Commands:
  bug-report
  completions
  config
  explain
  init
  module
  preset
  print-config
  prompt
  session
  timings
  toggle
```

Preset discovery:
```text
starship preset -l
bracketed-segments
gruvbox-rainbow
jetpack
nerd-font-symbols
no-empty-icons
no-nerd-font
no-runtime-versions
pastel-powerline
plain-text-symbols
pure-preset
tokyo-night
```

Helpful built-in inspection/eval commands:
```text
starship print-config [--default]
starship module -l / starship module <name>
starship explain
starship timings
starship prompt [--right] [--profile <PROFILE>]
```

These built-in commands enable vendor-first “template import + measured tuning” without immediately writing bespoke code.