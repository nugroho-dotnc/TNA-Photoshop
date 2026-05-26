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

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import ALLOWED_EXTENSIONS
from services import session_service as ss

router = APIRouter()


# ─── Shared helpers ───────────────────────────────────────────────────────────

def _std(session_id: str, step: int, message: str = "OK") -> dict:
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "original_url": f"/sessions/{session_id}/original",
        "step": step,
        "message": message,
    }


def _err(error: str, code: str, status: int):
    raise HTTPException(
        status_code=status,
        detail={"success": False, "error": error, "code": code},
    )


# ─── Upload ───────────────────────────────────────────────────────────────────

@router.post("/session/upload")
async def upload_image(file: UploadFile = File(...)):
    """Create a new session and upload the initial image."""
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        _err(
            f"File type .{ext} is not supported. Use JPG, PNG, or BMP.",
            "INVALID_PARAM",
            400,
        )

    try:
        session_id = ss.create_session()

        content = await file.read()
        for dest in [ss.original_path(session_id), ss.current_path(session_id)]:
            Path(dest).write_bytes(content)

        return _std(session_id, 0, "Session created and image uploaded.")
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Reset ────────────────────────────────────────────────────────────────────

@router.post("/session/{session_id}/reset")
def reset_session(session_id: str):
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
    """Jump directly to a specific history step (0 = original)."""
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
    """Return full history metadata for the Layer panel."""
    try:
        return ss.get_history(session_id)
    except FileNotFoundError as exc:
        _err(str(exc), "SESSION_NOT_FOUND", 404)
    except Exception as exc:
        _err(f"Image processing failed: {exc}", "PROCESSING_FAILED", 500)


# ─── Delete Session ───────────────────────────────────────────────────────────

@router.delete("/session/{session_id}")
def delete_session(session_id: str):
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
    path = ss.original_path(session_id)
    if not Path(path).exists():
        _err(
            f"Session {session_id} not found. Please upload an image first.",
            "SESSION_NOT_FOUND",
            404,
        )
    return FileResponse(path, media_type="image/jpeg")
