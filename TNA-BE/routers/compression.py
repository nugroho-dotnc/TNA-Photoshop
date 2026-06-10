"""
routers/compression.py
─────────────────────────────────────────────────────────────────────────────
Image compression endpoints:
  POST /compression/{session_id}/save-quality
  POST /compression/{session_id}/simulate-jpeg
"""

import io

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Literal

from services import session_service as ss

router = APIRouter()


def _std(session_id: str, step: int, msg: str = "Operation applied successfully.", **extra) -> dict:
    """Membentuk response standar setelah operasi kompresi citra."""
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "step": step,
        "message": msg,
        **extra,
    }


# ─── Save Quality ─────────────────────────────────────────────────────────────

class SaveQualityBody(BaseModel):
    quality: int   # 1–100
    format: Literal["jpeg", "png"] = "jpeg"

    @field_validator("quality")
    @classmethod
    def validate_quality(cls, v: int) -> int:
        """Memvalidasi parameter kualitas yang memengaruhi rasio kompresi citra."""
        if not 1 <= v <= 100:
            raise ValueError("quality must be between 1 and 100.")
        return v


@router.post("/compression/{session_id}/save-quality")
def save_quality(session_id: str, body: SaveQualityBody):
    """
    Menyimulasikan penyimpanan citra dengan kualitas kompresi tertentu.
    Ukuran file sebelum dan sesudah kompresi dihitung untuk menganalisis rasio kompresi.
    """
    try:
        img = ss.read_current(session_id)

        _, original_buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 100])
        original_size_kb = round(len(original_buf) / 1024, 2)

        if body.format == "jpeg":
            encode_param = [cv2.IMWRITE_JPEG_QUALITY, body.quality]
            ext = ".jpg"
        else:  # png
            # PNG compression: 0 (none) to 9 (max) — map quality 1–100 to 9–0
            png_compression = max(0, min(9, int((100 - body.quality) / 11)))
            encode_param = [cv2.IMWRITE_PNG_COMPRESSION, png_compression]
            ext = ".png"

        _, compressed_buf = cv2.imencode(ext, img, encode_param)
        compressed_size_kb = round(len(compressed_buf) / 1024, 2)
        ratio = round(original_size_kb / compressed_size_kb, 2) if compressed_size_kb > 0 else 0

        # Write re-decoded image as new step
        decoded = cv2.imdecode(compressed_buf, cv2.IMREAD_COLOR)
        step = ss.save_step(
            session_id,
            decoded,
            "Save Quality",
            {"quality": body.quality, "format": body.format},
        )

        return _std(
            session_id,
            step,
            f"Saved with quality={body.quality} ({body.format}).",
            original_size_kb=original_size_kb,
            compressed_size_kb=compressed_size_kb,
            ratio=ratio,
            method=body.format.upper(),
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Simulate JPEG Compression ────────────────────────────────────────────────

class SimulateJpegBody(BaseModel):
    quality: int  # 1–100

    @field_validator("quality")
    @classmethod
    def validate_quality(cls, v: int) -> int:
        """Memvalidasi parameter kualitas JPEG untuk simulasi artefak kompresi."""
        if not 1 <= v <= 100:
            raise ValueError("quality must be between 1 and 100.")
        return v


@router.post("/compression/{session_id}/simulate-jpeg")
def simulate_jpeg(session_id: str, body: SimulateJpegBody):
    """
    Mensimulasikan artefak kompresi JPEG melalui proses encode-decode.
    Proses ini memperlihatkan dampak penurunan kualitas terhadap detail visual citra.
    """
    try:
        img = ss.read_current(session_id)

        # Original size at 100% quality
        _, orig_buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 100])
        original_size_kb = round(len(orig_buf) / 1024, 2)

        # Compressed via requested quality
        _, comp_buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, body.quality])
        compressed_size_kb = round(len(comp_buf) / 1024, 2)
        ratio = round(original_size_kb / compressed_size_kb, 2) if compressed_size_kb > 0 else 0

        # Decode compressed image back to show artifacts
        decoded = cv2.imdecode(comp_buf, cv2.IMREAD_COLOR)
        step = ss.save_step(
            session_id,
            decoded,
            "Simulate JPEG",
            {"quality": body.quality},
        )

        return _std(
            session_id,
            step,
            f"JPEG simulation at quality={body.quality} applied.",
            original_size_kb=original_size_kb,
            compressed_size_kb=compressed_size_kb,
            ratio=ratio,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# ─── Demo Algoritma Kompresi ───────────────────────────────────────────────────

from services.compression_demo import run_rle, run_huffman, run_lzw, run_arithmetic, run_quantization

class DemoAlgorithmBody(BaseModel):
    algorithm: Literal["rle", "huffman", "lzw", "arithmetic", "quantization"]
    levels: int = 16  # Only used for quantization

@router.post("/compression/{session_id}/demo-algorithm")
def demo_algorithm(session_id: str, body: DemoAlgorithmBody):
    """
    Menjalankan algoritma kompresi sejati untuk tujuan demonstrasi.
    """
    try:
        img = ss.read_current(session_id)
        
        if body.algorithm == "quantization":
            # Quantization changes the image
            quantized = run_quantization(img, body.levels)
            step = ss.save_step(
                session_id,
                quantized,
                "Quantization Demo",
                {"levels": body.levels}
            )
            return _std(
                session_id,
                step,
                f"Quantization applied with {body.levels} levels.",
                algorithm="Quantization",
                levels=body.levels
            )
            
        # For lossless algorithms, they do not alter the image, they return metrics
        if body.algorithm == "rle":
            metrics = run_rle(img)
        elif body.algorithm == "huffman":
            metrics = run_huffman(img)
        elif body.algorithm == "lzw":
            metrics = run_lzw(img)
        elif body.algorithm == "arithmetic":
            metrics = run_arithmetic(img)
            
        return {
            "success": True,
            "session_id": session_id,
            "message": f"Simulated {metrics['algorithm']} compression.",
            "metrics": metrics
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
