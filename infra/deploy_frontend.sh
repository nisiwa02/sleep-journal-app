#!/bin/bash

set -e

echo "======================================"
echo "Deploying Frontend to Cloud Run"
echo "======================================"

# Configuration
SERVICE_NAME="sleep-journal-frontend"
REGION="${REGION:-asia-northeast1}"

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No GCP project is set. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo ""

# Check if BACKEND_URL is provided
if [ -z "$BACKEND_URL" ]; then
    echo "Warning: BACKEND_URL not set. Attempting to fetch from deployed backend..."
    BACKEND_URL=$(gcloud run services describe "sleep-journal-backend" \
        --region "$REGION" \
        --format 'value(status.url)' \
        --project="$PROJECT_ID" 2>/dev/null || echo "")

    if [ -z "$BACKEND_URL" ]; then
        echo "Error: Could not find backend URL. Please set BACKEND_URL environment variable."
        echo "Example: export BACKEND_URL=https://your-backend-url.run.app"
        exit 1
    fi
fi

echo "Backend URL: $BACKEND_URL"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

# Deploy to Cloud Run with build argument
echo "Building and deploying frontend..."
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --set-build-env-vars "VITE_API_BASE_URL=${BACKEND_URL}" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --timeout 30 \
    --max-instances 10 \
    --min-instances 0 \
    --project="$PROJECT_ID"

# Get the service URL
FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format 'value(status.url)' \
    --project="$PROJECT_ID")

echo ""
echo "======================================"
echo "Frontend deployment completed!"
echo "======================================"
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "IMPORTANT: Update backend CORS settings"
echo "Run the following command to allow frontend to access backend:"
echo ""
echo "gcloud run services update sleep-journal-backend \\"
echo "  --region $REGION \\"
echo "  --update-env-vars ALLOWED_ORIGINS=${FRONTEND_URL} \\"
echo "  --project=$PROJECT_ID"
echo ""
echo "After updating CORS, test your application at:"
echo "$FRONTEND_URL"
