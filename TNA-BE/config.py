import os

# ─── Session Storage ──────────────────────────────────────────────────────────
SESSION_DIR = os.path.join(os.environ.get("TEMP", "/tmp"), "mini-photoshop")

# ─── Allowed Upload Formats ───────────────────────────────────────────────────
ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "bmp"]

# ─── History Limit ────────────────────────────────────────────────────────────
MAX_HISTORY_STEPS = 20

# ─── ML / Object Recognition ─────────────────────────────────────────────────
CNN_MODEL_PATH   = os.path.join(os.path.dirname(__file__), "models", "cnn_model.h5")
CNN_INPUT_SIZE   = (128, 128)          # (width, height) expected by the model
CNN_TARGET_CLASS = "animals"           # options: humans | animals | vehicles | objects
