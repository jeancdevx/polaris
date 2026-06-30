# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

RUN apk add --no-cache libc6-compat

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/event-processor-service/package.json ./apps/event-processor-service/
COPY packages/database/package.json ./packages/database/
COPY packages/domain/package.json ./packages/domain/
COPY packages/eventbridge/package.json ./packages/eventbridge/
COPY packages/kafka/package.json ./packages/kafka/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/build-config/package.json ./packages/build-config/

RUN pnpm install --frozen-lockfile --filter=event-processor-service...

COPY apps/event-processor-service ./apps/event-processor-service
COPY packages/database ./packages/database
COPY packages/domain ./packages/domain
COPY packages/eventbridge ./packages/eventbridge
COPY packages/kafka ./packages/kafka
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY packages/tsconfig ./packages/tsconfig
COPY packages/build-config ./packages/build-config

RUN pnpm turbo run build --filter=event-processor-service
RUN pnpm deploy --filter=event-processor-service --prod --legacy /app/deploy

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003
ENV HOST=0.0.0.0

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=builder --chown=nestjs:nodejs /app/deploy/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/event-processor-service/dist ./dist

USER nestjs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node --input-type=module -e "fetch('http://127.0.0.1:3003/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
