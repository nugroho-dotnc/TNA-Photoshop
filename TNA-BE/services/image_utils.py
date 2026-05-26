"""
services/image_utils.py
─────────────────────────────────────────────────────────────────────────────
Low-level helpers for reading and writing image files with OpenCV.
"""

import cv2
import numpy as np
from pathlib import Path


def read_image(path: str) -> np.ndarray:
    """Read an image from disk into a BGR NumPy array.

    Args:
        path: Absolute path to the image file.

    Returns:
        NumPy array in BGR format.

    Raises:
        FileNotFoundError: If the image does not exist on disk.
        ValueError: If OpenCV fails to decode the image.
    """
    if not Path(path).exists():
        raise FileNotFoundError(f"Image not found: {path}")

    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"OpenCV could not read image: {path}")

    return img


def write_image(img: np.ndarray, path: str, quality: int = 95) -> None:
    """Write a BGR NumPy array to disk as JPEG.

    Args:
        img:     BGR NumPy array to write.
        path:    Absolute destination path (should end in .jpg).
        quality: JPEG quality (1–100).
    """
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    cv2.imwrite(path, img, params)


def bgr_to_rgb(img: np.ndarray) -> np.ndarray:
    """Convert BGR (OpenCV default) to RGB."""
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def ensure_bgr(img: np.ndarray) -> np.ndarray:
    """Ensure the image has 3 channels (convert grayscale → BGR if needed)."""
    if len(img.shape) == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    return img
