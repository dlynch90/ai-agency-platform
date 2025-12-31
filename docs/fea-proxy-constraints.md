# FEA Proxy + Constraints Debug Report

- Timestamp: `2025-12-30T19:00:07.807989+00:00`
- Spec: `/Users/daniellynch/Desktop/cursor_vendor_driven_system_and_codebas.md`
- Compose: `infrastructure/network-proxy/docker-compose.network.yml`
- Prisma: `prisma/schema.prisma`

## Data Model (Prisma models)

- Score: `3/8` (`37.5%`)
- spec: /Users/daniellynch/Desktop/cursor_vendor_driven_system_and_codebas.md
- schema: prisma/schema.prisma
- missing: CursorIDEResource
- missing: LLMEvaluation
- missing: MCPToolUsage
- missing: CLIToolConfig
- missing: APICRUDSpec

## Proxy Constraints (secrets/placeholders)

- Score: `0/1` (`0.0%`)
- compose: infrastructure/network-proxy/docker-compose.network.yml
- compose local: infrastructure/network-proxy/docker-compose.network.local.yml
- placeholder: grafana:GF_SECURITY_ADMIN_PASSWORD=change_me_grafana_admin_password
- placeholder: postgres:POSTGRES_PASSWORD=change_me_postgres_password
- placeholder: subgraph-posts:NEO4J_PASSWORD=change_me_neo4j_password

## Active Network Proxy (Traefik/Kong)

- Score: `1/2` (`50.0%`)
- HTTP_PROXY=(unset)
- HTTPS_PROXY=(unset)
- Traefik web port (compose): 18000
- Traefik dashboard port mapping (compose target 8080): 8080
- Traefik :18000 owner=com.docke(pid=21448) reachable=True detail=http 401 (auth required)
- Kong :8001 owner=(none) status_ok=False err=<urlopen error [Errno 61] Connection refused>
- Kong :8000 owner=(none) (may conflict with Kong proxy port)
- Start Traefik proxy: docker compose -f infrastructure/network-proxy/docker-compose.network.yml -f infrastructure/network-proxy/docker-compose.network.local.yml up -d traefik
- Start Kong (infra stack): docker compose -f infra/docker-compose.yml up -d kong-gateway kong-postgres

## Dependency Stress (stiffness solve)

| Node | Displacement | Load |
|---|---:|---:|
| kong_proxy | 1.000 | 1.000 |
| zookeeper | 0.700 | 0.700 |
| load-tester | 0.525 | 0.700 |
| promtail | 0.525 | 0.700 |
| security-tester | 0.525 | 0.700 |
| graphql-tester | 0.480 | 0.700 |
| kafka | 0.467 | 0.700 |
| loki | 0.350 | 0.700 |
| qdrant | 0.350 | 0.700 |
| subgraph-analytics | 0.350 | 0.700 |
| subgraph-posts | 0.350 | 0.700 |
| subgraph-users | 0.350 | 0.700 |
