In a Bedrock (roots/bedrock) + DDEV setup with nonstandard router ports (e.g. `router_https_port: "33001"`), `WP_HOME`/`WP_SITEURL` must include the port (e.g. `https://project.ddev.site:33001`), otherwise WordPress issues 302 redirects to the portless domain (breaking local access).

Validation approach:
- Use `curl -k -I https://<host>:<port>/wp/wp-admin/` to confirm redirect targets keep the correct `:<port>`.
- To confirm wp-admin actually loads (not just redirect), simulate login with a cookie jar and fetch `/wp/wp-admin/` looking for `Dashboard` in the HTML.

Bootstrap/install via DDEV WP-CLI:
```sh
ddev wp core install --url='https://<project>.ddev.site:<port>' --title='<title>' --admin_user='<user>' --admin_password='<pass>' --admin_email='<email>' --skip-email
```

Note: DDEV generates `web/wp-config-ddev.php` with DDEV-specific DB/URL defaults, but its detection of whether it’s included can be string-based; referencing `wp-config-ddev.php` in comments may cause misleading “include found” output.