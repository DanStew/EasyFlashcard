# Google Cloud Run Deployment Setup Guide

This guide walks you through setting up automated deployments for the **EasyFlashcard** backend and frontend web application to **Google Cloud Run** in region `europe-west1` under your GCP project, authenticated securely through GitHub Actions using a dedicated Service Account.

---

## 1. Architecture Overview

Both the backend and frontend are containerized and deployed as independent services on Google Cloud Run:

```
                            ┌─────────────────────────────────────────┐
                            │          Google Cloud Run               │
                            │                                         │
┌─────────────────┐  HTTPS  │  ┌───────────────────────────────────┐  │
│  User Browser   ├─────────┼─►│  Frontend (easyflashcard-frontend)│  │
└─────────────────┘         │  └─────────────────┬─────────────────┘  │
                            │                    │ VITE_API_BASE_URL  │
┌─────────────────┐  HTTPS  │  ┌─────────────────▼─────────────────┐  │
│   Mobile App    ├─────────┼─►│   Backend (easyflashcard-backend) │  │
└─────────────────┘         │  └─────────────────┬─────────────────┘  │
                            │                    │                    │
                            └────────────────────┼────────────────────┘
                                                 │
                                                 ▼
                                        Firestore / Vertex AI
```

---

## 2. Google Cloud Setup (One-Time, 5 Minutes)

You can run these commands in the **Google Cloud Shell** (click the `>_` terminal icon in the top right of your [GCP Console](https://console.cloud.google.com)):

### Step 2.1: Enable Required GCP APIs
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  --project=<YOUR_GCP_PROJECT_ID>
```

### Step 2.2: Create Artifact Registry Docker Repository
Create a Docker registry in `europe-west1` named `easyflashcard-docker`:
```bash
gcloud artifacts repositories create easyflashcard-docker \
  --repository-format=docker \
  --location=europe-west1 \
  --description="EasyFlashcard Docker repository for containers" \
  --project=<YOUR_GCP_PROJECT_ID>
```

### Step 2.3: Create Service Account for GitHub Actions
Create a dedicated deployment service account:
```bash
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer" \
  --project=<YOUR_GCP_PROJECT_ID>
```

### Step 2.4: Grant Minimum IAM Roles to Service Account
Grant the 3 required roles to allow building, pushing, and deploying containers:
```bash
# 1. Cloud Run Administrator (to create and update Cloud Run revisions)
gcloud projects add-iam-policy-binding <YOUR_GCP_PROJECT_ID> \
  --member="serviceAccount:github-actions-deployer@<YOUR_GCP_PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# 2. Artifact Registry Writer (to push container images)
gcloud projects add-iam-policy-binding <YOUR_GCP_PROJECT_ID> \
  --member="serviceAccount:github-actions-deployer@<YOUR_GCP_PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# 3. Service Account User (allows Cloud Run to run as the compute service account)
gcloud projects add-iam-policy-binding <YOUR_GCP_PROJECT_ID> \
  --member="serviceAccount:github-actions-deployer@<YOUR_GCP_PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Step 2.5: Generate and Download Service Account JSON Key
```bash
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=github-actions-deployer@<YOUR_GCP_PROJECT_ID>.iam.gserviceaccount.com \
  --project=<YOUR_GCP_PROJECT_ID>

# View the JSON key to copy into GitHub
cat sa-key.json
```
*(Keep this JSON key safe and delete the local `sa-key.json` file once copied into GitHub Secrets).*

---

## 3. GitHub Secrets & Variables Configuration

In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.

### Required Repository Secrets (under "Repository secrets")

| Secret Name | Value Example | Description |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | `<YOUR_GCP_PROJECT_ID>` | Your Google Cloud project ID |
| `GCP_SA_KEY` | *(Entire contents of `sa-key.json`)* | Service Account JSON credentials |
| `GCP_REGION` | `europe-west1` | Target Cloud Run & Artifact Registry region |
| `GCP_ARTIFACT_REPO` | `easyflashcard-docker` | Name of your Artifact Registry repository |

### Optional Service Customization Secrets/Variables

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `GCP_BACKEND_SERVICE_NAME` | Secret / Variable | `easyflashcard-backend` | Cloud Run service name for backend |
| `GCP_FRONTEND_SERVICE_NAME` | Secret / Variable | `easyflashcard-frontend` | Cloud Run service name for frontend |
| `VITE_API_BASE_URL` | Secret / Variable | *Empty (or /api/v1)* | Cloud Run backend URL (e.g. `https://easyflashcard-backend-xxxxx-ew.a.run.app/api/v1`) |
| `VITE_FIREBASE_API_KEY` | Secret / Variable | *Optional* | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Secret / Variable | *Optional* | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Secret / Variable | `GCP_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Secret / Variable | *Optional* | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Secret / Variable | *Optional* | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Secret / Variable | *Optional* | Firebase App ID |
| `VITE_OAUTH_CLIENT_ID` | Secret / Variable | *Optional* | Google OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Secret | *Optional* | Backend OAuth client secret for Drive token exchange |
| `VERTEX_PROJECT_ID` | Secret / Variable | `GCP_PROJECT_ID` | Vertex AI Project ID (if different from GCP project) |

> [!IMPORTANT]
> The GitHub Actions workflows enforce strict secret validation with zero fallbacks for required GCP parameters. All build-time secrets are passed safely into Docker without printing credentials to logs.

---

## 4. GitHub Actions Workflows

Three workflows are configured:

### 1. `deploy.yml` — Automated Master CI/CD on `main`
- **Trigger**: Automatically runs on every `git push` to `main` branch.
- **Smart Path Filtering**: Detects whether changes occurred in `backend/`, `frontend/`, or both, and deploys only the affected service(s).
- **Manual Trigger**: Can also be triggered manually via `workflow_dispatch` with a target selector (`all`, `backend`, or `frontend`).

### 2. `deploy-frontend.yml` — On-Demand Frontend Deployment
- **Trigger**: `workflow_dispatch` (manual trigger).
- **Action**: Builds the Vite production bundle with injected `VITE_*` environment variables, containerizes with Nginx on Alpine, pushes to Artifact Registry, and deploys to Cloud Run with `--port 80`.

### 3. `deploy-backend.yml` — On-Demand Backend Deployment
- **Trigger**: `workflow_dispatch` (manual trigger).
- **Action**: Builds the FastAPI Python container with `uv`, pushes to Artifact Registry, deploys to Cloud Run with `--port 8000`, and verifies the `/health` endpoint.

---

## 5. How to Deploy Manually

1. Navigate to your repository on GitHub.
2. Click the **Actions** tab.
3. Select the desired workflow from the left sidebar:
   - **"Deploy Application to Google Cloud Run"** (deploy all or selected components)
   - **"Deploy Frontend to Google Cloud Run"** (frontend only)
   - **"Deploy Backend to Google Cloud Run"** (backend only)
4. Click **Run workflow** > **Run workflow**.

When deployment finishes, the workflow logs will output the active service URLs:
```
============================================================
Frontend Cloud Run Deployment Complete!
Service URL: https://easyflashcard-frontend-xxxxx-ew.a.run.app
============================================================

============================================================
Backend Cloud Run Deployment Complete!
Service URL: https://easyflashcard-backend-xxxxx-ew.a.run.app
API Base Endpoint: https://easyflashcard-backend-xxxxx-ew.a.run.app/api/v1
============================================================
```

---

## 6. Connecting Frontend to Backend in Production

1. After deploying the backend for the first time, copy the backend URL (e.g. `https://easyflashcard-backend-xxxxx-ew.a.run.app/api/v1`).
2. Add or update the GitHub Secret or Variable `VITE_API_BASE_URL` with this value.
3. Trigger the frontend deployment (`deploy-frontend.yml` or `deploy.yml`).
4. The frontend will now automatically communicate with your Cloud Run backend!
