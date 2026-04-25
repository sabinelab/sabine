FROM oven/bun:1.3.13-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY .npmrc ./
COPY helper/package.json ./helper/package.json
COPY sabine/package.json ./sabine/package.json
COPY web/package.json ./web/package.json
COPY web-next/package.json ./web-next/package.json
COPY api/package.json ./api/package.json
COPY players/package.json ./players/package.json
COPY prisma/package.json ./prisma/package.json
COPY utils/package.json ./utils/package.json

RUN --mount=type=secret,id=env,target=/app/.env \
    export GITHUB_AUTH_TOKEN=$(grep GITHUB_AUTH_TOKEN /app/.env | cut -d '=' -f2) && \
    bun i --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=env,target=/app/.env \
    bun gen
RUN bun run build:helper

CMD ["bun", "start:helper"]
