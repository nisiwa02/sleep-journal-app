#!/bin/bash

set -e

echo "======================================"
echo "Enabling required Google Cloud APIs"
echo "======================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No GCP project is set. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Current project: $PROJECT_ID"
echo ""

# Enable required APIs
echo "Enabling Cloud Run API..."
gcloud services enable run.googleapis.com --project="$PROJECT_ID"

echo "Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com --project="$PROJECT_ID"

echo "Enabling Cloud Build API (for building containers)..."
gcloud services enable cloudbuild.googleapis.com --project="$PROJECT_ID"

echo "Enabling Artifact Registry API..."
gcloud services enable artifactregistry.googleapis.com --project="$PROJECT_ID"

echo ""
echo "======================================"
echo "All required APIs have been enabled!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run ./deploy_backend.sh to deploy the backend"
echo "2. Run ./deploy_frontend.sh to deploy the frontend"
