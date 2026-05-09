from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from config import settings
from firebase_config import get_firebase_app
from utils.logger import log_info

# Import routes
from routes import cases, upload, analysis, results, timeline, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and clean up application resources."""
    log_info("=" * 60)
    log_info("ForensiAI Backend Starting...")
    log_info("=" * 60)
    
    # Initialize Firebase Admin SDK for the existing configured project.
    get_firebase_app()
    
    # Create upload directory
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    log_info(f"[OK] Environment: {settings.env}")
    log_info("[OK] Firebase Admin SDK initialized")
    log_info("[OK] Firestore collections: users, cases, evidence, analysis_results, timeline_events, reports, risk_reports")
    log_info(f"[OK] Upload Dir: {settings.upload_dir}")
    log_info(f"[OK] Frontend: {settings.frontend_url}")
    log_info(f"[OK] Model: {settings.model_name}")
    log_info("=" * 60)
    log_info("[OK] Backend ready!")
    log_info("[OK] API Docs: http://localhost:8000/docs")
    log_info("=" * 60)

    yield

    log_info("ForensiAI Backend Shutting Down...")


# Initialize FastAPI app
app = FastAPI(
    title="ForensiAI",
    description="AI-Powered Forensic Investigation Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware - allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports.router)
app.include_router(cases.router)
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(results.router)
app.include_router(timeline.router)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
