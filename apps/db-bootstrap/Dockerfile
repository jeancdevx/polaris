# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

RUN apk add --no-cache libc6-compat

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/db-bootstrap/package.json ./apps/db-bootstrap/
COPY packages/database/package.json ./packages/database/
COPY packages/domain/package.json ./packages/domain/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/build-config/package.json ./packages/build-config/

RUN pnpm install --frozen-lockfile --filter=db-bootstrap...

COPY apps/db-bootstrap ./apps/db-bootstrap
COPY packages/database ./packages/database
COPY packages/domain ./packages/domain
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY packages/tsconfig ./packages/tsconfig
COPY packages/build-config ./packages/build-config

RUN pnpm turbo run build --filter=db-bootstrap...
RUN pnpm deploy --filter=db-bootstrap --prod --legacy /app/deploy

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S appuser -G nodejs

COPY --from=builder --chown=appuser:nodejs /app/deploy/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/apps/db-bootstrap/dist ./dist

USER appuser

CMD ["node", "dist/bootstrap.js"]
