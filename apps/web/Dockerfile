FROM oven/bun:1.3.6-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/sabine/package.json ./apps/sabine/package.json
COPY apps/helper/package.json ./apps/helper/package.json
COPY packages/prisma/package.json ./packages/prisma/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/players/package.json ./packages/players/package.json

RUN --mount=type=secret,id=env,target=/app/.env \
    export GITHUB_AUTH_TOKEN=$(grep GITHUB_AUTH_TOKEN /app/.env | cut -d '=' -f2) && \
    bun i --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=env,target=/tmp/.env \
    cp /tmp/.env /app/.env && \
    cp /tmp/.env /app/apps/web/.env && \
    export AUTH=$(grep -E '^AUTH=' /tmp/.env | cut -d '=' -f2-) && \
    export API_URL=$(grep -E '^API_URL=' /tmp/.env | cut -d '=' -f2-) && \
    export INVITE=$(grep -E '^INVITE=' /tmp/.env | cut -d '=' -f2-) && \
    export SUPPORT=$(grep -E '^SUPPORT=' /tmp/.env | cut -d '=' -f2-) && \
    export CDN_URL=$(grep -E '^CDN_URL=' /tmp/.env | cut -d '=' -f2-) && \
    bun run build:web && \
    rm -f /app/.env /app/apps/web/.env

CMD ["bun", "start:web"]