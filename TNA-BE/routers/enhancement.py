"""
routers/enhancement.py
─────────────────────────────────────────────────────────────────────────────
Image enhancement endpoints:
  POST /enhance/{session_id}/brightness
  POST /enhance/{session_id}/contrast
  POST /enhance/{session_id}/histogram-equalization
  POST /enhance/{session_id}/sharpen
  POST /enhance/{session_id}/smooth
"""

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from services import session_service as ss

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _std(session_id: str, step: int, message: str = "Operation applied successfully.") -> dict:
    """Membentuk response standar setelah operasi peningkatan kualitas citra."""
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "step": step,
        "message": message,
    }


def _handle(session_id: str, img: np.ndarray, label: str, params: dict, msg: str) -> dict:
    """Menyimpan citra hasil enhancement beserta parameter operasinya."""
    step = ss.save_step(session_id, img, label, params)
    return _std(session_id, step, msg)


# ─── Brightness ───────────────────────────────────────────────────────────────

class BrightnessBody(BaseModel):
    value: int  # -100 to 100

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: int) -> int:
        """Memvalidasi konstanta penambahan intensitas piksel untuk brightness."""
        if not -100 <= v <= 100:
            raise ValueError("value must be between -100 and 100.")
        return v


@router.post("/enhance/{session_id}/brightness")
def brightness(session_id: str, body: BrightnessBody):
    """
    Mengatur kecerahan citra dengan operasi titik pada nilai intensitas piksel.
    Setiap piksel ditambah konstanta tertentu, lalu dibatasi pada rentang 0 sampai 255.
    """
    try:
        img = ss.read_current(session_id)
        result = np.clip(img.astype(np.int32) + body.value, 0, 255).astype(np.uint8)
        return _handle(
            session_id,
            result,
            "Brightness",
            {"value": body.value},
            f"Brightness adjusted by {body.value}.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Contrast ─────────────────────────────────────────────────────────────────

class ContrastBody(BaseModel):
    value: float  # 0.1 to 3.0

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: float) -> float:
        """Memvalidasi faktor pengali intensitas piksel untuk pengaturan kontras."""
        if not 0.1 <= v <= 3.0:
            raise ValueError("value must be between 0.1 and 3.0.")
        return v


@router.post("/enhance/{session_id}/contrast")
def contrast(session_id: str, body: ContrastBody):
    """
    Mengatur kontras citra menggunakan transformasi linear intensitas piksel.
    Nilai piksel dikalikan faktor skala untuk memperbesar atau memperkecil sebaran intensitas.
    """
    try:
        img = ss.read_current(session_id)
        result = np.clip(img.astype(np.float32) * body.value, 0, 255).astype(np.uint8)
        return _handle(
            session_id,
            result,
            "Contrast",
            {"value": body.value},
            f"Contrast multiplied by {body.value}.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Histogram Equalization ───────────────────────────────────────────────────

@router.post("/enhance/{session_id}/histogram-equalization")
def histogram_equalization(session_id: str):
    """
    Meningkatkan distribusi intensitas citra menggunakan histogram equalization.
    Pada citra berwarna, peningkatan dilakukan pada kanal luminance di ruang warna LAB.
    """
    try:
        img = ss.read_current(session_id)

        if len(img.shape) == 2 or img.shape[2] == 1:
            # Grayscale
            result = cv2.equalizeHist(img if len(img.shape) == 2 else img[:, :, 0])
            result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
        else:
            # Color: CLAHE on each channel in LAB space
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            result = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        return _handle(
            session_id,
            result,
            "Histogram Equalization",
            {},
            "Histogram equalization applied.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Sharpen ──────────────────────────────────────────────────────────────────

class SharpenBody(BaseModel):
    intensity: float  # 0.1 to 3.0

    @field_validator("intensity")
    @classmethod
    def validate_intensity(cls, v: float) -> float:
        """Memvalidasi koefisien kernel untuk proses penajaman citra."""
        if not 0.1 <= v <= 3.0:
            raise ValueError("intensity must be between 0.1 and 3.0.")
        return v


@router.post("/enhance/{session_id}/sharpen")
def sharpen(session_id: str, body: SharpenBody):
    """
    Menajamkan citra menggunakan operasi konvolusi dengan kernel high-pass.
    Proses ini memperkuat komponen tepi dan detail frekuensi tinggi pada citra.
    """
    try:
        img = ss.read_current(session_id)
        kernel = np.array(
            [
                [0, -body.intensity, 0],
                [-body.intensity, 1 + 4 * body.intensity, -body.intensity],
                [0, -body.intensity, 0],
            ],
            dtype=np.float32,
        )
        result = cv2.filter2D(img, -1, kernel)
        result = np.clip(result, 0, 255).astype(np.uint8)
        return _handle(
            session_id,
            result,
            "Sharpen",
            {"intensity": body.intensity},
            f"Sharpen with intensity {body.intensity} applied.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Smooth ───────────────────────────────────────────────────────────────────

class SmoothBody(BaseModel):
    kernel_size: int  # odd: 3, 5, 7, 9, 11

    @field_validator("kernel_size")
    @classmethod
    def validate_kernel(cls, v: int) -> int:
        """Memvalidasi ukuran kernel Gaussian untuk proses smoothing."""
        allowed = {3, 5, 7, 9, 11}
        if v not in allowed:
            raise ValueError(f"kernel_size must be one of {allowed}.")
        return v


@router.post("/enhance/{session_id}/smooth")
def smooth(session_id: str, body: SmoothBody):
    """
    Menghaluskan citra menggunakan Gaussian blur sebagai filter low-pass.
    Operasi ini mereduksi noise dan detail halus melalui konvolusi kernel Gaussian.
    """
    try:
        img = ss.read_current(session_id)
        result = cv2.GaussianBlur(img, (body.kernel_size, body.kernel_size), 0)
        return _handle(
            session_id,
            result,
            "Smooth",
            {"kernel_size": body.kernel_size},
            f"Gaussian smooth with kernel {body.kernel_size} applied.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
