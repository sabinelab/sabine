FROM oven/bun:1.3.4-alpine

WORKDIR /app

COPY package.json bun.lock /app/
COPY . .

RUN bun i --frozen-lockfile
RUN bun gen
RUN bun push
RUN bun run build

CMD ["bun", "start"]