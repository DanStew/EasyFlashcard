# ==============================================================================
# EasyFlashcard Frontend Dockerfile
# Multi-stage build: Node.js 20 build stage -> Nginx Alpine production server
# ==============================================================================

# Stage 1: Build static assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package dependency manifests
COPY package.json package-lock.json ./

# Clean dependency installation
RUN npm ci

# Copy application source files
COPY . .

# Build production bundle using Vite & TypeScript
RUN npm run build

# Stage 2: Serve static bundle via Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage to Nginx webroot
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
