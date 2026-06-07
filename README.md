# acum-api

> ⚠️ **UNOFFICIAL — Not affiliated with or endorsed by ACUM (אקו"ם) in any way.**
> This is an independent open source project. It reverse-engineers and wraps the
> unauthenticated public search endpoints at [nocs.acum.org.il](https://nocs.acum.org.il/acumsitesearchdb/).
> All data belongs to ACUM. Use responsibly.

---

## Disclaimer

This project has **no official relationship with ACUM (אקו"ם)**. It is not:
- Authorized, approved, or endorsed by ACUM
- An official API or SDK provided by ACUM
- Affiliated with any ACUM product or service

It works by calling the same unauthenticated HTTP endpoints that power ACUM's own public search website. No private APIs, no authentication bypass, no scraped data — only what the website itself serves to any visitor.

If you use this in production, make sure your use case respects ACUM's [terms of service](https://www.acum.org.il/).

---

## What is this?

ACUM is Israel's music rights society, managing rights for 1.7M+ works. Their public search database has no documented API. This repo provides:

- **`packages/acum-client`** — a zero-dependency (Express-free) typed TypeScript client you can import in any Node.js project or MCP server
- **`packages/api`** — a production-ready Express REST API wrapping the client
- **`packages/mcp`** — an MCP server for Claude Desktop and other MCP-compatible AI assistants

---

## Install

### MCP server (Claude Desktop / AI assistants)

**Homebrew (recommended)**

```bash
brew tap yanirclsr/tap
brew install acum-mcp
```

**npm**

```bash
npm install -g @acum-api/mcp
```

Then add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "acum": {
      "command": "acum-mcp"
    }
  }
}
```

Restart Claude Desktop. You can now ask Claude to search ACUM directly.

### REST API

**Docker (recommended)**

```bash
docker compose up
```

API available at `http://localhost:3000`. Docs at `http://localhost:3000/docs`.

**Local development**

```bash
node --version  # requires Node 20+
npm install
npm run build
npm run dev --workspace=packages/api
```

---

## MCP Tools

The MCP server exposes 5 tools:

| Tool | Description |
|------|-------------|
| `search_works` | Search by title, composer, performer, album, or work number |
| `get_work` | Full work detail + all versions |
| `get_version` | Details for a specific version |
| `search_artists` | Find composers/authors by name |
| `get_artist_works` | All works registered to a creator |

---

## REST API Reference

Full interactive docs at `/docs` (Swagger UI).

### Search works

```
GET /api/search?q=לילה&by=title&method=partial&page=1&limit=10
```

| Param | Values | Default |
|-------|--------|---------|
| `q` | any text | required |
| `by` | `title`, `composer`, `performer`, `album`, `catalog`, `number` | `title` |
| `artist` | optional secondary performer filter | — |
| `method` | `partial`, `exact` | `partial` |
| `sort` | `alphabetical`, `reverse` | `alphabetical` |
| `page` | integer ≥ 1 | `1` |
| `limit` | 1–30 | `10` |
| `type` | `works`, `artists` | `works` |

### Get work detail

```
GET /api/works/1579291
GET /api/works/1579291/versions/1579291001
```

### Search artists

```
GET /api/artists/search?q=שלמה+ארצי
```

### Artist works

```
GET /api/artists/I-000151826-7/works
```

### Health

```
GET /health
```

---

## Run in Postman

Import `postman/acum-api.postman_collection.json` from this repo.

---

## Using the client package directly

```bash
npm install @acum-api/acum-client
```

```ts
import { createHttpClient, searchWorks, getWork } from "@acum-api/acum-client";

const http = createHttpClient();

const results = await searchWorks(http, { q: "לילה", by: "title" });
console.log(results.total, results.results[0].titleHebrew);

const work = await getWork(http, "1579291");
console.log(work.iswc, work.versions.length);
```

Zero Express dependency — drop it into any Node.js project or MCP server.

---

## Rate limiting

60 requests/minute/IP. Be respectful of ACUM's servers.

---

## Languages

- English: [README.md](README.md)
- עברית: [README.he.md](README.he.md)

To regenerate the Hebrew translation after editing `README.md`:
```bash
npm run translate
```
Requires `GEMINI_API_KEY` in `.env`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
