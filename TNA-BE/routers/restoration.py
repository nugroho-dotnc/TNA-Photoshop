"""
routers/restoration.py
─────────────────────────────────────────────────────────────────────────────
Image restoration / noise reduction endpoints:
  POST /restoration/{session_id}/gaussian-blur
  POST /restoration/{session_id}/median-filter
  POST /restoration/{session_id}/noise-removal
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


# ─── Gaussian Blur ────────────────────────────────────────────────────────────

class GaussianBlurBody(BaseModel):
    kernel_size: int
    sigma: float = 0.0

    @field_validator("kernel_size")
    @classmethod
    def must_be_odd(cls, v: int) -> int:
        if v < 1 or v % 2 == 0:
            raise ValueError("kernel_size must be a positive odd integer.")
        return v


@router.post("/restoration/{session_id}/gaussian-blur")
def gaussian_blur(session_id: str, body: GaussianBlurBody):
    try:
        img = ss.read_current(session_id)
        result = cv2.GaussianBlur(img, (body.kernel_size, body.kernel_size), body.sigma)
        step = ss.save_step(
            session_id,
            result,
            "Gaussian Blur",
            {"kernel_size": body.kernel_size, "sigma": body.sigma},
        )
        return _std(session_id, step, f"Gaussian blur (k={body.kernel_size}, σ={body.sigma}) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Median Filter ────────────────────────────────────────────────────────────

class MedianFilterBody(BaseModel):
    kernel_size: int

    @field_validator("kernel_size")
    @classmethod
    def must_be_odd(cls, v: int) -> int:
        if v < 1 or v % 2 == 0:
            raise ValueError("kernel_size must be a positive odd integer.")
        return v


@router.post("/restoration/{session_id}/median-filter")
def median_filter(session_id: str, body: MedianFilterBody):
    try:
        img = ss.read_current(session_id)
        result = cv2.medianBlur(img, body.kernel_size)
        step = ss.save_step(
            session_id,
            result,
            "Median Filter",
            {"kernel_size": body.kernel_size},
        )
        return _std(session_id, step, f"Median filter (k={body.kernel_size}) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Noise Removal ────────────────────────────────────────────────────────────

class NoiseRemovalBody(BaseModel):
    noise_type: Literal["salt_pepper"] = "salt_pepper"
    strength: int = 3  # maps to kernel size

    @field_validator("strength")
    @classmethod
    def validate_strength(cls, v: int) -> int:
        if v < 1 or v > 10:
            raise ValueError("strength must be between 1 and 10.")
        return v


def _strength_to_kernel(strength: int) -> int:
    """Map 1–10 strength to an odd kernel size (3–21)."""
    k = 1 + strength * 2
    return k if k % 2 == 1 else k + 1


@router.post("/restoration/{session_id}/noise-removal")
def noise_removal(session_id: str, body: NoiseRemovalBody):
    try:
        img = ss.read_current(session_id)
        kernel = _strength_to_kernel(body.strength)
        result = cv2.medianBlur(img, kernel)
        step = ss.save_step(
            session_id,
            result,
            "Noise Removal",
            {
                "noise_type": body.noise_type,
                "strength": body.strength,
                "kernel_size": kernel,
            },
        )
        return _std(
            session_id,
            step,
            f"Noise removal ({body.noise_type}, strength={body.strength}, k={kernel}) applied.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
