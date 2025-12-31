## Atuin + zsh (XDG) edge case: `ZDOTDIR` preset bypasses `~/.zshenv`

When an IDE/wrapper sets `ZDOTDIR` *before* starting zsh, zsh reads init files from `$ZDOTDIR` (including `$ZDOTDIR/.zshenv`) and may **skip** `~/.zshenv` bootstrap. If your mise shim PATH injection only lives in `~/.zshenv`, interactive non-login shells can lose `atuin` on PATH, so `eval "$(atuin init zsh)"` is skipped and keybindings revert (e.g., to `fzf-history-widget`).

Fix: ensure `$ZDOTDIR/.zshenv` also bootstraps PATH for mise shims.

```zsh
# PATH bootstrap (supports environments that set ZDOTDIR externally).
: "${XDG_BIN_HOME:=$HOME/.local/bin}"
export XDG_BIN_HOME

MISE_SHIMS="${XDG_DATA_HOME}/mise/shims"
if [[ -d "$MISE_SHIMS" ]]; then
  case ":$PATH:" in
    *":$MISE_SHIMS:"*) ;;
    *) PATH="$MISE_SHIMS:$PATH" ;;
  esac
fi
if [[ -d "$XDG_BIN_HOME" ]]; then
  case ":$PATH:" in
    *":$XDG_BIN_HOME:"*) ;;
    *) PATH="$XDG_BIN_HOME:$PATH" ;;
  esac
fi
export PATH
```

## 1Password CLI JSON gotcha: `op item create` default output isn’t JSON

If you pipe `op item create` output to `jq`, include `--format json` (otherwise `jq` can fail with a parse error).

```sh
op item template get "Secure Note" --format json \
  | jq '...template edits...' \
  | op item create --vault "$vault" --format json - \
  | jq -r .id
```

## Atuin version conflict cleanup (mise)

To eliminate PATH/version drift, remove unrequested older Atuin versions:

```sh
mise uninstall atuin@18.3.0
mise ls atuin
```

## Validation pattern

Confirm Atuin is resolvable in interactive shells and keybindings are active:

```sh
zsh -ic 'command -v atuin; bindkey "^R"; bindkey "^[[A"; echo "$ZSH_AUTOSUGGEST_STRATEGY"'
```