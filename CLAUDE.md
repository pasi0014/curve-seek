---
description: Project conventions and dev workflow
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## Project Structure

- `server/` — Hono backend on Bun
  - `server/index.ts` — App entry, mounts controllers, `Bun.serve()`
  - `server/controllers/` — Hono sub-apps for each route group
  - `server/services/` — Business logic, uses `WideEvent` for structured logging
  - `server/middleware/wide-event.ts` — Creates one `WideEvent` per request
  - `server/logger.ts` — `WideEvent` class (set, incr, time, emit)
  - `server/lib/` — Domain modules (routing, scoring, db, etc.) + tests
- `client/` — React frontend, bundled by Vite
  - `client/index.html` — HTML entry point
  - `client/main.tsx` — React mount
  - `client/App.tsx` — Root component
  - `client/components/` — UI components
  - `client/hooks/` — Custom hooks
  - `client/utils/` — Helpers
  - `client/types.ts` — Frontend type definitions

## Dev Workflow

```sh
# Start both server and client in dev mode
bun run dev

# Or run separately:
bun run dev:server   # Hono server on :3000 with --hot
bun run dev:client   # Vite dev server on :5173, proxies /api to :3000

# Run tests
bun test server/lib/

# Build for production
bun run build

# Start production server (serves built client from client/dist)
bun run start
```

## APIs

- Hono for HTTP routing (not express, not raw Bun.serve routes)
- Drizzle ORM + `postgres` driver for PostgreSQL (Supabase). Schema in `server/db/schema.ts`, connection in `server/db/index.ts`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile

## Testing

Use `bun test` to run tests.

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Vite + React for frontend bundling. Leaflet loaded via CDN in index.html.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.
