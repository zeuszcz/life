# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
# Prisma needs openssl; libc6-compat smooths over musl differences.
RUN apk add --no-cache openssl libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# ---- dependencies (also generates the Prisma client via postinstall) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- build ----
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM build AS runner
ENV NODE_ENV=production
EXPOSE 3000
# Apply migrations, then start. Achievements self-seed on boot (instrumentation.ts).
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -p 3000 -H 0.0.0.0"]
