# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js inlines NEXT_PUBLIC_* env vars into the built JS at build time —
# the *browser*, not this container, is what calls the backend, so this
# needs to be a browser-reachable URL (e.g. http://localhost:8080 when the
# backend's port is published to the host), never a Docker-internal
# service name like http://backend:8080. Passed via docker-compose.yml's
# `build.args` for the compose-managed stack; override with
# `--build-arg NEXT_PUBLIC_BACKEND_URL=...` for a standalone build.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
RUN npm run build

# next.config.ts sets output: "standalone", which traces exactly which
# node_modules files the built server needs and copies just those into
# .next/standalone — this stage ships only that trimmed-down output
# rather than the full node_modules tree, which is what keeps this image
# small.
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
