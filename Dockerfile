# syntax=docker/dockerfile:1

# ============================================================
# PIN-DEX multi-stage build (custom server + WebSocket /ws)
# Stages: base -> deps -> builder -> runner
# The runner keeps node_modules + .next + custom server.js so
# Next.js runs inside `server.js` (WebSocket support).
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
# The npm cache mount persists across builds on the host, so package
# downloads are only fetched once ever (requires BuildKit / Docker >= 23).
RUN --mount=type=cache,target=/root/.npm \
  npm install --no-audit --no-fund --no-update-notifier --prefer-offline

# ---- builder: compile app ----
FROM deps AS builder
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SOLANA_NETWORK=devnet
ENV NEXT_PUBLIC_SOLANA_NETWORK=$NEXT_PUBLIC_SOLANA_NETWORK

ARG NEXT_PUBLIC_PRESALE_PROGRAM_ID
ARG NEXT_PUBLIC_PRESALE_COLLECTION_WALLET
ARG NEXT_PUBLIC_PRESALE_TOKEN_MINT
ARG NEXT_PUBLIC_PRESALE_ADMIN_WALLET
ARG NEXT_PUBLIC_PRESALE_RPC_ENDPOINT
ARG NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN
ARG NEXT_PUBLIC_TOKEN_PRICE_IDR
ARG NEXT_PUBLIC_IDR_PER_SOL
ARG NEXT_PUBLIC_PRESALE_MIN_TOKENS
ARG NEXT_PUBLIC_PRESALE_MAX_TOKENS
ARG NEXT_PUBLIC_REGISTRATION_FEE_SOL
ARG NEXT_PUBLIC_LOGIN_FEE_SOL
ARG NEXT_PUBLIC_PRESALE_START
ARG NEXT_PUBLIC_PRESALE_END
ARG NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS
ARG NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS
ARG NEXT_PUBLIC_PRESALE_TGE_PCT
ENV NEXT_PUBLIC_PRESALE_PROGRAM_ID=$NEXT_PUBLIC_PRESALE_PROGRAM_ID \
  NEXT_PUBLIC_PRESALE_COLLECTION_WALLET=$NEXT_PUBLIC_PRESALE_COLLECTION_WALLET \
  NEXT_PUBLIC_PRESALE_TOKEN_MINT=$NEXT_PUBLIC_PRESALE_TOKEN_MINT \
  NEXT_PUBLIC_PRESALE_ADMIN_WALLET=$NEXT_PUBLIC_PRESALE_ADMIN_WALLET \
  NEXT_PUBLIC_PRESALE_RPC_ENDPOINT=$NEXT_PUBLIC_PRESALE_RPC_ENDPOINT \
  NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN=$NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN \
  NEXT_PUBLIC_TOKEN_PRICE_IDR=$NEXT_PUBLIC_TOKEN_PRICE_IDR \
  NEXT_PUBLIC_IDR_PER_SOL=$NEXT_PUBLIC_IDR_PER_SOL \
  NEXT_PUBLIC_PRESALE_MIN_TOKENS=$NEXT_PUBLIC_PRESALE_MIN_TOKENS \
  NEXT_PUBLIC_PRESALE_MAX_TOKENS=$NEXT_PUBLIC_PRESALE_MAX_TOKENS \
  NEXT_PUBLIC_REGISTRATION_FEE_SOL=$NEXT_PUBLIC_REGISTRATION_FEE_SOL \
  NEXT_PUBLIC_LOGIN_FEE_SOL=$NEXT_PUBLIC_LOGIN_FEE_SOL \
  NEXT_PUBLIC_PRESALE_START=$NEXT_PUBLIC_PRESALE_START \
  NEXT_PUBLIC_PRESALE_END=$NEXT_PUBLIC_PRESALE_END \
  NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS=$NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS \
  NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS=$NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS \
  NEXT_PUBLIC_PRESALE_TGE_PCT=$NEXT_PUBLIC_PRESALE_TGE_PCT

# Persist Next.js's own build cache (.next/cache) + npm cache so an
# incremental deploy only compiles the pages that actually changed.
RUN --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/app/.next/cache \
  npm run build

# ---- runner: runtime image ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3112 \
  HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/instrumentation.ts ./instrumentation.ts
COPY --from=builder --chown=nextjs:nodejs /app/proxy.ts ./proxy.ts

USER nextjs
EXPOSE 3112

CMD ["node", "server.js"]