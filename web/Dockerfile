FROM oven/bun:1.3.13-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY .npmrc ./
COPY web/package.json ./web/package.json
COPY web-next/package.json ./web-next/package.json
COPY sabine/package.json ./sabine/package.json
COPY helper/package.json ./helper/package.json
COPY api/package.json ./api/package.json
COPY prisma/package.json ./prisma/package.json
COPY utils/package.json ./utils/package.json
COPY players/package.json ./players/package.json

RUN --mount=type=secret,id=env,target=/app/.env \
    export GITHUB_AUTH_TOKEN=$(grep GITHUB_AUTH_TOKEN /app/.env | cut -d '=' -f2) && \
    bun i --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=env,target=/tmp/.env \
    cp /tmp/.env /app/.env && \
    cp /tmp/.env /app/web/.env && \
    export AUTH=$(grep -E '^AUTH=' /tmp/.env | cut -d '=' -f2-) && \
    export API_URL=$(grep -E '^API_URL=' /tmp/.env | cut -d '=' -f2-) && \
    export INVITE=$(grep -E '^INVITE=' /tmp/.env | cut -d '=' -f2-) && \
    export SUPPORT=$(grep -E '^SUPPORT=' /tmp/.env | cut -d '=' -f2-) && \
    export CDN_URL=$(grep -E '^CDN_URL=' /tmp/.env | cut -d '=' -f2-) && \
    bun run build:web && \
    rm -f /app/.env /app/web/.env

CMD ["bun", "start:web"]
