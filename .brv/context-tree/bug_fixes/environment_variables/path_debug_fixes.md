Shell PATH/debug fixes applied for mise/node health:

- Updated `~/.profile` PATH handling to be deterministic by removing existing occurrences before prepending:
```
path_prepend() {
  PATH=":${PATH}:"
  PATH="${PATH//:$1:/:}"
  PATH="${PATH#:}"
  PATH="${PATH%:}"
  PATH="$1:${PATH}"
}
```
This ensures mise shims stay first even if PATH already contains entries.

- Added a guard to clear a bad global DEBUG value that breaks tools like `litellm`:
```
if [ "${DEBUG:-}" = "WARN" ]; then
  unset DEBUG
fi
```
Applied in `~/.profile` (for bash) and `~/.config/zsh/.zshenv` (for zsh).

- Confirmed in new shells that `DEBUG` is unset and PATH order is mise-first for both zsh and bash.