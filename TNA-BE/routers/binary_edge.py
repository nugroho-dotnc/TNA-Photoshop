"""
routers/binary_edge.py
─────────────────────────────────────────────────────────────────────────────
Binary & edge processing endpoints:
  POST /binary-edge/{session_id}/threshold
  POST /binary-edge/{session_id}/edge-detection
  POST /binary-edge/{session_id}/morphology
"""

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator, model_validator
from typing import Literal, Optional

from services import session_service as ss
from services.image_utils import ensure_bgr

router = APIRouter()


def _std(session_id: str, step: int, msg: str = "Operation applied successfully.") -> dict:
    """Membentuk response standar setelah operasi citra biner dan deteksi tepi."""
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "step": step,
        "message": msg,
    }


# ─── Threshold ────────────────────────────────────────────────────────────────

class ThresholdBody(BaseModel):
    value: int = 127
    mode: Literal["binary", "binary_inv", "otsu", "adaptive"] = "binary"

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: int) -> int:
        """Memvalidasi ambang intensitas untuk proses binarisasi citra."""
        if not 0 <= v <= 255:
            raise ValueError("value must be between 0 and 255.")
        return v


@router.post("/binary-edge/{session_id}/threshold")
def threshold(session_id: str, body: ThresholdBody):
    """
    Mengubah citra grayscale menjadi citra biner menggunakan teknik thresholding.
    Mode yang didukung mencakup ambang tetap, inverse, Otsu, dan adaptive threshold.
    """
    try:
        img = ss.read_current(session_id)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        if body.mode == "adaptive":
            binary = cv2.adaptiveThreshold(
                gray,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                blockSize=11,
                C=2,
            )
        else:
            mode_map = {
                "binary":     cv2.THRESH_BINARY,
                "binary_inv": cv2.THRESH_BINARY_INV,
                "otsu":       cv2.THRESH_BINARY + cv2.THRESH_OTSU,
            }
            thresh_val = 0 if body.mode == "otsu" else body.value
            _, binary = cv2.threshold(gray, thresh_val, 255, mode_map[body.mode])

        result = ensure_bgr(binary)
        step = ss.save_step(
            session_id,
            result,
            "Threshold",
            {"value": body.value, "mode": body.mode},
        )
        return _std(session_id, step, f"Threshold ({body.mode}, val={body.value}) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Edge Detection ───────────────────────────────────────────────────────────

class EdgeDetectionBody(BaseModel):
    method: Literal["canny", "sobel", "prewitt", "robert", "laplacian", "log"]
    # Canny
    threshold1: Optional[int] = 100
    threshold2: Optional[int] = 200
    # Sobel / Laplacian
    ksize: Optional[int] = 3
    # LoG
    sigma: Optional[float] = 1.0


def _edge_canny(gray, t1, t2):
    """Mendeteksi tepi dengan Canny melalui smoothing, gradien, dan hysteresis threshold."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    return cv2.Canny(blurred, t1, t2)


def _edge_sobel(gray, ksize):
    """Mendeteksi tepi menggunakan operator Sobel berbasis gradien arah x dan y."""
    ksize = ksize if ksize % 2 == 1 else ksize + 1
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)
    return np.uint8(np.clip(np.sqrt(gx**2 + gy**2), 0, 255))


def _edge_prewitt(gray):
    """Mendeteksi tepi menggunakan operator Prewitt untuk estimasi gradien lokal."""
    kx = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float64)
    ky = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float64)
    gray_float = gray.astype(np.float64)
    gx = cv2.filter2D(gray_float, -1, kx)
    gy = cv2.filter2D(gray_float, -1, ky)
    return np.uint8(np.clip(np.sqrt(gx**2 + gy**2), 0, 255))


def _edge_robert(gray):
    """Mendeteksi tepi menggunakan operator Robert dengan kernel diagonal kecil."""
    kx = np.array([[1, 0], [0, -1]], dtype=np.float64)
    ky = np.array([[0, 1], [-1, 0]], dtype=np.float64)
    gray_float = gray.astype(np.float64)
    gx = cv2.filter2D(gray_float, -1, kx)
    gy = cv2.filter2D(gray_float, -1, ky)
    return np.uint8(np.clip(np.sqrt(gx**2 + gy**2), 0, 255))


def _edge_laplacian(gray, ksize):
    """Mendeteksi tepi menggunakan operator Laplacian berbasis turunan orde dua."""
    ksize = ksize if ksize % 2 == 1 else ksize + 1
    lap = cv2.Laplacian(gray, cv2.CV_64F, ksize=ksize)
    return np.uint8(np.clip(np.abs(lap), 0, 255))


def _edge_log(gray, sigma):
    """Mendeteksi tepi menggunakan Laplacian of Gaussian setelah smoothing Gaussian."""
    ksize = int(2 * np.ceil(3 * sigma) + 1)
    if ksize % 2 == 0:
        ksize += 1
    ksize = max(ksize, 3)
    blurred = cv2.GaussianBlur(gray, (ksize, ksize), sigmaX=sigma)
    lap = cv2.Laplacian(blurred, cv2.CV_64F)
    return np.uint8(np.clip(np.abs(lap), 0, 255))


@router.post("/binary-edge/{session_id}/edge-detection")
def edge_detection(session_id: str, body: EdgeDetectionBody):
    """
    Menerapkan deteksi tepi pada citra grayscale menggunakan operator yang dipilih.
    Hasil tepi dikonversi kembali ke tiga kanal agar konsisten dengan pipeline citra.
    """
    try:
        img = ss.read_current(session_id)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        dispatch = {
            "canny":     lambda: _edge_canny(gray, body.threshold1 or 100, body.threshold2 or 200),
            "sobel":     lambda: _edge_sobel(gray, body.ksize or 3),
            "prewitt":   lambda: _edge_prewitt(gray),
            "robert":    lambda: _edge_robert(gray),
            "laplacian": lambda: _edge_laplacian(gray, body.ksize or 3),
            "log":       lambda: _edge_log(gray, body.sigma or 1.0),
        }

        edge = dispatch[body.method]()
        result = ensure_bgr(edge)
        step = ss.save_step(
            session_id,
            result,
            "Edge Detection",
            {
                "method": body.method,
                "threshold1": body.threshold1,
                "threshold2": body.threshold2,
                "ksize": body.ksize,
                "sigma": body.sigma,
            },
        )
        return _std(session_id, step, f"Edge detection ({body.method}) applied.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Morphology ───────────────────────────────────────────────────────────────

class MorphologyBody(BaseModel):
    operation: Literal["erosion", "dilation"]
    kernel_size: int = 3
    iterations: int = 1

    @field_validator("kernel_size")
    @classmethod
    def validate_kernel(cls, v: int) -> int:
        """Memvalidasi ukuran structuring element untuk operasi morfologi."""
        if v < 1:
            raise ValueError("kernel_size must be at least 1.")
        return v

    @field_validator("iterations")
    @classmethod
    def validate_iter(cls, v: int) -> int:
        """Memvalidasi jumlah iterasi penerapan operasi morfologi."""
        if v < 1:
            raise ValueError("iterations must be at least 1.")
        return v


@router.post("/binary-edge/{session_id}/morphology")
def morphology(session_id: str, body: MorphologyBody):
    """
    Menerapkan operasi morfologi erosion atau dilation pada citra.
    Erosion mengikis area foreground, sedangkan dilation memperluas area foreground.
    """
    try:
        img = ss.read_current(session_id)
        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, (body.kernel_size, body.kernel_size)
        )
        fn = cv2.erode if body.operation == "erosion" else cv2.dilate
        result = fn(img, kernel, iterations=body.iterations)
        step = ss.save_step(
            session_id,
            result,
            "Morphology",
            {
                "operation": body.operation,
                "kernel_size": body.kernel_size,
                "iterations": body.iterations,
            },
        )
        return _std(
            session_id,
            step,
            f"Morphology {body.operation} (k={body.kernel_size}, iter={body.iterations}) applied.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
