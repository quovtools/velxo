FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL (required for Prisma in Alpine)
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (including dev) so we can build and generate
RUN npm install

# Generate Prisma client
RUN npx prisma generate

COPY . .

RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL (required for Prisma in Alpine)
RUN apk add --no-cache openssl

# Install ALL deps including prisma CLI needed for db push at runtime
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Run prisma db push to auto-sync schema, then start the app
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/main"]
