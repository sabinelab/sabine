FROM oven/bun:1.3.9

WORKDIR /app

COPY package.json bun.lock ./
COPY .npmrc ./
COPY apps/helper/package.json ./apps/helper/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/sabine/package.json ./apps/sabine/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/players/package.json ./packages/players/package.json
COPY packages/prisma/package.json ./packages/prisma/package.json
COPY packages/utils/package.json ./packages/utils/package.json

RUN --mount=type=secret,id=env,target=/app/.env \
    export GITHUB_AUTH_TOKEN=$(grep GITHUB_AUTH_TOKEN /app/.env | cut -d '=' -f2) && \
    bun i --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=env,target=/app/.env \
    bun --filter=@sabinelab/api generate
RUN bun run build:api

CMD ["bun", "start:api"]