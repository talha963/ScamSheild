# ==============================================================================
# ScamShield Live - Production Multi-Stage Dockerfile
# AI Builder Cup 2026 | Banking, Financial Services & Insurance Track
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the React 19 Frontend PWA
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /build

# Copy web package specifications
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

# Copy web source code and compile production assets
COPY apps/web/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Python Backend Runtime & Unified Host
# ------------------------------------------------------------------------------
FROM python:3.11-slim

# Prevent python from buffering stdout/stderr and writing bytecode
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=7860
ENV HOST=0.0.0.0

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install wheels
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . /app

# Copy compiled frontend assets from Stage 1 into apps/web/dist
COPY --from=frontend-builder /build/dist /app/apps/web/dist
COPY scamshield.apk /app/apps/web/dist/scamshield.apk
COPY CogniFlow_AI_Builder_Cup_Submission.pptx /app/apps/web/dist/CogniFlow_AI_Builder_Cup_Submission.pptx

# Create non-root user for Hugging Face Spaces / secure cloud runners
RUN useradd -m -u 1000 user && chown -R user:user /app
USER user

# Expose the application port
EXPOSE 7860

# Healthcheck for container orchestrators (Hugging Face / Cloud Run / Docker)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7860/health || exit 1

# Launch the unified ScamShield Live service
CMD ["python", "run_system.py"]
