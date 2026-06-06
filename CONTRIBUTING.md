# Contributing

## Setup

```bash
node --version  # Node 20+
npm install
npm run build
```

## Project structure

```
packages/
  acum-client/   Pure TypeScript client — no Express dependency
  api/           Express REST API — imports acum-client
docs/
  RECON.md       Reverse-engineered endpoint documentation
  openapi.yaml   OpenAPI 3.0 spec
```

## Adding a new endpoint

1. Probe it in `docs/RECON.md` first — document the raw response shape before coding.
2. Add normalization in `acum-client/src/normalize.ts`.
3. Add the client function in the appropriate `acum-client/src/*.ts` file.
4. Export it from `acum-client/src/index.ts`.
5. Add the route in `packages/api/src/routes/`.
6. Add at least one unit test.
7. Update `docs/openapi.yaml`.

## Tests

```bash
npm run test
```

Tests use Vitest. Client tests mock axios; API tests mock the client functions.

## Commits

Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.

## Reporting upstream changes

If ACUM changes their API, open an issue with the old vs new response shape. Update `docs/RECON.md` first.
