# ==============================================================================
# Google Cloud Run Deployment Script (PowerShell) — ScamShield Live
# ==============================================================================
$ErrorActionPreference = "Stop"

$ProjectId = (gcloud config get-value project 2>$null)
$Region = "us-central1"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Deploying ScamShield Live to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $ProjectId" -ForegroundColor Yellow
Write-Host " Region:  $Region" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

if (-not $ProjectId) {
    Write-Error "No active GCP project found. Run: gcloud config set project <PROJECT_ID>"
    exit 1
}

Write-Host "1. Enabling required Google Cloud APIs..." -ForegroundColor Green
gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    secretmanager.googleapis.com `
    aiplatform.googleapis.com

Write-Host "2. Deploying Backend to Cloud Run..." -ForegroundColor Green
gcloud run deploy scamshield-backend `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars DEMO_MODE=true,HOST=0.0.0.0,PORT=8080

$BackendUrl = (gcloud run services describe scamshield-backend --region $Region --format 'value(status.url)')
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Green

Write-Host "3. Deploying Frontend to Cloud Run..." -ForegroundColor Green
Set-Location "apps/web"
gcloud run deploy scamshield-frontend `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated
Set-Location "../.."

$FrontendUrl = (gcloud run services describe scamshield-frontend --region $Region --format 'value(status.url)')

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " ScamShield Live Deployed Successfully on Google Cloud Run!" -ForegroundColor Green
Write-Host " Web Application: $FrontendUrl" -ForegroundColor Yellow
Write-Host " Backend API:     $BackendUrl" -ForegroundColor Yellow
Write-Host " Health Check:    $BackendUrl/health" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
