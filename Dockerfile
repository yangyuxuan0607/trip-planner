FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# next build 不需要連線資料庫（頁面都是動態的），migration 留到 container 啟動時再跑，
# 所以這裡直接呼叫 next build，不要用 package.json 裡含 `prisma migrate deploy` 的 build script。
RUN npx next build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# seed 腳本用 tsx 直接跑 TypeScript 原始碼，所以要保留 src（.next 產物本身不需要它）
COPY --from=builder /app/src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# 資料庫是外部的 Postgres，執行時用 -e 傳入，不在這裡給預設值：
#   DATABASE_URL / DIRECT_URL / AUTH_SECRET（必填），ANTHROPIC_API_KEY（選填）
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
