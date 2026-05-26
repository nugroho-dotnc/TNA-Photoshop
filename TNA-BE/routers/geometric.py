"""
routers/geometric.py
─────────────────────────────────────────────────────────────────────────────
Geometric transformation endpoints:
  POST /geometric/{session_id}/rotate
  POST /geometric/{session_id}/flip
  POST /geometric/{session_id}/crop
  POST /geometric/{session_id}/resize
  POST /geometric/{session_id}/translate
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


# ─── Rotate ───────────────────────────────────────────────────────────────────

class RotateBody(BaseModel):
    angle: float      # 0–360
    expand: bool = True


@router.post("/geometric/{session_id}/rotate")
def rotate(session_id: str, body: RotateBody):
    try:
        img = ss.read_current(session_id)
        h, w = img.shape[:2]
        center = (w / 2, h / 2)
        M = cv2.getRotationMatrix2D(center, -body.angle, 1.0)

        if body.expand:
            cos = abs(M[0, 0])
            sin = abs(M[0, 1])
            new_w = int(h * sin + w * cos)
            new_h = int(h * cos + w * sin)
            M[0, 2] += (new_w / 2) - center[0]
            M[1, 2] += (new_h / 2) - center[1]
            result = cv2.warpAffine(img, M, (new_w, new_h), flags=cv2.INTER_LINEAR)
        else:
            result = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR)

        step = ss.save_step(
            session_id,
            result,
            "Rotate",
            {"angle": body.angle, "expand": body.expand},
        )
        return _std(session_id, step, f"Rotated {body.angle}°.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Flip ─────────────────────────────────────────────────────────────────────

class FlipBody(BaseModel):
    direction: Literal["horizontal", "vertical"]


@router.post("/geometric/{session_id}/flip")
def flip(session_id: str, body: FlipBody):
    try:
        img = ss.read_current(session_id)
        flip_code = 1 if body.direction == "horizontal" else 0
        result = cv2.flip(img, flip_code)
        step = ss.save_step(
            session_id,
            result,
            "Flip",
            {"direction": body.direction},
        )
        return _std(session_id, step, f"Flipped {body.direction}.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Crop ─────────────────────────────────────────────────────────────────────

class CropBody(BaseModel):
    x: int
    y: int
    width: int
    height: int

    @field_validator("width", "height")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("width and height must be positive integers.")
        return v


@router.post("/geometric/{session_id}/crop")
def crop(session_id: str, body: CropBody):
    try:
        img = ss.read_current(session_id)
        h, w = img.shape[:2]

        x2 = body.x + body.width
        y2 = body.y + body.height

        if body.x < 0 or body.y < 0 or x2 > w or y2 > h:
            raise HTTPException(
                status_code=400,
                detail=f"Crop region ({body.x},{body.y},{x2},{y2}) exceeds image bounds ({w}×{h}).",
            )

        result = img[body.y:y2, body.x:x2]
        step = ss.save_step(
            session_id,
            result,
            "Crop",
            {"x": body.x, "y": body.y, "width": body.width, "height": body.height},
        )
        return _std(session_id, step, f"Cropped to {body.width}×{body.height} at ({body.x},{body.y}).")
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Resize ───────────────────────────────────────────────────────────────────

class ResizeBody(BaseModel):
    width: int
    height: int
    interpolation: Literal["nearest", "bilinear"] = "bilinear"

    @field_validator("width", "height")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("width and height must be positive integers.")
        return v


@router.post("/geometric/{session_id}/resize")
def resize(session_id: str, body: ResizeBody):
    try:
        img = ss.read_current(session_id)
        interp = cv2.INTER_NEAREST if body.interpolation == "nearest" else cv2.INTER_LINEAR
        result = cv2.resize(img, (body.width, body.height), interpolation=interp)
        step = ss.save_step(
            session_id,
            result,
            "Resize",
            {
                "width": body.width,
                "height": body.height,
                "interpolation": body.interpolation,
            },
        )
        return _std(session_id, step, f"Resized to {body.width}×{body.height}.")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Translate ────────────────────────────────────────────────────────────────

class TranslateBody(BaseModel):
    tx: int
    ty: int


@router.post("/geometric/{session_id}/translate")
def translate(session_id: str, body: TranslateBody):
    try:
        img = ss.read_current(session_id)
        h, w = img.shape[:2]
        M = np.float32([[1, 0, body.tx], [0, 1, body.ty]])
        result = cv2.warpAffine(img, M, (w, h))
        step = ss.save_step(
            session_id,
            result,
            "Translate",
            {"tx": body.tx, "ty": body.ty},
        )
        return _std(session_id, step, f"Translated by ({body.tx}, {body.ty}).")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
