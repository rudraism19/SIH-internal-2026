# BIS Assistant - AI-Powered Intelligent Assistant for Indian Standards (BIS)

FastAPI + Supabase PostgreSQL + Groq query understanding backend for **BIS Assistant** (Smart India Hackathon 2026).

---

## System Architecture

```
                    USER (Browser)
                          ↓
        Vite + React Frontend (http://localhost:5173)
                          ↓ HTTP POST /api/chat
            FastAPI Backend (http://localhost:8000)
                          ↓
         Groq Query Understanding Layer (Entity & Intent Extraction)
                          ↓
               Query Analysis Structured JSON
                          ↓
                  FastAPI Response → Vite Frontend

----------------------------------------------------------------------
DOCUMENT CATALOGUE (Knowledge Base Tracking)
----------------------------------------------------------------------
        BIS PDF Documents (knowledge_base/raw/*.pdf)
                          ↓
        Local Scanner CLI (scripts/catalogue_local_documents.py)
                          ↓ (SHA-256 Checksum, IS Extraction Guardrails)
        FastAPI Catalogue Service & Admin API (/api/documents)
                          ↓
        Supabase PostgreSQL (`bis_documents` Table)
                          ↓
                  [Future Pipeline Stages]
                Chunking → Embeddings → pgvector → RAG
```

---

## Folder Structure

```
bis-assistant/
├── knowledge_base/
│   └── raw/                             # Raw BIS Indian Standard PDF documents
│
└── backend/
    ├── app/
    │   ├── api/
    │   │   └── routes/
    │   │       ├── chat.py              # POST /api/chat (Groq query understanding)
    │   │       ├── documents.py         # /api/documents (Catalogue CRUD & status management)
    │   │       └── health.py            # GET /health
    │   ├── core/
    │   │   ├── config.py                # Environment configuration & Pydantic settings
    │   │   ├── database.py              # Supabase client singleton & db helpers
    │   │   └── errors.py                # Centralized exception handlers
    │   ├── schemas/
    │   │   ├── chat.py                  # Chat request/response & Groq analysis schemas
    │   │   └── document.py              # Document catalogue Pydantic models & validation
    │   ├── services/
    │   │   ├── catalogue_service.py     # Document catalogue service with duplicate protection
    │   │   ├── groq_service.py          # Groq query understanding service
    │   │   └── chat_service.py          # Chat request orchestration
    │   ├── __init__.py
    │   └── main.py                      # FastAPI app entry point & route mounting
    ├── scripts/
    │   └── catalogue_local_documents.py # Scans knowledge_base/raw/ for PDFs and registers in Supabase
    ├── supabase_catalogue_schema.sql    # Migration SQL script for `bis_documents` table
    ├── test_catalogue.py                # Test suite for document catalogue
    ├── requirements.txt                 # Backend dependencies
    └── README.md
```

---

## Document Catalogue Setup & Usage

### A. How to Create the Supabase Table

1. Open your [Supabase Dashboard](https://app.supabase.com).
2. Navigate to your project and open the **SQL Editor** tab from the left sidebar.
3. Open `backend/supabase_catalogue_schema.sql` in this repository.
4. Copy the entire SQL script and paste it into the Supabase SQL Editor.
5. Click **Run**.

This creates:
- The `bis_documents` table with ingestion lifecycle statuses (`pending`, `downloading`, `downloaded`, `processing`, `chunked`, `embedded`, `indexed`, `failed`).
- Performance indexes on `standard_number`, `product`, `document_type`, `ingestion_status`, `file_checksum`, and `file_path`.
- An automatic trigger to keep `updated_at` current on every update.
- Row-Level Security (RLS) policies allowing `service_role` full CRUD access.

---

### B. How to Add a BIS PDF

Place official Bureau of Indian Standards (BIS) PDF files into:

```
knowledge_base/raw/
```

Example directory view:
```
bis-assistant/
└── knowledge_base/
    └── raw/
        ├── IS-1460-2017.pdf
        ├── IS-17803-2022.pdf
        └── INDIANSTANDARDSFORPETROLEUMPRODUCTS.pdf
```

---

### C. How to Run the Catalogue Script

Run the automated scanner to catalogue all local PDFs into Supabase:

```powershell
python scripts/catalogue_local_documents.py
```

Optional custom folder path:
```powershell
python scripts/catalogue_local_documents.py --folder "path/to/custom/folder"
```

**Key Features of the Scanner:**
- **Streaming SHA-256 Checksum**: Efficiently hashes files in 64KB blocks to detect file changes and prevent duplicate records.
- **IS Extraction Guardrails**: Strict regular expressions extract genuine Indian Standard numbers (e.g. `IS 1460:2017`). **Filenames are never assumed to be standard numbers**. If a document is a compendium or lacks an unambiguous standard number, `standard_number` is safely stored as `null`.
- **Duplicate Prevention**: Detects existing files by checksum, standard number + version, or file path, avoiding duplicate rows on repeated executions.
- **Status Tracking**: Sets initial `ingestion_status = "pending"`.

---

### D. How to Start FastAPI

From the `backend` directory:

```powershell
uvicorn app.main:app --reload --port 8000
```

---

### E. How to Open Swagger (Interactive API Docs)

Once the backend is running, open:

[http://localhost:8000/docs](http://localhost:8000/docs)

Alternative ReDoc documentation:
[http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### F. Example `POST /api/documents` Request

**Endpoint:** `POST http://localhost:8000/api/documents`  
**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "standard_number": "IS 1460:2017",
  "title": "Automotive Diesel Fuel — Specification",
  "product": "Automotive Diesel",
  "document_type": "Indian Standard",
  "version": "2017",
  "status": "Published",
  "source_url": "https://official-bis-source",
  "file_path": "knowledge_base/raw/IS-1460-2017.pdf"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "document": {
    "id": "5a1c8615-47bb-4042-8843-e35b3c373936",
    "standard_number": "IS 1460:2017",
    "title": "Automotive Diesel Fuel — Specification",
    "product": "Automotive Diesel",
    "document_type": "Indian Standard",
    "version": "2017",
    "status": "Published",
    "source_url": "https://official-bis-source",
    "file_path": "knowledge_base/raw/IS-1460-2017.pdf",
    "file_checksum": null,
    "ingestion_status": "pending",
    "metadata": {},
    "created_at": "2026-09-11T15:52:50.123456+00:00",
    "updated_at": "2026-09-11T15:52:50.123456+00:00"
  },
  "message": "Document catalogued successfully"
}
```

---

### G. Example `GET /api/documents` Response

**Endpoint:** `GET http://localhost:8000/api/documents?limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "documents": [
    {
      "id": "5a1c8615-47bb-4042-8843-e35b3c373936",
      "standard_number": "IS 1460:2017",
      "title": "Automotive Diesel Fuel — Specification",
      "product": "Automotive Diesel",
      "document_type": "Indian Standard",
      "version": "2017",
      "status": "Published",
      "source_url": "https://official-bis-source",
      "file_path": "knowledge_base/raw/IS-1460-2017.pdf",
      "file_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852test1",
      "ingestion_status": "pending",
      "metadata": {},
      "created_at": "2026-09-11T15:52:50.123456+00:00",
      "updated_at": "2026-09-11T15:52:50.123456+00:00"
    },
    {
      "id": "d7e0b8d9-c932-478a-b9b8-c1551bbdc43f",
      "standard_number": null,
      "title": "Indian Standards For Petroleum Products - Compendium",
      "product": "Petroleum Products",
      "document_type": "Indian Standard",
      "version": null,
      "status": "Published",
      "source_url": null,
      "file_path": "knowledge_base/raw/INDIANSTANDARDSFORPETROLEUMPRODUCTS.pdf",
      "file_checksum": "96312bd333435d807ead8ca95e1c0e93fce940d5933f763907b183479835b33f",
      "ingestion_status": "pending",
      "metadata": {},
      "created_at": "2026-09-11T15:52:51.654321+00:00",
      "updated_at": "2026-09-11T15:52:51.654321+00:00"
    }
  ]
}
```

---

## Testing the Catalogue Layer

Run the automated test suite:

```powershell
python test_catalogue.py
```

This verifies:
1. Document creation (`IS 1460:2017`).
2. Document retrieval by UUID.
3. Document listing with pagination.
4. Ingestion status lifecycle transitions (`pending` → `downloaded`).
5. Search by standard number substring (`IS 1460`).
6. Duplicate prevention by checksum and standard code.
7. Handling documents without confirmed standard numbers (`standard_number = null`).
8. Document deletion and cleanup.

---

## Universal Product Coverage (Two-Tier Architecture)

To allow the BIS Assistant to answer queries about **any Indian product** (pressure cookers, gold jewellery, TMT bars, helmets, ceiling fans, mobile batteries, packaged water, cement, etc.):

### 1. Seeding the Master Registry
```powershell
python scripts/seed_standards_registry.py
```
This populates 36+ foundational Indian Standards across all 15 Division Councils (MED, ETD, LITD, FAD, CED, MTD, CHD, PCD, HMD, MHD, TXD) with product names, aliases, and Quality Control Orders (QCO).

### 2. Testing All Products Across Sectors
```powershell
python test_all_products.py
```
Verifies that natural language queries across 7 diverse industries correctly resolve to their respective Indian Standards with 100% accuracy.

