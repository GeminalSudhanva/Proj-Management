# Cloud Run Deployment Guide

## Prerequisites
1. Google Cloud SDK installed ([Download](https://cloud.google.com/sdk/docs/install))
2. Firebase service account JSON file
3. MongoDB connection string

## Quick Deploy

### 1. Initialize gcloud
```bash
gcloud init
gcloud config set project project-management-mobil-b5953
```

### 2. Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Build and Deploy
```bash
cd "e:\Web Projects\Proj Managment\Proj-Management-main"

# Build and deploy with environment variables
gcloud run deploy project-management-api \
  --source . \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URI=YOUR_MONGODB_URI" \
  --set-env-vars "SECRET_KEY=YOUR_SECRET_KEY" \
  --set-env-vars "MAIL_SERVER=YOUR_MAIL_SERVER" \
  --set-env-vars "MAIL_USERNAME=YOUR_EMAIL" \
  --set-env-vars "MAIL_PASSWORD=YOUR_PASSWORD"
```

### 4. Update Mobile App
After deployment, update the API URL in:
`Proj-Management-Mobile/src/constants/config.js`

```javascript
export const API_BASE_URL = 'https://project-management-api-XXXXX.run.app';
```

## Environment Variables Required
- `MONGO_URI` - MongoDB Atlas connection string
- `SECRET_KEY` - Flask secret key
- `MAIL_SERVER` - SMTP server
- `MAIL_PORT` - SMTP port (default: 587)
- `MAIL_USERNAME` - Email username  
- `MAIL_PASSWORD` - Email password
- `MAIL_DEFAULT_SENDER` - Default sender email

## Firebase Setup (for token verification)
For backend Firebase token verification, either:
1. Deploy to Cloud Run (uses default credentials automatically)
2. Or set `GOOGLE_APPLICATION_CREDENTIALS` env var to service account path
