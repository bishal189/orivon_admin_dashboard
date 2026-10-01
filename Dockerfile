FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["sh", "-c", "printf 'window.__APP_CONFIG__ = { apiBaseUrl: \"%s\" }\\n' \"${VITE_API_BASE_URL:-/api}\" > /usr/share/nginx/html/config.js && exec nginx -g 'daemon off;'"]
