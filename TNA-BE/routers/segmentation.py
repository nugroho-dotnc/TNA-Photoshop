"""
routers/segmentation.py
─────────────────────────────────────────────────────────────────────────────
Image segmentation endpoints:
  POST /segmentation/{session_id}/threshold-based
  POST /segmentation/{session_id}/edge-based
  POST /segmentation/{session_id}/region-based
"""

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Literal

from services import session_service as ss

router = APIRouter()


def _std(session_id: str, step: int, msg: str = "Operation applied successfully.") -> dict:
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "step": step,
        "message": msg,
    }


# ─── Threshold-Based Segmentation ────────────────────────────────────────────

class ThreshSegBody(BaseModel):
    threshold: int = 127
    mode: Literal["binary", "otsu", "adaptive"] = "binary"


@router.post("/segmentation/{session_id}/threshold-based")
def threshold_based(session_id: str, body: ThreshSegBody):
    try:
        img = ss.read_current(session_id)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        if body.mode == "adaptive":
            mask = cv2.adaptiveThreshold(
                gray,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                blockSize=11,
                C=2,
            )
        elif body.mode == "otsu":
            _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        else:
            _, mask = cv2.threshold(gray, body.threshold, 255, cv2.THRESH_BINARY)

        overlay = img.copy()
        overlay[mask == 255] = [0, 0, 200]
        result = cv2.addWeighted(img, 0.4, overlay, 0.6, 0)
        step = ss.save_step(
            session_id,
            result,
            "Threshold Segmentation",
            {"threshold": body.threshold, "mode": body.mode},
        )
        return _std(session_id, step, f"Threshold segmentation ({body.mode}) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Edge-Based Segmentation ─────────────────────────────────────────────────

class EdgeSegBody(BaseModel):
    threshold1: int = 100
    threshold2: int = 200


@router.post("/segmentation/{session_id}/edge-based")
def edge_based(session_id: str, body: EdgeSegBody):
    try:
        img = ss.read_current(session_id)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, body.threshold1, body.threshold2)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        result = img.copy()
        for idx, contour in enumerate(contours):
            color = (
                50 + (idx * 53) % 206,
                50 + (idx * 97) % 206,
                50 + (idx * 149) % 206,
            )
            cv2.drawContours(result, [contour], -1, color, 2)

        step = ss.save_step(
            session_id,
            result,
            "Edge Segmentation",
            {"threshold1": body.threshold1, "threshold2": body.threshold2},
        )
        return _std(session_id, step, f"Edge-based segmentation (Canny {body.threshold1}/{body.threshold2}) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Region-Based Segmentation (K-Means) ─────────────────────────────────────

class RegionSegBody(BaseModel):
    num_clusters: int = 4

    @field_validator("num_clusters")
    @classmethod
    def validate_clusters(cls, v: int) -> int:
        if not 2 <= v <= 8:
            raise ValueError("num_clusters must be between 2 and 8.")
        return v


@router.post("/segmentation/{session_id}/region-based")
def region_based(session_id: str, body: RegionSegBody):
    try:
        img = ss.read_current(session_id)
        h, w = img.shape[:2]

        # Reshape to (N, 3) float32 for k-means
        pixels = img.reshape(-1, 3).astype(np.float32)

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
        _, labels, centers = cv2.kmeans(
            pixels, body.num_clusters, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
        )

        centers = centers.astype(np.uint8)
        result = centers[labels.flatten()].reshape(h, w, 3)

        step = ss.save_step(
            session_id,
            result,
            "Region Segmentation",
            {"num_clusters": body.num_clusters},
        )
        return _std(session_id, step, f"K-means segmentation ({body.num_clusters} clusters) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
