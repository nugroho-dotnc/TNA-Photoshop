"""
services/session_service.py
─────────────────────────────────────────────────────────────────────────────
Manages session lifecycle:
  - Creating / deleting session folders
  - Path helpers (original, current, history)
  - Reading / writing history_meta.json  (current_step, max_step, steps[])
  - Saving a new history step and updating current.jpg
  - Undo / redo / jump
"""

import json
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from config import SESSION_DIR, MAX_HISTORY_STEPS
from services.image_utils import read_image, write_image


# ─── Path Helpers ─────────────────────────────────────────────────────────────

def session_dir(session_id: str) -> Path:
    return Path(SESSION_DIR) / session_id


def original_path(session_id: str) -> str:
    return str(session_dir(session_id) / "original.jpg")


def current_path(session_id: str) -> str:
    return str(session_dir(session_id) / "current.jpg")


def history_dir(session_id: str) -> Path:
    return session_dir(session_id) / "history"


def history_step_path(session_id: str, step: int) -> str:
    return str(history_dir(session_id) / f"step_{step}.jpg")


def _meta_path(session_id: str) -> Path:
    return session_dir(session_id) / "history_meta.json"


# ─── history_meta.json R/W ────────────────────────────────────────────────────

def _empty_meta() -> Dict[str, Any]:
    return {"current_step": 0, "max_step": 0, "steps": []}


def read_meta(session_id: str) -> Dict[str, Any]:
    """Read history_meta.json; return empty structure if missing."""
    p = _meta_path(session_id)
    if not p.exists():
        return _empty_meta()
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return _empty_meta()


def write_meta(session_id: str, meta: Dict[str, Any]) -> None:
    _meta_path(session_id).write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def get_current_step(session_id: str) -> int:
    return read_meta(session_id).get("current_step", 0)


# ─── Session Validation ───────────────────────────────────────────────────────

def session_exists(session_id: str) -> bool:
    return session_dir(session_id).exists()


def assert_session(session_id: str) -> None:
    """Raise FileNotFoundError with a clear message if the session does not exist."""
    if not session_exists(session_id):
        raise FileNotFoundError(
            f"Session {session_id} not found. Please upload an image first."
        )


# ─── Session Lifecycle ────────────────────────────────────────────────────────

def create_session() -> str:
    """Create a new session directory, initialize history_meta.json, return UUID."""
    session_id = str(uuid.uuid4())
    sdir = session_dir(session_id)
    sdir.mkdir(parents=True, exist_ok=True)
    history_dir(session_id).mkdir(parents=True, exist_ok=True)
    write_meta(session_id, _empty_meta())
    return session_id


def delete_session(session_id: str) -> None:
    """Permanently delete a session folder and all its contents."""
    sdir = session_dir(session_id)
    if sdir.exists():
        shutil.rmtree(sdir)


def reset_session(session_id: str) -> int:
    """Reset current.jpg to original.jpg and clear history."""
    assert_session(session_id)

    # Clear history folder (keep the folder itself)
    hdir = history_dir(session_id)
    for f in hdir.iterdir():
        f.unlink(missing_ok=True)

    # Copy original → current
    shutil.copy2(original_path(session_id), current_path(session_id))

    # Reset metadata
    write_meta(session_id, _empty_meta())
    return 0


# ─── Save Step (main write helper used by all processing routers) ─────────────

def save_step(
    session_id: str,
    img: np.ndarray,
    label: str,
    params: Optional[Dict[str, Any]] = None,
) -> int:
    """Persist a processed image as the next history step.

    Flow (matches spec §Shared Behavior):
      1. Read history_meta.json → current_step
      2. Check MAX_HISTORY_STEPS limit
      3. Trim redo steps beyond current_step
      4. Write history/step_{N+1}.jpg
      5. Overwrite current.jpg
      6. Update history_meta.json (current_step, max_step, steps[])
      7. Return new step index

    Raises:
        OverflowError: When next_step would exceed MAX_HISTORY_STEPS.
    """
    meta = read_meta(session_id)
    current_step: int = meta.get("current_step", 0)
    next_step = current_step + 1

    if next_step > MAX_HISTORY_STEPS:
        raise OverflowError(
            "History limit reached. Please reset or undo before continuing."
        )

    # Write image files
    write_image(img, history_step_path(session_id, next_step))
    write_image(img, current_path(session_id))

    # Trim redo entries and append new step
    steps: List[Dict] = [s for s in meta.get("steps", []) if s["step"] <= current_step]
    steps.append({
        "step": next_step,
        "label": label,
        "params": params or {},
    })

    meta["current_step"] = next_step
    meta["max_step"] = next_step
    meta["steps"] = steps
    write_meta(session_id, meta)

    return next_step


# ─── History Navigation ───────────────────────────────────────────────────────

def undo_step(session_id: str) -> int:
    """Revert current.jpg to the previous history step.

    Returns the new (decremented) step index.
    Raises ValueError if already at step 0.
    """
    assert_session(session_id)
    meta = read_meta(session_id)
    current_step: int = meta.get("current_step", 0)

    if current_step == 0:
        raise ValueError("Nothing to undo. Already at original image.")

    target_step = current_step - 1

    if target_step == 0:
        src = original_path(session_id)
    else:
        src = history_step_path(session_id, target_step)

    shutil.copy2(src, current_path(session_id))
    meta["current_step"] = target_step
    write_meta(session_id, meta)
    return target_step


def redo_step(session_id: str) -> int:
    """Re-apply the next history step.

    Returns the new (incremented) step index.
    Raises ValueError if no redo step is available.
    """
    assert_session(session_id)
    meta = read_meta(session_id)
    current_step: int = meta.get("current_step", 0)
    max_step: int = meta.get("max_step", 0)

    if current_step >= max_step:
        raise ValueError("Nothing to redo. Already at latest step.")

    next_step = current_step + 1
    src = history_step_path(session_id, next_step)
    shutil.copy2(src, current_path(session_id))
    meta["current_step"] = next_step
    write_meta(session_id, meta)
    return next_step


def jump_to_step(session_id: str, step: int) -> int:
    """Jump directly to any step (0 = original).

    Returns the target step index.
    Raises ValueError if step is out of valid range.
    """
    assert_session(session_id)
    meta = read_meta(session_id)
    max_step: int = meta.get("max_step", 0)

    if step < 0 or step > max_step:
        raise ValueError(
            f"Step {step} is out of range. Valid range: 0–{max_step}."
        )

    if step == 0:
        src = original_path(session_id)
    else:
        src = history_step_path(session_id, step)

    shutil.copy2(src, current_path(session_id))
    meta["current_step"] = step
    write_meta(session_id, meta)
    return step


def get_history(session_id: str) -> Dict[str, Any]:
    """Return the full history_meta.json content."""
    assert_session(session_id)
    return read_meta(session_id)


# ─── Convenience Reader ───────────────────────────────────────────────────────

def read_current(session_id: str) -> np.ndarray:
    """Assert session exists and return the current working image."""
    assert_session(session_id)
    return read_image(current_path(session_id))
