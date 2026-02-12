#!/bin/bash

set -e

echo "======================================"
echo "Deploying Backend to Cloud Run"
echo "======================================"

# Configuration
SERVICE_NAME="sleep-journal-backend"
REGION="${REGION:-asia-northeast1}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"
SERVICE_ACCOUNT_NAME="sleepcopilot-runner"

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

# Check if service account exists, create if not
echo "Checking service account..."
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" --project="$PROJECT_ID" &> /dev/null; then
    echo "Creating service account: $SERVICE_ACCOUNT_NAME"
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Sleep Copilot Runner" \
        --project="$PROJECT_ID"
else
    echo "Service account already exists."
fi

SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary permissions
echo "Granting Vertex AI User role..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/aiplatform.user" \
    --condition=None

echo ""
echo "Building and deploying backend..."

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Deploy to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --service-account "$SERVICE_ACCOUNT" \
    --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},GEMINI_MODEL=${GEMINI_MODEL}" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --max-instances 10 \
    --min-instances 0 \
    --project="$PROJECT_ID"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format 'value(status.url)' \
    --project="$PROJECT_ID")

echo ""
echo "======================================"
echo "Backend deployment completed!"
echo "======================================"
echo ""
echo "Backend URL: $SERVICE_URL"
echo ""
echo "Test the API:"
echo "curl ${SERVICE_URL}/healthz"
echo ""
echo "Next step:"
echo "Update ALLOWED_ORIGINS in the backend environment variables after deploying frontend."
echo ""
echo "To update ALLOWED_ORIGINS:"
echo "gcloud run services update $SERVICE_NAME \\"
echo "  --region $REGION \\"
echo "  --update-env-vars ALLOWED_ORIGINS=https://your-frontend-url.run.app \\"
echo "  --project=$PROJECT_ID"
