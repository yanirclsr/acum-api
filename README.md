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

---

## Quick Start

### Docker (recommended)

```bash
docker compose up
```

API available at `http://localhost:3000`. Docs at `http://localhost:3000/docs`.

### Local development

```bash
node --version  # requires Node 20+
npm install
npm run build
npm run dev --workspace=packages/api
```

---

## API Reference

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

```ts
import { createHttpClient, searchWorks, getWork } from "@acum-api/acum-client";

const http = createHttpClient();

const results = await searchWorks(http, { q: "לילה", by: "title" });
console.log(results.total, results.results[0].titleHebrew);

const work = await getWork(http, "1579291");
console.log(work.iswc, work.versions.length);
```

The client has zero Express dependency — drop it into any Node.js project or MCP server.

---

## Rate limiting

60 requests/minute/IP. Be respectful of ACUM's servers.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
