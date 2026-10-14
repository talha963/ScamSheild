# ==============================================================================
# ScamShield - Frontend Container (React 19 + Vite + Nginx)
# ==============================================================================

# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build static assets
COPY . ./
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built artifacts from Stage 1
COPY --from=builder /app/dist ./

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
