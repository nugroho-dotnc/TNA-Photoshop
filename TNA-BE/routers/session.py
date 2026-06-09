"""
routers/session.py
─────────────────────────────────────────────────────────────────────────────
Session management endpoints:
  POST   /session/upload
  POST   /session/{session_id}/reset
  POST   /session/{session_id}/undo
  POST   /session/{session_id}/redo
  POST   /session/{session_id}/jump
  GET    /session/{session_id}/history
  DELETE /session/{session_id}
  GET    /sessions/{session_id}/current   (file serve)
  GET    /sessions/{session_id}/original  (file serve)
"""

from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import ALLOWED_EXTENSIONS
from services import session_service as ss
from services.image_utils import ensure_bgr, write_image

router = APIRouter()


# ─── Shared helpers ───────────────────────────────────────────────────────────

def _std(session_id: str, step: int, message: str = "OK") -> dict:
    """Membentuk response standar untuk pelacakan session dan status citra."""
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "original_url": f"/sessions/{session_id}/original",
        "step": step,
        "message": message,
    }


def _err(error: str, code: str, status: int):
    """Menaikkan HTTPException dengan format error terstruktur untuk API citra."""
    raise HTTPException(
        status_code=status,
        detail={"success": False, "error": error, "code": code},
    )


# ─── Upload ───────────────────────────────────────────────────────────────────

@router.post("/session/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Menerima citra masukan, melakukan decoding, dan membuat session pengolahan citra.
    Citra dinormalisasi ke format BGR tiga kanal sebagai representasi awal untuk semua operasi.
    
    PENJELASAN ARSITEKTUR: STATELESS API
    Backend tidak menyimpan gambar di RAM memory. Semua disimpan di hardisk (Folder Temp OS)
    menggunakan nama unik dari session_id. Ini mencegah server kehabisan RAM.
    """
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        _err(
            f"File type .{ext} is not supported. Use JPG, PNG, or BMP.",
            "INVALID_PARAM",
            400,
        )

    try:
        content = await file.read()
        if not content:
            _err("Uploaded file is empty.", "INVALID_PARAM", 400)

        buffer = np.frombuffer(content, dtype=np.uint8)
        img = cv2.imdecode(buffer, cv2.IMREAD_UNCHANGED)
        if img is None:
            _err("Uploaded file is not a valid image.", "INVALID_PARAM", 400)

        if len(img.shape) == 3 and img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        else:
            img = ensure_bgr(img)

        session_id = ss.create_session()

        for dest in [ss.original_path(session_id), ss.current_path(session_id)]:
            write_image(img, dest)

        return _std(session_id, 0, "Session created and image uploaded.")
    except HTTPException:
        raise
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Reset ────────────────────────────────────────────────────────────────────

@router.post("/session/{session_id}/reset")
def reset_session(session_id: str):
    """Mengembalikan citra kerja ke citra original sebagai kondisi awal eksperimen."""
    try:
        step = ss.reset_session(session_id)
        return _std(session_id, step, "Session reset to original.")
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Undo ─────────────────────────────────────────────────────────────────────

@router.post("/session/{session_id}/undo")
def undo(session_id: str):
    """Mengembalikan citra ke tahap pengolahan sebelumnya untuk evaluasi hasil."""
    try:
        step = ss.undo_step(session_id)
        return _std(session_id, step, "Undo successful.")
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except ValueError as exc:
        _err(str(exc), "INVALID_PARAM", 400)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Redo ─────────────────────────────────────────────────────────────────────

@router.post("/session/{session_id}/redo")
def redo(session_id: str):
    """Menerapkan kembali tahap pengolahan yang dibatalkan oleh operasi undo."""
    try:
        step = ss.redo_step(session_id)
        return _std(session_id, step, "Redo successful.")
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except ValueError as exc:
        _err(str(exc), "INVALID_PARAM", 400)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Jump ─────────────────────────────────────────────────────────────────────

class JumpBody(BaseModel):
    step: int


@router.post("/session/{session_id}/jump")
def jump(session_id: str, body: JumpBody):
    """Memilih tahap pengolahan tertentu untuk membandingkan kondisi citra antar-step."""
    try:
        step = ss.jump_to_step(session_id, body.step)
        return _std(session_id, step, f"Jumped to step {step}.")
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except ValueError as exc:
        _err(str(exc), "INVALID_PARAM", 400)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── History ──────────────────────────────────────────────────────────────────

@router.get("/session/{session_id}/history")
def history(session_id: str):
    """Mengembalikan metadata urutan operasi pengolahan citra beserta parameternya."""
    try:
        return ss.get_history(session_id)
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Delete Session ───────────────────────────────────────────────────────────

@router.delete("/session/{session_id}")
def delete_session(session_id: str):
    """Menghapus seluruh artefak citra dan metadata dari session pengolahan."""
    try:
        ss.assert_session(session_id)
        ss.delete_session(session_id)
        return {"success": True, "message": "Session deleted"}
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Serve Current Image ──────────────────────────────────────────────────────

@router.get("/sessions/{session_id}/current")
def serve_current(session_id: str):
    """Menyajikan citra hasil pengolahan terbaru dari session."""
    path = ss.current_path(session_id)
    if not Path(path).exists():
        _err(
            f"Session {session_id} not found. Please upload an image first.",
            "SESSION_NOT_FOUND",
            404,
        )
    return FileResponse(path, media_type="image/jpeg")


# ─── Serve Original Image ─────────────────────────────────────────────────────

@router.get("/sessions/{session_id}/original")
def serve_original(session_id: str):
    """Menyajikan citra original sebagai referensi sebelum pengolahan."""
    path = ss.original_path(session_id)
    if not Path(path).exists():
        _err(
            f"Session {session_id} not found. Please upload an image first.",
            "SESSION_NOT_FOUND",
            404,
        )
    return FileResponse(path, media_type="image/jpeg")
