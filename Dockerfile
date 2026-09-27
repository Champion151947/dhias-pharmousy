# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- build stage
# Installs every workspace dependency and builds the React bundle.
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so the dependency layer is cached across code edits.
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN npm ci

COPY api/ ./api/
COPY web/ ./web/
RUN npm run build

# -------------------------------------------------------------- runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    DATA_DIR=/app/data

# Production dependencies only. The lockfile lives at the repo root because
# api/ and web/ are npm workspaces.
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN npm ci --omit=dev && npm cache clean --force

# Only what the server needs at runtime: the API, the seed helpers it imports,
# and the prebuilt storefront it serves.
COPY api/src/ ./api/src/
COPY api/scripts/ ./api/scripts/
COPY --from=build /app/web/dist/ ./web/dist/

# The JSON store and prescription uploads must be writable by the runtime user.
# Mount a real volume over /app/data to survive container replacement.
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "api/src/server.js"]
