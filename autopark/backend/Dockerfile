# AutoPark API — production image.
#
#   docker build -t autopark-api ./autopark/backend
#
# Configuration comes from the environment (see .env.example); there is no
# .env file inside the image.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY migrations ./migrations
COPY seed ./seed
COPY seed.js ./

# Fine photos (private) and uploads live on volumes; the process runs as the
# unprivileged "node" user, which must be able to write there.
RUN mkdir -p storage/fines uploads && chown -R node:node storage uploads
USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
