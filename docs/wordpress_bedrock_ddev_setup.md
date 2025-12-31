Set up local WordPress project `dr-sosa` using Bedrock + DDEV under `/Users/daniellynch/Projects/dr-sosa`.

Key decisions/patterns:
- Use Roots Bedrock (Composer-managed WP core/plugins/themes) to avoid "LocalWP-hidden" state and keep repo Git-friendly.
- Use DDEV with Bedrock docroot `web` for transparent Docker-based local dev.
- Store runtime secrets in `.env` (gitignored) and keep `.env.example` as template; plan to source secrets from 1Password CLI (`op`) later.

Concrete setup performed:
- Installed prerequisites via Homebrew: `php`, `composer`, `ddev` (via `brew tap ddev/ddev && brew install ddev/ddev/ddev`).
- Installed Bedrock in repo root:
```bash
cd /Users/daniellynch/Projects/dr-sosa
composer create-project roots/bedrock .
```
- Configured/started DDEV:
```bash
ddev config --project-type=wordpress --docroot=web
ddev start
```
- Created `.env` with DDEV DB defaults (db/db@db) and WP_HOME/WP_SITEURL set to `http://dr-sosa.ddev.site:33000`.
- Installed WordPress with WP-CLI via DDEV:
```bash
ddev wp core install --url='http://dr-sosa.ddev.site:33000' --title='Dr. Sosa' --admin_user='drsosa_admin' --admin_password='<generated>' --admin_email='dev@example.com'
```
- Added/activated dev plugins via Composer + WP-CLI:
```bash
composer require wpackagist-plugin/query-monitor wpackagist-plugin/wp-crontrol wpackagist-plugin/user-switching wpackagist-plugin/health-check
# deactivated health-check due to early translation loading notice during WP-CLI run
ddev wp plugin activate query-monitor wp-crontrol user-switching
```
- Standardized router ports due to host 80/443 conflicts:
  - Updated `/Users/daniellynch/Projects/dr-sosa/.ddev/config.yaml` to include `router_http_port: "33000"`, `router_https_port: "33001"`.
- Reduced DDEV warning spam by adding marker comment in Bedrock wp-config:
  - Updated `/Users/daniellynch/Projects/dr-sosa/web/wp-config.php` to include `// wp-config-ddev.php not needed`.
- Added `mise` task runner config for common operations:
  - Added `/Users/daniellynch/Projects/dr-sosa/mise.toml` with tasks `up`, `down`, `restart`, `describe`, plus pass-through tasks `wp` and `composer`.
  - Requires `mise trust` once per repo.

Validation commands used:
- `composer validate --no-check-publish` (warns about exact version pins from Bedrock defaults)
- `ddev wp core is-installed` and checked `home`/`siteurl`.

Tooling notes:
- GitHub MCP auth failed (bad credentials) during repo search; Byterover retrieval tool errored (Unexpected response type).