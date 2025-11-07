FROM node:24-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM caddy:alpine

# Install Node.js and OpenSSL for Nitro server and certificates
RUN apk add --no-cache nodejs openssl

# Copy built Nuxt app
COPY --from=builder /app/.output /app

# Generate self-signed certificates
RUN mkdir -p /certs && \
    openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /certs/key.pem \
    -out /certs/cert.pem \
    -days 365 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1"

# Caddyfile with proxy and static file serving
COPY <<EOT /etc/caddy/Caddyfile
{
    auto_https off
}

:3000 {
    tls /certs/cert.pem /certs/key.pem

    # Proxy for native clients
    handle_path /api/proxy/* {
        @target path_regexp target ^/([^/]+)(.*)$
        reverse_proxy @target {re.target.1} {
            rewrite {re.target.2}
        }
    }

    # API routes → Nitro
    handle /api/* {
        reverse_proxy localhost:3002
    }

    # Static files → serve directly from /app/public
    handle /_nuxt/* {
        root * /app/public
        file_server
    }

    handle /favicon.ico {
        root * /app/public
        file_server
    }

    handle /apple-touch-icon.png {
        root * /app/public
        file_server
    }

    handle /robots.txt {
        root * /app/public
        file_server
    }

    # Everything else → Nitro (SSR)
    handle {
        reverse_proxy localhost:3002
    }
}
EOT

# Start script
COPY <<EOT /start.sh
#!/bin/sh
cd /app
PORT=3002 node server/index.mjs &
caddy run --config /etc/caddy/Caddyfile
EOT

RUN chmod +x /start.sh

CMD ["/start.sh"]
