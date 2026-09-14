# BIS AI Assistant — Production Deployment Guide

This guide covers deploying the full-stack BIS AI Compliance Assistant across free cloud hosting (Vercel + Render) or containerized VPS (Docker Compose / AWS / GCP).

---

## Architecture Overview

```
                          [ Client Browser ]
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
        [ Vercel / Netlify ]             [ Render / Cloud Run ]
        React Vite Frontend              FastAPI Python Backend
        (Edge CDN / Global)              (Uvicorn + ONNX FastEmbed)
                     │                           │
                     │                           ▼
                     │                 [ Supabase Cloud ]
                     │                 • pgvector embeddings
                     │                 • Statutory documents
                     │                 • Standards catalogue
                     ▼                           │
               [ REST / SSE ]                    ▼
                     └────────────────► [ LLM Providers ]
                                        • Groq LLaMA / Gemini
                                        • Sarvam AI (Indic Voice)
```

---

## Option 1: Vercel (Frontend) + Render (Backend) — Recommended & Free

### Step A: Deploy Backend on Render.com

1. **Push your repository to GitHub**:
   ```bash
   git add .
   git commit -m "Add production deployment configurations"
   git push origin main
   ```
2. **Create New Web Service on [Render.com](https://render.com)**:
   * Select **"Web Service"** and connect your GitHub repository.
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: Free or Starter

3. **Configure Environment Variables on Render**:
   Add the following variables in the Render Dashboard under **Environment**:
   ```ini
   ENVIRONMENT=production
   DEBUG=False
   PYTHON_VERSION=3.11.9
   CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:5173"]
   GROQ_API_KEY=your_groq_key
   GROQ_MODEL=openai/gpt-oss-20b
   GEMINI_API_KEY=your_gemini_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   SUPABASE_URL=https://zkrdxwvgyarlqggwbegr.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
   RAG_TOP_K=5
   SARVAM_API_KEY=your_sarvam_key
   ```
4. **Copy your Render backend URL**:
   Example: `https://bis-assistant-api.onrender.com`

---

### Step B: Deploy Frontend on Vercel

1. **Log in to [Vercel.com](https://vercel.com)**:
   * Click **"Add New Project"** and select your GitHub repository.
2. **Project Settings**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. **Environment Variables**:
   Add the key:
   * `VITE_API_URL` = `https://bis-assistant-api.onrender.com` *(your Render backend URL)*
4. **Deploy**:
   Click **Deploy**. Vercel will build and assign an SSL domain (e.g., `https://bis-assistant.vercel.app`).
5. **Update Backend CORS**:
   Go back to Render & update `CORS_ORIGINS` to include your new Vercel domain.

---

## Option 2: 1-Command Docker Compose (VPS / AWS EC2 / DigitalOcean)

Deploy both frontend and backend on any virtual server with Docker and Docker Compose installed:

```bash
# 1. Clone repository
git clone <your-repo-url>
cd bis-assistant

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase, Groq, and Gemini API keys

# 3. Build and run containers
docker compose up -d --build
```

* **Frontend**: Accessible on port `80` (HTTP)
* **Backend**: Accessible on port `8000` (HTTP)
* **Healthcheck**: `curl http://localhost:8000/health`

---

## Option 3: Google Cloud Run (Serverless Container)

Fast, auto-scaling backend container:

```bash
# 1. Build and push backend image to Google Artifact Registry
gcloud builds submit --tag gcr.io/[PROJECT-ID]/bis-backend:latest ./backend

# 2. Deploy to Cloud Run
gcloud run deploy bis-backend \
  --image gcr.io/[PROJECT-ID]/bis-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,GROQ_API_KEY=...,GEMINI_API_KEY=...,SARVAM_API_KEY=...
```

---

## Pre-Flight Verification Checklist

Before taking production traffic:

- [ ] **Supabase pgvector**: Ensure `supabase_migration_v2.sql` or table schema is executed in Supabase SQL Editor.
- [ ] **Embedding Dimension**: Verify `EMBEDDING_MODEL` matches `BAAI/bge-small-en-v1.5` (dimension 384) between ingestion and query retrieval.
- [ ] **CORS Origins**: Ensure `CORS_ORIGINS` in backend allows the deployed frontend domain.
- [ ] **Health Check**: Verify `GET /health` returns `{"status": "healthy"}`.
