# Multi-stage build for SvelteKit app
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle schema
RUN npm run db:generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit

# Copy the built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy necessary files for runtime
COPY --from=builder /app/src/lib/server/db ./src/lib/server/db
COPY --from=builder /app/drizzle ./drizzle

# Change ownership of the app directory
RUN chown -R sveltekit:nodejs /app

USER sveltekit

EXPOSE 5173

ENV PORT=5173
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "build"]
