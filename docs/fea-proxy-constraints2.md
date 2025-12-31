# FEA Proxy + Constraints Debug Report

- Timestamp: `2025-12-30T18:08:23.023507+00:00`
- Spec: `/Users/daniellynch/Desktop/cursor_vendor_driven_system_and_codebas.md`
- Compose: `/Users/daniellynch/Developer/infra/network-proxy/docker-compose.network.yml`
- Prisma: `/Users/daniellynch/Developer/prisma/schema.prisma`

## Data Model (Prisma models)

- Score: `0/16` (`0.0%`)
- spec: /Users/daniellynch/Desktop/cursor_vendor_driven_system_and_codebas.md
- schema: /Users/daniellynch/Developer/prisma/schema.prisma
- missing: VendorService
- missing: CRUDOperation
- missing: OrchestrationFlow
- missing: CursorIDEResource
- missing: LLMEvaluation
- missing: MCPToolUsage
- missing: CLIToolConfig
- missing: APICRUDSpec
- missing: exa
- missing: tavily
- missing: brave
- missing: github
- missing: memory
- missing: neo4j
- missing: redis
- missing: browser

## Proxy Constraints (secrets/placeholders)

- Score: `0/1` (`0.0%`)
- compose: /Users/daniellynch/Developer/infra/network-proxy/docker-compose.network.yml
- missing env: postgres:POSTGRES_PASSWORD
- missing env: subgraph-posts:NEO4J_PASSWORD
- placeholder: grafana:GF_SECURITY_ADMIN_PASSWORD=admin_password_change_me
- placeholder: traefik:command=--api.dashboard=true --providers.docker=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --entrypoints.websecure.address=:443 --certificatesresolvers.letsencrypt.acme.httpchallenge=true --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web --certificatesresolvers.letsencrypt.acme.email=admin@example.com

## Active Network Proxy (Traefik/Kong)

- Score: `0/2` (`0.0%`)
- HTTP_PROXY=(unset)
- HTTPS_PROXY=(unset)
- Start Traefik proxy: docker compose -f infra/network-proxy/docker-compose.network.yml up -d traefik
- Start Kong (infra stack): docker compose -f infra/docker-compose.yml up -d kong-gateway kong-postgres

## Dependency Stress (stiffness solve)

| Node | Displacement | Load |
|---|---:|---:|
| traefik_proxy | 1.000 | 1.000 |
| kong_proxy | 1.000 | 1.000 |
| loki | 0.850 | 0.700 |
| subgraph-analytics | 0.850 | 0.700 |
| subgraph-posts | 0.850 | 0.700 |
| subgraph-users | 0.850 | 0.700 |
| traefik | 0.850 | 0.700 |
| kafka | 0.800 | 0.700 |
| load-tester | 0.775 | 0.700 |
| promtail | 0.775 | 0.700 |
| security-tester | 0.775 | 0.700 |
| apollo-gateway | 0.760 | 0.250 |
