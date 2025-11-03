FROM node:24-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run generate

FROM caddy:alpine

COPY --from=builder /app/.output/public /usr/share/caddy

COPY <<"EOT" /etc/caddy/Caddyfile
:3000 {
    file_server
    root * /usr/share/caddy
}
EOT

EXPOSE 3000
