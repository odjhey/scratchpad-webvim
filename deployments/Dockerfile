# syntax=docker/dockerfile:1

FROM node:24.16.0-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY index.html ./
COPY src ./src

RUN pnpm build


FROM caddy:2-alpine AS runtime

WORKDIR /srv

COPY deployments/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
