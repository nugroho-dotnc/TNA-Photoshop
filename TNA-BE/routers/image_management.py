"""
routers/image_management.py
─────────────────────────────────────────────────────────────────────────────
POST /image/{session_id}/save  — Export current image as a downloadable file.
Input: { "filename": str, "format": "jpg" | "png" | "bmp", "quality": int }
"""

from pathlib import Path
from typing import Optional

import cv2
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator

from services import session_service as ss

router = APIRouter()


def _err(error: str, code: str, status: int):
    raise HTTPException(
        status_code=status,
        detail={"success": False, "error": error, "code": code},
    )


class SaveRequest(BaseModel):
    filename: str
    format: str   # "jpg" | "png" | "bmp"
    quality: Optional[int] = 95  # 1–100

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str) -> str:
        allowed = {"jpg", "jpeg", "png", "bmp"}
        if v.lower() not in allowed:
            raise ValueError(f"Format must be one of {allowed}")
        return v.lower()

    @field_validator("quality")
    @classmethod
    def validate_quality(cls, v: Optional[int]) -> int:
        v = v or 95
        if not 1 <= v <= 100:
            raise ValueError("quality must be between 1 and 100.")
        return v


@router.post("/image/{session_id}/save")
def save_image(session_id: str, body: SaveRequest):
    """Export the current image as a downloadable file."""
    try:
        img = ss.read_current(session_id)

        ext = "jpg" if body.format == "jpeg" else body.format
        safe_name = Path(body.filename).stem
        export_path = ss.session_dir(session_id) / f"{safe_name}.{ext}"

        params: list = []
        if ext in ("jpg", "jpeg"):
            params = [cv2.IMWRITE_JPEG_QUALITY, body.quality]
        elif ext == "png":
            # Map quality 1–100 → PNG compression 9–0
            png_compression = max(0, min(9, int((100 - body.quality) / 11)))
            params = [cv2.IMWRITE_PNG_COMPRESSION, png_compression]

        cv2.imwrite(str(export_path), img, params)

        media_types = {
            "jpg": "image/jpeg",
            "png": "image/png",
            "bmp": "image/bmp",
        }

        return FileResponse(
            str(export_path),
            media_type=media_types.get(ext, "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}.{ext}"'
            },
        )
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)
