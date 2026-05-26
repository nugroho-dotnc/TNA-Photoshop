"""
routers/ml_recognition.py
─────────────────────────────────────────────────────────────────────────────
ML object recognition endpoint:
  POST /ml/{session_id}/recognize
"""

from fastapi import APIRouter, HTTPException

from services import session_service as ss
from services import ml_service

router = APIRouter()


@router.post("/ml/{session_id}/recognize")
def recognize(session_id: str):
    """Run CNN inference on the current session image."""
    try:
        img = ss.read_current(session_id)
        result = ml_service.predict(img)
        return {"success": True, **result}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
