# AutoPark web portal — static build served by nginx, which also proxies
# /api and /socket.io to the API container.
#
# Build context: the REPOSITORY ROOT, because the theme is generated from
# design/tokens during the build:
#
#   docker build -f autopark/web/Dockerfile -t autopark-web .

FROM node:22-alpine AS build
WORKDIR /src/autopark/web

COPY autopark/web/package.json autopark/web/package-lock.json ./
RUN npm ci

COPY design /src/design
COPY autopark/web ./

# Same-origin by default: nginx serves the portal and proxies /api, so the
# refresh cookie stays first-party.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY autopark/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/autopark/web/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/healthz || exit 1
