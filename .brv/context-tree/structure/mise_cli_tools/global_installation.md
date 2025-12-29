Installed 20 additional CLI tools via mise and updated global config:

```
mise use -g bun caddy fx ghq git-lfs glow hadolint mprocs opentofu packer rclone restic sd terraform-docs terragrunt tflint tfsec vault watchexec ripgrep-all
```

Mise recorded them in `~/.config/mise/config.toml` and marked them active. Note binary names: `opentofu` installs `tofu`, and `ripgrep-all` installs `rga`.

Verified with:
```
mise ls --json | jq -r 'to_entries[] | select(.key | IN("bun","caddy","fx","ghq","git-lfs","glow","hadolint","mprocs","opentofu","packer","rclone","restic","sd","terraform-docs","terragrunt","tflint","tfsec","vault","watchexec","ripgrep-all")) | .key as $k | .value[] | "\($k)\t\(.version)\tactive=\(.active)"' | sort
```
