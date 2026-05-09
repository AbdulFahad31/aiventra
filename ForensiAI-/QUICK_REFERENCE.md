# FORENSIAI QUICK REFERENCE CARD

## 🎯 3-MINUTE SETUP

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env

# 5. Edit .env (add your Featherless API key)
# FEATHERLESS_API_KEY=your_key_here

# 6. Start backend
python main.py
```

## 📍 ACCESS POINTS

| URL | Purpose |
|-----|---------|
| http://localhost:8000 | Backend root |
| http://localhost:8000/docs | Interactive API docs (Swagger) |
| http://localhost:8000/health | Health check |
| http://localhost:3000 | Frontend (Next.js) |

## 📡 KEY ENDPOINTS

### Cases
```
POST   /cases                      Create case
GET    /cases                      List cases
GET    /cases/{case_id}            Get case
PUT    /cases/{case_id}            Update case
```

### Evidence
```
POST   /cases/{case_id}/upload     Upload file
GET    /cases/{case_id}/evidence   List evidence
```

### Analysis
```
POST   /cases/{case_id}/analyze    Start analysis
GET    /cases/{case_id}/results    Check status
```

### Results
```
GET    /cases/{case_id}/timeline   Get timeline
GET    /cases/{case_id}/report     Get report
```

## 📝 QUICK TEST WITH CURL

### Health Check
```bash
curl http://localhost:8000/health
```

### Create Case
```bash
curl -X POST http://localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{
    "victim_name":"Jane Doe",
    "incident_location":"456 Oak Ave",
    "incident_date":"2024-05-09"
  }'
```

### Upload Evidence
```bash
curl -X POST http://localhost:8000/cases/CASE-abc123/upload \
  -F "file=@autopsy.pdf" \
  -F "file_type=autopsy"
```

### Start Analysis
```bash
curl -X POST http://localhost:8000/cases/CASE-abc123/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "body_temperature": 31.5,
    "ambient_temperature": 22,
    "rigor_stage": "moderate"
  }'
```

### Get Results
```bash
curl http://localhost:8000/cases/CASE-abc123/results
```

### Get Report
```bash
curl http://localhost:8000/cases/CASE-abc123/report
```

## 🔧 ENVIRONMENT VARIABLES

```
# REQUIRED - Get from https://featherless.ai
FEATHERLESS_API_KEY=your_api_key_here

# Optional - Defaults provided
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct
DATABASE_URL=sqlite:///./forensiai.db
SQL_ECHO=false
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=50
ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

## 📊 FILE TYPES

When uploading evidence, use these types:
- **autopsy** - Autopsy reports
- **cctv** - CCTV/video data
- **gps** - GPS tracking
- **metadata** - Mobile/device metadata
- **image** - Photos/images

## ⚠️ TROUBLESHOOTING

### Port 8000 in use?
```bash
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
# Kill the process or use different port:
uvicorn main:app --port 8001
```

### Missing modules?
```bash
pip install -r requirements.txt
```

### Database issues?
```bash
rm forensiai.db
python main.py
```

### Featherless API not working?
- Verify key in .env
- Check API at https://featherless.ai
- Backend has fallback mode - service will still work

## 🚀 STARTUP SCRIPTS

### Windows
```bash
cd backend
start.bat
```

### macOS/Linux
```bash
cd backend
chmod +x start.sh
./start.sh
```

## 💻 FRONTEND CONNECTION

### Add to .env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Example fetch call
```javascript
const response = await fetch('http://localhost:8000/cases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    victim_name: 'John Doe',
    incident_location: '123 Main St',
    incident_date: '2024-05-09'
  })
});
const newCase = await response.json();
console.log(newCase.case_id);
```

## 📚 DOCUMENTATION

| File | Purpose |
|------|---------|
| README.md | Complete backend documentation |
| SETUP.md | Detailed setup instructions |
| FRONTEND_INTEGRATION.md | Frontend integration guide |
| BUILD_SUMMARY.md | Project summary & features |

## ✅ VERIFICATION CHECKLIST

- [ ] Python 3.8+ installed
- [ ] Virtual environment created & activated
- [ ] Dependencies installed (`pip list | grep fastapi`)
- [ ] .env file created with API key
- [ ] Backend running (no errors on startup)
- [ ] Health check passes (curl /health)
- [ ] API docs accessible (http://localhost:8000/docs)
- [ ] Can create case via API
- [ ] Frontend can reach backend

## 🎯 TYPICAL WORKFLOW

```
1. Create case (POST /cases)
   ↓ Get case_id
   
2. Upload autopsy (POST /upload)
   ↓ Evidence stored
   
3. Upload other evidence (CCTV, GPS, etc.)
   ↓ Multiple uploads OK
   
4. Start analysis (POST /analyze)
   ↓ Pipeline begins
   
5. Poll results (GET /results)
   ↓ Wait for completion
   
6. Get report (GET /report)
   ↓ Full investigation results
```

## 📞 QUICK SUPPORT

**Full documentation**: See backend/README.md, SETUP.md, FRONTEND_INTEGRATION.md

**API reference**: http://localhost:8000/docs (Swagger UI)

**Health check**: `curl http://localhost:8000/health`

---

**You're ready! Start the backend and connect your frontend!** 🚀
