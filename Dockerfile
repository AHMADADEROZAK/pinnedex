# ---- base image ----
FROM node:24-alpine AS base

WORKDIR /app

# Dependencies.
# The committed lockfile is Windows-generated and omitted Linux optional
# platform deps, so strict `npm ci` fails as "out of sync" on Linux. Use
# `npm install` so npm reconciles the lockfile for the host platform.
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are inlined into the client bundle at build time,
# so they must be present here. Passed via ARG from docker-compose.
ARG NEXT_PUBLIC_SOLANA_NETWORK=devnet
ENV NEXT_PUBLIC_SOLANA_NETWORK=$NEXT_PUBLIC_SOLANA_NETWORK

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3112
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3112

CMD ["node", "server.js"]
