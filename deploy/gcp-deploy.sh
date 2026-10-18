#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Run Deployment Script — ScamShield Live
# ==============================================================================
set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"

echo "================================================================="
echo " Deploying ScamShield Live to Google Cloud Run"
echo " Project: ${PROJECT_ID:-[NOT SET]}"
echo " Region:  ${REGION}"
echo "================================================================="

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No active GCP project. Run: gcloud config set project <PROJECT_ID>"
    exit 1
fi

echo "1. Enabling required Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    aiplatform.googleapis.com

echo "2. Building and deploying Backend to Cloud Run..."
gcloud run deploy scamshield-backend \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars DEMO_MODE=true,HOST=0.0.0.0,PORT=8080

BACKEND_URL=$(gcloud run services describe scamshield-backend --region "$REGION" --format 'value(status.url)')
echo "Backend URL: $BACKEND_URL"

echo "3. Building and deploying Frontend to Cloud Run..."
cd apps/web
gcloud run deploy scamshield-frontend \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated

FRONTEND_URL=$(gcloud run services describe scamshield-frontend --region "$REGION" --format 'value(status.url)')

echo "================================================================="
echo " ScamShield Live Deployed Successfully on Google Cloud Run!"
echo " Web Application URL: $FRONTEND_URL"
echo " Backend Service URL: $BACKEND_URL"
echo " Health Endpoint:     $BACKEND_URL/health"
echo "================================================================="
