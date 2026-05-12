# 🔬 ForensiAI — AI-Powered Forensic Investigation Platform

> An end-to-end forensic analysis platform combining CrewAI agents, FastAPI, and a modern React/Vite frontend for intelligent evidence correlation, timeline reconstruction, and risk assessment.

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)](https://github.com/Advaith4/ForensiAI-)
[![Backend](https://img.shields.io/badge/backend-FastAPI%200.104-blue)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/frontend-Vite%205%20%2B%20React%2018-purple)](https://vitejs.dev/)
[![AI](https://img.shields.io/badge/AI-CrewAI%20%2B%20Featherless-orange)](https://featherless.ai/)

---

## 📸 Preview

The **ForensiAI Command Center** provides a dark-mode intelligence dashboard with real-time case tracking, AI-driven evidence correlation, timeline reconstruction, and risk scoring.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Featherless AI](https://featherless.ai) API key

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env → add FEATHERLESS_API_KEY
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://127.0.0.1:3000 |
| Backend API | http://127.0.0.1:8000 |
| Swagger Docs | http://127.0.0.1:8000/docs |

---

## 🏗️ Architecture

```
ForensiAI/
├── backend/                        FastAPI + CrewAI backend
│   ├── main.py                     Application entry point
│   ├── config.py                   Environment & settings
│   ├── database.py                 SQLAlchemy setup
│   ├── models.py                   ORM models (6 tables)
│   ├── requirements.txt            Pinned Python dependencies
│   ├── .env.example                Environment variable template
│   ├── start.bat / start.sh        One-click startup scripts
│   │
│   ├── routes/                     API endpoint modules
│   │   ├── cases.py
│   │   ├── upload.py
│   │   ├── analysis.py
│   │   ├── results.py
│   │   ├── timeline.py
│   │   └── reports.py
│   │
│   ├── agents/                     CrewAI AI agents
│   │   ├── autopsy_agent.py        Autopsy report analysis
│   │   ├── correlation_agent.py    Evidence correlation & anomaly detection
│   │   └── summary_agent.py        Final case summary generation
│   │
│   ├── services/                   Deterministic business logic
│   │   ├── parser_service.py       PDF / CSV / JSON evidence parsing
│   │   ├── normalizer_service.py   Data standardization
│   │   ├── tod_service.py          Time-of-death calculation
│   │   ├── timeline_service.py     Event timeline reconstruction
│   │   ├── risk_service.py         8-rule risk scoring engine
│   │   ├── analysis_service.py     Pipeline orchestrator
│   │   └── report_service.py       Report generation
│   │
│   ├── schemas/                    Pydantic request/response schemas
│   ├── utils/                      Logger + helpers
│   └── uploads/                    Evidence file storage
│
├── frontend/                       Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx                 Main application with routing
│   │   ├── main.tsx                React entry point
│   │   ├── index.css               Global styles + design tokens
│   │   ├── components/ui/          Reusable UI components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── progress.tsx
│   │   └── lib/
│   │       ├── api.ts              Typed Axios API client
│   │       ├── types.ts            Shared TypeScript interfaces
│   │       ├── mock-data.ts        Development mock data
│   │       └── utils.ts            Date formatting & helpers
│   ├── vite.config.js              Vite config with API proxy
│   ├── tailwind.config.ts          Tailwind theme
│   └── package.json
│
├── README.md                       This file
├── BUILD_SUMMARY.md                Full feature summary
├── INDEX.md                        Project index
└── QUICK_REFERENCE.md              5-minute cheat sheet
```

---

## 💻 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | FastAPI | 0.104.1 |
| ASGI Server | Uvicorn | 0.24.0 |
| ORM | SQLAlchemy | 2.0.49 |
| Validation | Pydantic | 2.5.0 |
| Database | SQLite | Built-in |
| AI Orchestration | CrewAI | 0.30.11 |
| LLM Routing | LiteLLM | 1.35.0 |
| LLM Provider | Featherless AI | — |
| LLM Model | Qwen/Qwen2.5-7B-Instruct | — |
| PDF Parsing | pdfplumber + pypdf | 0.10.3 / 4.3.1 |
| Data Processing | pandas + numpy | 2.1.3 / 1.26.4 |
| Frontend Build | Vite | 5.4.2 |
| UI Library | React | 18.3.1 |
| Language | TypeScript | 5.5.3 |
| Styling | Tailwind CSS | 3.4.4 |
| Animations | Framer Motion | 11.2.12 |
| HTTP Client | Axios | 1.6.8 |
| Charts | Recharts | 2.12.7 |
| Icons | Lucide React | 0.468.0 |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cases` | Create a new investigation case |
| `GET` | `/cases` | List all cases |
| `GET` | `/cases/{id}` | Get case details |
| `PUT` | `/cases/{id}` | Update case metadata |
| `POST` | `/cases/{id}/upload` | Upload evidence file |
| `GET` | `/cases/{id}/evidence` | List uploaded evidence |
| `POST` | `/cases/{id}/analyze` | Trigger full forensic analysis pipeline |
| `GET` | `/cases/{id}/results` | Poll analysis status & results |
| `GET` | `/cases/{id}/timeline` | Get reconstructed timeline |
| `GET` | `/cases/{id}/report` | Generate & retrieve full case report |

### Example: Create Case
```bash
curl -X POST http://localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"victim_name": "Jane Doe", "incident_location": "456 Oak Ave", "incident_date": "2024-05-09"}'
```

### Example: Upload Evidence
```bash
curl -X POST http://localhost:8000/cases/CASE-abc123/upload \
  -F "file=@autopsy_report.pdf" \
  -F "file_type=autopsy"
```

### Example: Trigger Analysis
```bash
curl -X POST http://localhost:8000/cases/CASE-abc123/analyze \
  -H "Content-Type: application/json" \
  -d '{"body_temperature": 31.5, "ambient_temperature": 22, "rigor_stage": "moderate"}'
```

---

## 🧠 Analysis Pipeline

The platform runs an **8-stage forensic pipeline** when analysis is triggered:

```
1. Parse Evidence        → Extract text from PDF / CSV / JSON
2. Normalize Data        → Standardize timestamps, units, formats
3. Time of Death         → Deterministic Henssge nomogram calculation
4. Timeline Reconstruction → Merge & sort all events chronologically
5. Autopsy Analysis      → CrewAI agent analyses medical findings
6. Evidence Correlation  → CrewAI agent detects anomalies & patterns
7. Risk Assessment       → 8-rule scoring engine (LOW / MEDIUM / HIGH / CRITICAL)
8. Summary Generation    → CrewAI agent produces final investigation report
```

> All AI stages have automatic fallback to deterministic logic if the LLM is unavailable.

---

## ⚙️ Configuration

Create `backend/.env` from `.env.example`:

```env
# Required
FEATHERLESS_API_KEY=your_key_here

# LLM
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct

# Database
DATABASE_URL=sqlite:///./forensiai.db

# Storage
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=50

# App
ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

---

## ⚡ Performance Benchmarks

| Operation | Typical Time |
|-----------|-------------|
| Health Check | < 50ms |
| Create Case | < 200ms |
| Upload Evidence | < 500ms |
| Full Analysis Pipeline | 30–120s (AI inference) |
| Fetch Report | < 300ms |

---

## 🛠️ Troubleshooting

**Port 8000 already in use?**
```bash
# Windows — find and kill the process
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

**Frontend proxy errors?**  
Ensure backend is running before starting `npm run dev`. The Vite proxy forwards `/api` → `http://127.0.0.1:8000`.

**Featherless API failing?**  
Verify `FEATHERLESS_API_KEY` in `.env`. The backend automatically falls back to deterministic mock responses.

**CORS errors?**  
The backend allows `http://localhost:3000` and `http://127.0.0.1:3000` by default. Edit `main.py` `allow_origins` for other URLs.

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Python source files | 31 |
| TypeScript/TSX files | 10+ |
| API endpoints | 10 |
| Database tables | 6 |
| CrewAI agents | 3 |
| Service engines | 7 |
| Pydantic schemas | 4 |
| Total lines of code | 6,000+ |

---

## ✅ Deployment Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed  
- [ ] Featherless API key obtained from https://featherless.ai
- [ ] `backend/.env` configured
- [ ] `pip install -r requirements.txt` succeeded
- [ ] `npm install` succeeded in `frontend/`
- [ ] Backend running → http://127.0.0.1:8000/docs accessible
- [ ] Frontend running → http://127.0.0.1:3000 accessible
- [ ] Can create, upload, analyze, and report on a case

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

*ForensiAI — AI-Powered Forensic Investigation Platform*  
*Backend: FastAPI + CrewAI | Frontend: Vite + React + TypeScript*
