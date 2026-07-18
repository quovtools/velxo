FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install ALL deps (including dev) so we can build and generate
RUN npm ci

COPY backend . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install ALL deps including prisma CLI needed for db push at runtime
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

# Copy compiled app
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Run prisma db push to auto-sync schema, then start the app
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/main"]
