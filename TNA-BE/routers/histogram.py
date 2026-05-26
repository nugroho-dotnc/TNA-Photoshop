"""
routers/histogram.py
─────────────────────────────────────────────────────────────────────────────
Histogram analysis endpoints:
  GET /histogram/{session_id}/current
  GET /histogram/{session_id}/compare
"""

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException

from services import session_service as ss
from services.image_utils import read_image

router = APIRouter()


def _calc_histograms(img: np.ndarray) -> dict:
    """Return grayscale + RGB histogram arrays (256 values each)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    grayscale = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().astype(int).tolist()

    red   = cv2.calcHist([img], [2], None, [256], [0, 256]).flatten().astype(int).tolist()
    green = cv2.calcHist([img], [1], None, [256], [0, 256]).flatten().astype(int).tolist()
    blue  = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten().astype(int).tolist()
    pixels = gray.flatten().astype(np.float64)

    return {
        "grayscale": grayscale,
        "red": red,
        "green": green,
        "blue": blue,
        "R": red,
        "G": green,
        "B": blue,
        "L": grayscale,
        "mean": round(float(np.mean(pixels)), 4),
        "std": round(float(np.std(pixels)), 4),
        "min": int(np.min(pixels)),
        "max": int(np.max(pixels)),
    }


@router.get("/histogram/{session_id}/current")
def histogram_current(session_id: str):
    """Return histogram data for the current working image."""
    try:
        img = ss.read_current(session_id)
        return _calc_histograms(img)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/histogram/{session_id}/compare")
def histogram_compare(session_id: str):
    """Return histogram data for both original and current image."""
    try:
        ss.assert_session(session_id)
        orig_img = read_image(ss.original_path(session_id))
        curr_img = read_image(ss.current_path(session_id))
        return {
            "original": _calc_histograms(orig_img),
            "current":  _calc_histograms(curr_img),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
