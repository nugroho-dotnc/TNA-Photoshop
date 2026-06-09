"""
services/image_utils.py
─────────────────────────────────────────────────────────────────────────────
Low-level helpers for reading and writing image files with OpenCV.
"""

import cv2
import numpy as np
from pathlib import Path


def read_image(path: str) -> np.ndarray:
    """Membaca citra digital dari media penyimpanan ke representasi matriks BGR."""
    if not Path(path).exists():
        raise FileNotFoundError(f"Image not found: {path}")

    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"OpenCV could not read image: {path}")

    return img


def write_image(img: np.ndarray, path: str, quality: int = 95) -> None:
    """Menyimpan matriks citra BGR ke file dengan parameter kualitas kompresi JPEG."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    cv2.imwrite(path, img, params)


def bgr_to_rgb(img: np.ndarray) -> np.ndarray:
    """Mengonversi urutan kanal warna dari BGR OpenCV ke RGB standar visualisasi."""
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def ensure_bgr(img: np.ndarray) -> np.ndarray:
    """Menstandarkan citra menjadi tiga kanal BGR agar operasi warna konsisten."""
    if len(img.shape) == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    return img
