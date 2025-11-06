FROM node:24-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run generate

FROM caddy:alpine

COPY --from=builder /app/.output/public /usr/share/caddy

COPY <<"EOT" /etc/caddy/Caddyfile
{
    auto_https disable_redirects
}

# HTTPS version (for WebRTC peer discovery - requires Web Crypto API)
:443 {
    tls internal {
        on_demand
    }
    file_server
    root * /usr/share/caddy
}

# HTTP version (for manual HTTP peer connections)
:80 {
    file_server
    root * /usr/share/caddy
}
EOT

EXPOSE 443 80
