Resolved 1Password injection failures by switching env refs to item IDs (avoids ambiguous titles and space parsing). Updates:

```
# /Users/daniellynch/Developer/config/env.op.template
ANTHROPIC_API_KEY=op://Development/m5yadhrmxd4cq6mphipnlocjmu/credential
OPENAI_API_KEY=op://Development/OPENAI_API_KEY/credential
GROQ_API_KEY=op://Development/3tc6grrnpw2zqwbdt5vavd7zji/credential
COHERE_API_KEY=op://Development/4u6j7fhklyyyvp25hisbs6tbxi/credential
OPENROUTER_API_KEY=op://Development/4cjk4vvdsyznry64xecqptuicq/credential
HF_TOKEN=op://Development/2whzhxvx6b22jbrnhceitmriby/credential
GITHUB_TOKEN=op://Development/c2inuzzvadqesl5s7whfbbskau/credential
```

```
# /Users/daniellynch/Developer/.env.op
POSTGRES_PASSWORD="op://Development/hv3sr42hy2w7bj2u2vzvjgaecy/password"
```

Fix reason: `mise run secrets.validate.env-op` uses a regex that splits on spaces, so item titles like "PostgreSQL Development" yielded invalid `op://Development/PostgreSQL` references. Using IDs makes validation reliable.

Docker networking fix: core containers had only `developer_public-network` attached. `docker network connect developer_agency-network <container>` attached `developer-{postgres,redis,qdrant,neo4j,pgbouncer}-1` to expected network to stop compose/network errors.

Health check improvement in `/Users/daniellynch/Developer/validate_services.py`: now uses env-derived ports/users/passwords and optional Redis auth. After changes, `./.venv/bin/python validate_services.py` passes with all services up.