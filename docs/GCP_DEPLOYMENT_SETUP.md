# Google Cloud Run Deployment Setup Guide

This guide walks you through setting up automated deployments for the **EasyFlashcard** backend to **Google Cloud Run** in region `europe-west1` under your GCP project (e.g. `<YOUR_GCP_PROJECT_ID>`), authenticated securely through GitHub Actions using a dedicated Service Account.

---

## 1. Prerequisites
- Access to the Google Cloud Console for your GCP project (e.g. `<YOUR_GCP_PROJECT_ID>`)
- Google Cloud CLI (`gcloud`) installed locally (optional, or use Google Cloud Shell directly in the browser)

---

## 2. Google Cloud Setup (5 Minutes)

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
  --description="EasyFlashcard Docker repository for backend containers" \
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

## 3. GitHub Secrets Configuration

In your GitHub repository:
1. Go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** for each of the following 5 secrets:

| Secret Name | Exact Value | Description |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | `<YOUR_GCP_PROJECT_ID>` | Your GCP Project ID |
| `GCP_SA_KEY` | *(Paste entire contents of `sa-key.json`)* | Service Account JSON credentials |
| `GCP_REGION` | `europe-west1` | Target Cloud Run & Artifact Registry region |
| `GCP_SERVICE_NAME` | `easyflashcard-backend` | Cloud Run service identifier |
| `GCP_ARTIFACT_REPO` | `easyflashcard-docker` | Name of your Artifact Registry repository |

> [!IMPORTANT]
> The GitHub Actions workflow enforces **zero fallbacks**. If any secret is missing or empty, the deployment will fail immediately with a clear error before making any network calls.

---

## 4. Triggering the Deployment

The deployment workflow [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) runs:
1. **Automatically**: On every `git push` to the `main` branch whenever files in `backend/**` change.
2. **Manually**: 
   - Navigate to your repository on GitHub.
   - Click the **Actions** tab.
   - Select **"Deploy Backend to Google Cloud Run"** from the left sidebar.
   - Click **Run workflow** > **Run workflow**.

When complete, the workflow logs will display:
```
============================================================
Cloud Run Deployment Complete!
Service URL: https://easyflashcard-backend-xxxxx-ew.a.run.app
API Base Endpoint: https://easyflashcard-backend-xxxxx-ew.a.run.app/api/v1
============================================================
```

---

## 5. Connecting Your Phone App to Cloud Run

Once deployed, you can connect your Android APK in two ways:

### Method A: In-App Server Settings (Instant, No Rebuild Needed)
1. Open the **EasyFlashcard** app on your phone.
2. Tap the **Server** icon at the bottom of the sidebar.
3. Paste your Cloud Run endpoint (e.g. `https://easyflashcard-backend-xxxxx-ew.a.run.app/api/v1`).
4. Tap **Test Connection** (you should see a green checkmark with latency).
5. Tap **Save Endpoint**. The app will now sync with Cloud Run from anywhere!

### Method B: Default into the APK Build
1. In `frontend/`, create or update `.env`:
   ```env
   VITE_API_BASE_URL=https://easyflashcard-backend-xxxxx-ew.a.run.app/api/v1
   ```
2. Recompile and sync the Android APK:
   ```bash
   npm run cap:build
   cd android
   .\gradlew.bat assembleDebug
   ```
3. Copy the updated `app-debug.apk` to your phone. It will now connect to Cloud Run automatically upon opening.
