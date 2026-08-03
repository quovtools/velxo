FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL (required for Prisma in Alpine)
RUN apk add --no-cache openssl

# Configure npm to be more lenient with dependency resolution
RUN npm config set legacy-peer-deps=true && \
    npm config set force=true

COPY package.json ./
COPY prisma ./prisma/

# Install ALL deps (including dev) so we can build and generate
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

COPY . .

RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL (required for Prisma in Alpine)
RUN apk add --no-cache openssl

# Configure npm to be more lenient with dependency resolution
RUN npm config set legacy-peer-deps=true && \
    npm config set force=true

# Install production deps including prisma CLI needed for db push at runtime
COPY package.json ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Apply pending Prisma migrations, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy --schema ./prisma/schema.prisma && node dist/main"]
