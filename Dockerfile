FROM oven/bun:1-alpine AS base
WORKDIR /app

# --- Install dependencies ---
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production=false

# --- Build client ---
FROM deps AS build
COPY . .
RUN bunx vite build

# --- Production image ---
FROM base AS runtime
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production && rm -rf /root/.bun/install/cache

COPY server/ server/
COPY --from=build /app/client/dist client/dist

EXPOSE 3000

CMD ["bun", "server/index.ts"]
