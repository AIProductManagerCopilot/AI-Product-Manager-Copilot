# 🚀 AI Product Manager Copilot (AIPM Copilot)

> An AI-powered Product Management Copilot featuring feedback ETL ingestion, automated PRD generation, real-time strategy summaries, and RAG-grounded vector search—designed specifically for a streamlined single Product Manager workflow.

---

## 🌐 Live Deployment & Demo Links

* **Live Web Application (Frontend):** [https://ai-product-manager-copilot.vercel.app](https://ai-product-manager-copilot.vercel.app)
* **API Documentation (Swagger UI):** [https://aipm-copilot-backend.onrender.com/docs](https://aipm-copilot-backend.onrender.com/docs)
* **Backend Health Check:** [https://aipm-copilot-backend.onrender.com/health](https://aipm-copilot-backend.onrender.com/health)

---

## 🏗️ System Architecture & Data Flow

```text
                  Single Product Manager
                            │
                            ▼
               React 18 + Vite + Tailwind UI
                            │
                            ▼
        FastAPI Application Backend (Port 8000)
                            │
     ┌──────────────────────┼──────────────────────┐
     ▼                      ▼                      ▼
PostgreSQL 15            Redis 7                Qdrant DB
(Metadata & Tasks)   (Broker & Cache)        (Vector Mesh)
Port 5433               Port 6379              Port 6333
     │                      │                      │
     └──────────────────────┼──────────────────────┘
                            │
                            ▼
              Google Gemini 3.6 Flash Engine
               (768-dim gemini-embedding-001)
                            │
                            ▼
               Real-time SSE Token Stream
       (/api/v1/copilot/stream & /generate-prd)

```

---

## 🛠️ System Overview & Architecture Steps

1. **Feedback Ingestion & Vectorization**: Customer reviews, support tickets, and product context are processed and converted into 768-dimensional dense vector embeddings using Google GenAI (`gemini-embedding-001`).
2. **Qdrant Vector Mesh**: Embedded vectors and structured payloads (`category`, `sentiment`, `priority_score`) are indexed in Qdrant (`feedback_clusters`) for semantic similarity search.
3. **Analytics Integration**: Pre-computed analytics summaries enrich RAG system prompts with high-level KPI trends.
4. **AI Copilot & PRD Token Streaming**: Google Gemini (`gemini-3.6-flash`) streams markdown responses in real-time over Server-Sent Events (SSE) directly to the frontend interface.

---

## ✨ Key Features

* **Real-Time AI Copilot Streaming**: Server-Sent Events (SSE) stream AI responses with minimal latency.
* **RAG-Grounded PRD Generator**: Generates structured Markdown Product Requirement Documents backed by Qdrant vector feedback evidence.
* **Strategic Theme Intelligence**: Summarizes feedback cluster topics to output strategic memos and churn risk assessments.
* **Unified PM Workspace**: Built for a single Product Manager workflow without complex RBAC overhead.

---

## 🛠️ Tech Stack

* **AI & RAG Subsystem**: Google Gemini 3.6 Flash (`google-genai` SDK), Qdrant Vector DB (768-dim embeddings)
* **Backend Infrastructure**: FastAPI, Async SQLAlchemy, Neon PostgreSQL (`asyncpg`), Redis 7, Structlog
* **Frontend App**: React 18, Vite 6, TypeScript, Tailwind CSS 3, Framer Motion
* **Hosting & Cloud**: Vercel (Frontend SPA & Edge Proxy), Render (Backend FastAPI Service), Firebase (Auth & Firestore)

---

## 🚀 Getting Started

### 1. Boot Core Infrastructure Services

Launch PostgreSQL, Redis, and Qdrant in detached mode using Docker Compose:

```bash
cd backend
docker-compose up -d

```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
GEMINI_API_KEY=your_gemini_api_key
POSTGRES_USER=aipm_admin
POSTGRES_PASSWORD=aipm_secure_password123
POSTGRES_DB=aipm_metadata
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
QDRANT_HOST=localhost
QDRANT_PORT=6333
REDIS_HOST=localhost
REDIS_PORT=6379

```

### 3. Initialize Database & Start Backend Server

```bash
# Apply migrations & seed feedback records
alembic upgrade head
python -m app.seed.seed_database

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000

```

### 4. Launch Frontend Interface

In a separate terminal, navigate to the `frontend/` directory and run:

```bash
cd frontend
npm install
npm run dev

```

---

## 🧪 Verification & Testing Commands

To verify that the AI streaming engine and vector search are running cleanly:

```bash
# Check Qdrant collection status
curl -s http://localhost:6333/collections/feedback_clusters

# Test AI Copilot SSE Stream
curl -X POST "http://127.0.0.1:8000/api/v1/copilot/stream" \
     -H "Content-Type: application/json" \
     -d '{"query": "Summarize top user onboarding feedback"}'

```