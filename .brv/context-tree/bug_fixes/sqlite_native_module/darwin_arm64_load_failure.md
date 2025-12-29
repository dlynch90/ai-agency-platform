Installed Cipher MCP CLI via npm package `@byterover/cipher` (per docs) using `npm install -g @byterover/cipher`. Starting Cipher MCP in aggregator mode works but logs show `better-sqlite3` native module load failure on darwin/arm64; Cipher falls back to in-memory storage and continues:
```
MCP_SERVER_MODE=aggregator VECTOR_STORE_TYPE=in-memory cipher --mode mcp
```
Fix options: rebuild native module (`npm rebuild -g better-sqlite3`) or configure `DATABASE_URL` to use Postgres instead of SQLite.