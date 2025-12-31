Online standards update (Dec 21, 2025):
- NIST SP 800-218 SSDF v1.1 is final (published Feb 3, 2022) and is the baseline SSDF; SSDF project page notes mappings to EO 14028.
- NIST SP 800-218 Rev.1 (SSDF v1.2) Initial Public Draft published Dec 17, 2025; comments due Jan 30, 2026.
- EO 14028 SBOM minimum elements: data fields, automation support, and practices/processes (NIST SBOM page).
- Turborepo docs: nested packages like apps/** or packages/** are not supported; root package.json + lockfile + turbo.json required; packages must have package.json.
- pnpm docs: a workspace must have pnpm-workspace.yaml at repo root; it defines include/exclude globs.
- CycloneDX is standardized as ECMA-424 (CycloneDX v1.7 BOM spec).