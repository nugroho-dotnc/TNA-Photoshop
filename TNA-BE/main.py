"""
main.py
─────────────────────────────────────────────────────────────────────────────
FastAPI application entry point for Mini Photoshop Backend API.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

API docs:
    http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import SESSION_DIR
from services import ml_service

# ─── Routers ──────────────────────────────────────────────────────────────────
from routers import (
    session,
    image_management,
    enhancement,
    geometric,
    restoration,
    binary_edge,
    color_processing,
    segmentation,
    compression,
    histogram,
    ml_recognition,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Menyiapkan resource aplikasi saat startup dan menjalankan teardown saat shutdown."""
    # Startup ──────────────────────────────────────────────────────────────────
    Path(SESSION_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("Session directory ready: %s", SESSION_DIR)
    ml_service.load_model()   # load CNN once at startup
    yield
    # Shutdown (nothing to clean up automatically)


# ─── Application ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Mini Photoshop API",
    description=(
        "RESTful backend for Mini Photoshop — a digital image processing "
        "application built for the Pengolahan Citra Digital course."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Untuk development: allow_origins=["*"] aman selama tidak ada credentials (cookie/auth)
# Untuk production: ganti dengan domain spesifik, e.g. ["https://yourdomain.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ─────────────────────────────────────────────────────────

app.include_router(session.router,          tags=["Session"])
app.include_router(image_management.router, tags=["Image Management"])
app.include_router(enhancement.router,      tags=["Enhancement"])
app.include_router(geometric.router,        tags=["Geometric"])
app.include_router(restoration.router,      tags=["Restoration"])
app.include_router(binary_edge.router,      tags=["Binary & Edge"])
app.include_router(color_processing.router, tags=["Color Processing"])
app.include_router(segmentation.router,     tags=["Segmentation"])
app.include_router(compression.router,      tags=["Compression"])
app.include_router(histogram.router,        tags=["Histogram"])
app.include_router(ml_recognition.router,   tags=["ML Recognition"])


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Mengembalikan status kesehatan dasar API."""
    return {"status": "ok", "message": "Mini Photoshop API is running."}
