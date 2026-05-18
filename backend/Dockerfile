# Multi-stage build — dev stage used by docker-compose.yml
# Production stage used by docker-compose.prod.yml

# ── STAGE 1: Dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./

RUN npm ci

# ── STAGE 2: Development ───────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL=postgresql://sefinet_admin:devpassword123@localhost:5432/sefinet_db
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

# ── STAGE 3: Builder ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL=postgresql://sefinet_admin:devpassword123@localhost:5432/sefinet_db
RUN npx prisma generate && npm run build

# ── STAGE 4: Production ────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma.config.ts ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma/generated ./prisma/generated
COPY scripts ./scripts

RUN chmod +x scripts/migrate.sh && \
    mkdir -p /app/uploads/teachers /app/uploads/students && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

CMD ["sh", "-c", "sh /app/scripts/migrate.sh && node dist/src/server.js"]
