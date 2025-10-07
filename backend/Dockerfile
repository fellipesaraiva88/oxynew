# ====================================
# Build Stage
# ====================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ====================================
# Production Stage
# ====================================
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    dumb-init \
    git

# Create sessions directory for Baileys persistence
# Note: Render Disk will mount over this, but we set permissions anyway
RUN mkdir -p /app/sessions && \
    chmod 777 /app/sessions && \
    chown -R node:node /app/sessions

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy any necessary runtime files
COPY --from=builder /app/scripts ./scripts

# Make init script executable
RUN chmod +x ./scripts/init-sessions.sh

# CRITICAL: Create mount point for Render Persistent Disk
# Render will mount disk at /app/data, then code creates /app/data/sessions as subdir
# This avoids permission issues with direct mount on /app/sessions
RUN mkdir -p /app/data && \
    chmod 777 /app/data && \
    chown -R node:node /app/data

# Create simple startup script (permissions already set above)
RUN echo '#!/bin/sh\nexec node dist/server.js' > /app/start.sh && \
    chmod +x /app/start.sh

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start with wrapper script
CMD ["/bin/sh", "/app/start.sh"]
