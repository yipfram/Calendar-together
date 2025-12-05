# syntax=docker/dockerfile:1

# Base image with Node.js 22 (LTS, supported by Prisma 7.x)
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema for generation
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code first
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
