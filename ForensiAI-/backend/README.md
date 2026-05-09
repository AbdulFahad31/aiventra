# ForensiAI Backend

Complete AI-powered forensic investigation platform backend. Ready for 24-hour hackathon deployment.

## ⚡ Quick Start

### 1. Setup Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Featherless AI

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Featherless API key:
FEATHERLESS_API_KEY=your_api_key_here
```

**Where to get API key:**
- Visit: https://featherless.ai
- Sign up / Login
- Get API key from dashboard
- Paste into .env

### 3. Run Backend

```bash
python main.py
```

Backend will start at: **http://localhost:8000**

### 4. Access API Documentation

Open in browser: **http://localhost:8000/docs**

## 📋 Project Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration management
├── database.py            # SQLAlchemy setup
├── models.py              # Database models
├── requirements.txt       # Python dependencies
│
├── routes/
│   ├── cases.py           # Case CRUD endpoints
│   ├── upload.py          # Evidence file upload
│   ├── analysis.py        # Trigger forensic analysis
│   ├── results.py         # Fetch analysis results
│   ├── timeline.py        # Timeline reconstruction
│   └── reports.py         # Health check & root
│
├── agents/
│   ├── autopsy_agent.py   # Autopsy analysis (CrewAI)
│   ├── correlation_agent.py # Evidence correlation
│   └── summary_agent.py   # Investigation summary
│
├── services/
│   ├── pdf_parser.py      # PDF extraction
│   ├── csv_parser.py      # CSV/metadata parsing
│   ├── timeline_engine.py # Timeline reconstruction (deterministic)
│   ├── tod_calculator.py  # Time of death (deterministic)
│   ├── risk_engine.py     # Risk assessment (deterministic)
│   └── report_generator.py # Report generation
│
├── schemas/
│   ├── case_schema.py     # Case schemas
│   ├── evidence_schema.py # Evidence schemas
│   ├── result_schema.py   # Result schemas
│   └── tod_schema.py      # TOD schemas
│
└── utils/
    ├── logger.py          # Logging setup
    └── helpers.py         # Utility functions
```

## 🚀 API Endpoints

### Cases Management

```bash
# Create new case
POST /cases
{
  "victim_name": "John Doe",
  "incident_location": "123 Main St",
  "incident_date": "2024-05-09",
  "notes": "Optional notes"
}

# List all cases
GET /cases

# Get case details
GET /cases/{case_id}

# Update case notes
PUT /cases/{case_id}
```

### Evidence Upload

```bash
# Upload evidence file
POST /cases/{case_id}/upload
  - file: (multipart/form-data)
  - file_type: autopsy | cctv | gps | metadata | image

# List evidence for case
GET /cases/{case_id}/evidence
```

### Analysis Pipeline

```bash
# Start forensic analysis
POST /cases/{case_id}/analyze
{
  "body_temperature": 31.2,
  "ambient_temperature": 24,
  "rigor_stage": "moderate"
}

# Poll for results
GET /cases/{case_id}/results
```

### Results & Reports

```bash
# Get reconstructed timeline
GET /cases/{case_id}/timeline

# Generate final report
GET /cases/{case_id}/report
```

## 🔄 Analysis Pipeline

ForensiAI executes a deterministic + AI-driven forensic analysis pipeline:

1. **Parse Evidence** - Extract data from PDF/CSV/metadata files
2. **Normalize Data** - Standardize timestamps and formats
3. **Time of Death Engine** - Calculate using algor/rigor mortis (deterministic)
4. **Timeline Reconstruction** - Sort, merge, deduplicate events (deterministic)
5. **Autopsy Agent** - Analyze autopsy report (CrewAI + Qwen2.5)
6. **Correlation Agent** - Identify suspicious patterns (CrewAI + Qwen2.5)
7. **Risk Engine** - Assess investigation risk level (deterministic)
8. **Summary Agent** - Generate executive summary (CrewAI + Qwen2.5)

All results are stored in SQLite database for retrieval.

## 📊 Database

**SQLite database:** `forensiai.db` (auto-created)

### Tables

- **cases** - Investigation cases
- **evidence** - Uploaded evidence files
- **timeline_events** - Reconstructed timeline events
- **ai_results** - AI agent analysis results
- **risk_flags** - Risk assessment flags

## 🎯 Key Features

✅ **Fast Implementation** - Minimal dependencies, ready for demo
✅ **Local Deployment** - SQLite, no external services
✅ **Reliable Fallbacks** - Works without Featherless (mock mode)
✅ **Deterministic Logic** - Non-AI for critical functions
✅ **CrewAI Integration** - 3 specialized agents
✅ **Realistic Outputs** - Structured JSON, forensic-accurate
✅ **Frontend Compatible** - CORS enabled, API docs ready
✅ **Clean Architecture** - Separated concerns, maintainable code

## 🧪 Testing

### Test with cURL

```bash
# Health check
curl http://localhost:8000/health

# Create case
curl -X POST http://localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"victim_name":"Test","incident_location":"Test","incident_date":"2024-05-09"}'

# Upload sample file
curl -X POST http://localhost:8000/cases/CASE-abc123/upload \
  -F "file=@sample.pdf" \
  -F "file_type=autopsy"
```

### Test with Python Requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Create case
case = requests.post(f"{BASE_URL}/cases", json={
    "victim_name": "Jane Doe",
    "incident_location": "456 Oak Ave",
    "incident_date": "2024-05-09"
}).json()

case_id = case["case_id"]
print(f"Created case: {case_id}")

# Upload evidence
with open("autopsy_report.pdf", "rb") as f:
    files = {"file": f}
    data = {"file_type": "autopsy"}
    requests.post(f"{BASE_URL}/cases/{case_id}/upload", files=files, data=data)

print("Evidence uploaded")

# Start analysis
requests.post(f"{BASE_URL}/cases/{case_id}/analyze", json={
    "body_temperature": 31.5,
    "ambient_temperature": 22,
    "rigor_stage": "moderate"
})

print("Analysis started - check /results endpoint")
```

## ⚙️ Configuration

### Environment Variables (.env)

```
# Featherless AI
FEATHERLESS_API_KEY=your_api_key_here
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct

# Database
DATABASE_URL=sqlite:///./forensiai.db
SQL_ECHO=false

# Upload
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=50

# App
ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Use different port
uvicorn main:app --port 8001
```

### ImportError: No module named 'crewai'
```bash
# Install missing dependency
pip install crewai litellm
```

### Featherless API fails
- Backend automatically falls back to deterministic/mock responses
- All outputs remain consistent and forensic-accurate
- No service interruption

### Database locked
```bash
# Delete old database
rm forensiai.db

# Restart backend
python main.py
```

## 📈 Performance Notes

- **Timeline reconstruction:** O(n log n) - optimized for large datasets
- **Risk assessment:** 8 configurable rules, extensible
- **PDF parsing:** Supports large documents with memory efficiency
- **Concurrent uploads:** FastAPI handles parallel requests
- **Database:** SQLite suitable for local deployment + small datasets

## 🚢 Production Deployment

For production:

1. Use PostgreSQL instead of SQLite
2. Add authentication (JWT)
3. Use environment-based configuration
4. Implement request rate limiting
5. Add comprehensive logging
6. Deploy with Gunicorn/Uvicorn

```bash
# Production startup
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## 📝 License

ForensiAI Backend - MIT License

## 🤝 Support

For integration with Next.js frontend:
- API runs on http://localhost:8000
- CORS enabled for localhost:3000
- All responses are JSON
- Real-time status polling via GET /results
- Full API documentation at http://localhost:8000/docs

---

**Ready for hackathon! 🚀**
