# syntax=docker/dockerfile:1

# ============================================================
# PIN-DEX multi-stage build
# Stages: base -> deps -> builder -> runner
# Final image only carries Next.js standalone output (traced
# runtime code + minimal node_modules), so it stays small.
# ============================================================

# ---- base: shared runtime for every stage ----
FROM node:24-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- deps: full install (build-time deps) ----
FROM base AS deps
# Committed lockfile is Windows-generated and omits Linux optional
# platform deps, so strict `npm ci` fails "out of sync" on Linux.
# Use `npm install` so npm reconciles the lockfile for the host.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --no-update-notifier

# ---- builder: compile app to standalone output ----
FROM deps AS builder
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SOLANA_NETWORK=devnet
ENV NEXT_PUBLIC_SOLANA_NETWORK=$NEXT_PUBLIC_SOLANA_NETWORK

RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3112 \
  HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone output (traced code + only the deps it needs)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3112

CMD ["node", "server.js"]
