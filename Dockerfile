# Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache openssl
COPY backend/package.json ./
RUN npm config set legacy-peer-deps=true && npm config set force=true && npm install --legacy-peer-deps
COPY backend/prisma ./prisma/
RUN npx prisma generate
COPY backend/ .
RUN npm run build

# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm run build

# Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

# Backend runtime dependencies
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN cd backend && npm install --legacy-peer-deps --omit=dev

# Frontend runtime dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --production --omit=dev

# Built artifacts
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Serve backend's static images through Next.js
RUN cp -r backend/public/images frontend/public/images || true

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["/app/start.sh"]
