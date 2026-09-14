# BIS Assistant

An intelligent AI assistant for Bureau of Indian Standards (BIS) regulations, documentation, and compliance.

## Project Structure

```
bis-assistant/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py
│   │   │       └── chat.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │
│   │   ├── schemas/
│   │   │   └── chat.py
│   │   │
│   │   └── services/
│   │       ├── groq_service.py
│   │       ├── gemini_service.py
│   │       ├── langchain_service.py
│   │       ├── rag_service.py
│   │       ├── citation_service.py
│   │       ├── sarvam_service.py
│   │       └── viasocket_service.py
│   │
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
└── frontend/
    └── Vite React app
```

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

FastAPI Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

Frontend application will run at: [http://localhost:5173](http://localhost:5173)
