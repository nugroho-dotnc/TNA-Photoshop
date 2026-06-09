"""
services/ml_service.py
─────────────────────────────────────────────────────────────────────────────
Singleton loader and inference wrapper for the CNN image recognition model.
Loads the model once at application startup.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Dict, Any

import numpy as np

from config import CNN_MODEL_PATH, CNN_INPUT_SIZE

logger = logging.getLogger(__name__)

# ─── Singleton State ──────────────────────────────────────────────────────────
_model = None
_class_names: List[str] = []


def load_model() -> None:
    """
    Memuat model Convolutional Neural Network untuk pengenalan objek citra.
    Model digunakan sebagai pendekatan pembelajaran mendalam dalam klasifikasi visual.
    """
    global _model, _class_names

    model_path = Path(CNN_MODEL_PATH)
    if not model_path.exists():
        logger.warning(
            "ML model file not found at %s. "
            "Object recognition endpoint will be unavailable.",
            CNN_MODEL_PATH,
        )
        return

    try:
        import tensorflow as tf  # type: ignore

        _model = tf.keras.models.load_model(str(model_path))
        logger.info("ML model loaded from %s", CNN_MODEL_PATH)

        # Try to load class names from a sibling labels.txt file
        labels_path = model_path.parent / "labels.txt"
        if labels_path.exists():
            _class_names = [
                line.strip() for line in labels_path.read_text().splitlines() if line.strip()
            ]
            logger.info("Loaded %d class labels.", len(_class_names))
        else:
            # Fallback: use ImageNet decode_predictions
            try:
                from tensorflow.keras.applications.imagenet_utils import decode_predictions  # type: ignore  # noqa: F401
                _class_names = []
                logger.info("Using ImageNet decode_predictions for class labels.")
            except ImportError:
                logger.warning("No labels.txt and decode_predictions unavailable.")

    except Exception as exc:
        logger.error("Failed to load ML model: %s", exc)
        _model = None


# ─── Inference ────────────────────────────────────────────────────────────────

def predict(img_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Melakukan inferensi CNN terhadap citra masukan untuk memperoleh kelas prediksi.
    Tahapan pra-pemrosesan meliputi resize, konversi BGR ke RGB, normalisasi piksel,
    dan pembentukan batch sebelum citra diproses oleh model klasifikasi.
    """
    if _model is None:
        raise RuntimeError(
            "ML model is not loaded. "
            "Ensure models/cnn_model.h5 exists and TensorFlow is installed."
        )

    import cv2
    import tensorflow as tf  # type: ignore

    # Preprocess: resize → RGB → normalize → add batch dim
    resized = cv2.resize(img_bgr, CNN_INPUT_SIZE)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    arr = np.expand_dims(rgb.astype("float32") / 255.0, axis=0)

    raw_preds = _model.predict(arr, verbose=0)

    # Build result list ───────────────────────────────────────────────────────
    if _class_names:
        probs = raw_preds[0].tolist()
        indexed = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)[:5]
        predictions = [
            {
                "label": _class_names[i] if i < len(_class_names) else f"class_{i}",
                "confidence": round(conf, 4),
            }
            for i, conf in indexed
        ]
    else:
        try:
            from tensorflow.keras.applications.imagenet_utils import decode_predictions  # type: ignore

            decoded = decode_predictions(raw_preds, top=5)[0]
            predictions = [
                {"label": label, "confidence": round(float(conf), 4)}
                for _, label, conf in decoded
            ]
        except Exception:
            probs = raw_preds[0].tolist()
            indexed = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)[:5]
            predictions = [
                {"label": f"class_{i}", "confidence": round(conf, 4)}
                for i, conf in indexed
            ]

    top_prediction = predictions[0] if predictions else {"label": "unknown", "confidence": 0.0}
    return {
        "predictions": predictions,
        "top_prediction": top_prediction["label"],
        "top_label": top_prediction["label"],
        "top_confidence": top_prediction["confidence"],
    }
