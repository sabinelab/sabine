FROM oven/bun:1.3.6-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY .npmrc ./
COPY apps/sabine/package.json ./apps/sabine/package.json

RUN --mount=type=secret,id=env,target=/app/.env \
    export GITHUB_AUTH_TOKEN=$(grep GITHUB_AUTH_TOKEN /app/.env | cut -d '=' -f2) && \
    bun i --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=env,target=/app/.env \
    bun gen
RUN bun run build:sabine

CMD ["bun", "start:sabine"]