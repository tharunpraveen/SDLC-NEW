# ================================================================
# TCS MaturityIQ - Backend Dockerfile
# Multi-stage / Production-ready Node.js container
# ================================================================

FROM node:20-alpine AS runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# Install curl for optional container healthchecks
RUN apk add --no-cache curl

# Copy dependency manifests first for optimal Docker layer caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY server.js frameworkConfig.js auth.js db.js ./
COPY db ./db
COPY postgres_schema.sql ./

# Use unprivileged 'node' user for enhanced security
USER node

# Expose backend service port
EXPOSE 3001

# Start backend server
CMD ["node", "server.js"]
