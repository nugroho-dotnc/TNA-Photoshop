"""
routers/color_processing.py
─────────────────────────────────────────────────────────────────────────────
Color processing endpoints:
  POST /color/{session_id}/to-grayscale
  POST /color/{session_id}/split-channels
  POST /color/{session_id}/adjust-hue-saturation
"""

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, field_validator
from typing import Literal

from services import session_service as ss

router = APIRouter()


def _std(session_id: str, step: int, msg: str = "Operation applied successfully.") -> dict:
    """Membentuk response standar setelah operasi pemrosesan warna citra."""
    return {
        "success": True,
        "session_id": session_id,
        "current_url": f"/sessions/{session_id}/current",
        "step": step,
        "message": msg,
    }


# ─── To Grayscale ─────────────────────────────────────────────────────────────

@router.post("/color/{session_id}/to-grayscale")
def to_grayscale(session_id: str):
    """
    Mengonversi citra warna BGR ke grayscale berdasarkan informasi luminance.
    Hasil dibuat tiga kanal kembali agar kompatibel dengan pipeline penyimpanan citra.
    """
    try:
        img = ss.read_current(session_id)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)  # keep 3-channel
        step = ss.save_step(session_id, result, "Grayscale", {})
        return _std(session_id, step, "Converted to grayscale.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Split Channels ───────────────────────────────────────────────────────────

class SplitChannelBody(BaseModel):
    channel: Literal["R", "G", "B"]


@router.post("/color/{session_id}/split-channels")
def split_channels(session_id: str, body: SplitChannelBody):
    """
    Memisahkan kanal warna RGB untuk menganalisis kontribusi tiap komponen warna.
    Kanal yang tidak dipilih diatur nol sehingga hanya kanal target yang terlihat.
    """
    try:
        img = ss.read_current(session_id)
        result = np.zeros_like(img)

        # OpenCV is BGR: index 0 = B, 1 = G, 2 = R
        ch_map = {"B": 0, "G": 1, "R": 2}
        idx = ch_map[body.channel]
        result[:, :, idx] = img[:, :, idx]

        step = ss.save_step(session_id, result, "Split Channel", {"channel": body.channel})
        return _std(session_id, step, f"Split to {body.channel} channel only.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Adjust Hue / Saturation ──────────────────────────────────────────────────

class HueSatBody(BaseModel):
    hue_shift: int = 0           # -180 to 180
    saturation_scale: float = 1.0  # 0.0 to 3.0

    @field_validator("hue_shift")
    @classmethod
    def validate_hue(cls, v: int) -> int:
        """Memvalidasi besar pergeseran hue dalam ruang warna HSV."""
        if not -180 <= v <= 180:
            raise ValueError("hue_shift must be between -180 and 180.")
        return v

    @field_validator("saturation_scale")
    @classmethod
    def validate_sat(cls, v: float) -> float:
        """Memvalidasi faktor skala saturasi dalam ruang warna HSV."""
        if not 0.0 <= v <= 3.0:
            raise ValueError("saturation_scale must be between 0.0 and 3.0.")
        return v


@router.post("/color/{session_id}/adjust-hue-saturation")
def adjust_hue_saturation(session_id: str, body: HueSatBody):
    """
    Menyesuaikan hue dan saturasi citra melalui transformasi ruang warna HSV.
    Hue mengubah rona warna, sedangkan saturasi mengatur kemurnian warna.
    """
    try:
        img = ss.read_current(session_id)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)

        # Hue channel: 0–179 in OpenCV
        hsv[:, :, 0] = (hsv[:, :, 0] + body.hue_shift / 2.0) % 180
        # Saturation channel: 0–255
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * body.saturation_scale, 0, 255)

        result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        step = ss.save_step(
            session_id,
            result,
            "Hue/Saturation",
            {
                "hue_shift": body.hue_shift,
                "saturation_scale": body.saturation_scale,
            },
        )
        return _std(
            session_id,
            step,
            f"Hue shifted {body.hue_shift}°, saturation ×{body.saturation_scale}.",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/color/{session_id}/channel-preview")
def channel_preview(session_id: str, channel: Literal["R", "G", "B"]):
    """Menyediakan preview analisis kanal warna tanpa menyimpan perubahan ke history."""
    try:
        img = ss.read_current(session_id)
        result = np.zeros_like(img)
        ch_map = {"B": 0, "G": 1, "R": 2}
        idx = ch_map[channel]
        result[:, :, idx] = img[:, :, idx]

        ok, encoded = cv2.imencode(".jpg", result)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to encode channel preview.")
        return Response(content=encoded.tobytes(), media_type="image/jpeg")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
