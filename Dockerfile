# Multi-stage build

# Builder Stage
FROM node:24-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production Stage
FROM node:24-alpine AS production

WORKDIR /app
RUN apk --no-cache add ca-certificates wget
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ormconfig.ts ./
COPY --from=builder /app/src/database ./src/database

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3222

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3222/api/v1/payslip/health || exit 1

CMD ["node", "dist/src/main.js"]
