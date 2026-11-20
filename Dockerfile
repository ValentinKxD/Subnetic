# Subnetic: Express API + зібраний React-сайт в одному контейнері.

# ── 1. Збирання ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
# Інструменти на випадок, якщо для better-sqlite3 немає готової збірки і її треба скомпілювати.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY shared shared
COPY client client
COPY server server
RUN npm run build -w client

# ── 2. Запуск ───────────────────────────────────────────────
FROM node:22-bookworm-slim
# tzdata — щоб «сьогодні» й дати платежів рахувались за TZ (Europe/Kyiv), а не за UTC.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tzdata \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/shared shared
COPY --from=build /app/server server
COPY --from=build /app/client/dist client/dist
COPY docker/app-entrypoint.sh /usr/local/bin/app-entrypoint.sh
RUN chmod +x /usr/local/bin/app-entrypoint.sh && mkdir -p /data && chown node:node /data

ENV PORT=3001 \
    SUBNETIC_DB=/data/subnetic.db \
    CLIENT_DIST=/app/client/dist \
    TZ=Europe/Kyiv

USER node
WORKDIR /app/server
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["app-entrypoint.sh"]
