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
    """Mengembalikan direktori kerja yang menyimpan data eksperimen citra per session."""
    return Path(SESSION_DIR) / session_id


def original_path(session_id: str) -> str:
    """Mengembalikan path citra referensi awal sebelum operasi pengolahan citra."""
    return str(session_dir(session_id) / "original.jpg")


def current_path(session_id: str) -> str:
    """Mengembalikan path citra hasil sementara setelah operasi terbaru."""
    return str(session_dir(session_id) / "current.jpg")


def history_dir(session_id: str) -> Path:
    """Mengembalikan direktori penyimpanan urutan hasil transformasi citra."""
    return session_dir(session_id) / "history"


def history_step_path(session_id: str, step: int) -> str:
    """Mengembalikan path citra hasil pada indeks step pengolahan tertentu."""
    return str(history_dir(session_id) / f"step_{step}.jpg")


def _meta_path(session_id: str) -> Path:
    """Mengembalikan path metadata yang merekam urutan operasi pengolahan citra."""
    return session_dir(session_id) / "history_meta.json"


# ─── history_meta.json R/W ────────────────────────────────────────────────────

def _empty_meta() -> Dict[str, Any]:
    """Membuat struktur metadata awal untuk pelacakan proses pengolahan citra."""
    return {"current_step": 0, "max_step": 0, "steps": []}


def read_meta(session_id: str) -> Dict[str, Any]:
    """Membaca metadata histori transformasi citra pada session aktif."""
    p = _meta_path(session_id)
    if not p.exists():
        return _empty_meta()
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return _empty_meta()


def write_meta(session_id: str, meta: Dict[str, Any]) -> None:
    """Menyimpan metadata histori operasi pengolahan citra ke file JSON."""
    _meta_path(session_id).write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def get_current_step(session_id: str) -> int:
    """Mengambil indeks step yang merepresentasikan kondisi citra saat ini."""
    return read_meta(session_id).get("current_step", 0)


# ─── Session Validation ───────────────────────────────────────────────────────

def session_exists(session_id: str) -> bool:
    """Memeriksa ketersediaan session sebagai ruang kerja pengolahan citra."""
    return session_dir(session_id).exists()


def assert_session(session_id: str) -> None:
    """Memastikan session pengolahan citra tersedia sebelum operasi dijalankan."""
    if not session_exists(session_id):
        raise FileNotFoundError(
            f"Session {session_id} not found. Please upload an image first."
        )


# ─── Session Lifecycle ────────────────────────────────────────────────────────

def create_session() -> str:
    """Membuat ruang kerja baru untuk menyimpan citra original, current, dan history."""
    session_id = str(uuid.uuid4())
    sdir = session_dir(session_id)
    sdir.mkdir(parents=True, exist_ok=True)
    history_dir(session_id).mkdir(parents=True, exist_ok=True)
    write_meta(session_id, _empty_meta())
    return session_id


def delete_session(session_id: str) -> None:
    """Menghapus seluruh data citra dan metadata yang terkait dengan session."""
    sdir = session_dir(session_id)
    if sdir.exists():
        shutil.rmtree(sdir)


def reset_session(session_id: str) -> int:
    """Mengembalikan citra kerja ke kondisi original dan menghapus histori operasi."""
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
    """
    Menyimpan hasil operasi pengolahan citra sebagai step history berikutnya.
    Mekanisme ini mendukung analisis bertahap, undo-redo, serta pelacakan parameter
    tiap transformasi yang diterapkan pada citra.
    """
    meta = read_meta(session_id)
    current_step: int = meta.get("current_step", 0)
    next_step = current_step + 1

    if next_step > MAX_HISTORY_STEPS:
        raise OverflowError(
            "History limit reached. Please reset or undo before continuing."
        )

    # PENJELASAN ARSITEKTUR: FILE-BASED STATE
    # Backend menyimpan hasil gambar baru ke folder history (sebagai riwayat/step_X.jpg), 
    # dan juga MENIMPA file 'current.jpg' agar Frontend selalu mendapat gambar terupdate.
    write_image(img, history_step_path(session_id, next_step))
    write_image(img, current_path(session_id))

    # Trim redo entries and append new step
    # Jika user kembali ke masa lalu (undo) lalu apply efek baru, 
    # riwayat "masa depan" lama yang ada di atas current_step akan dihapus (trim).
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
    """Mengembalikan citra kerja ke hasil pengolahan pada step sebelumnya."""
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

    # PENJELASAN ARSITEKTUR: UNDO MECHANISM
    # Operasi Undo bukan mengembalikan memori array, tapi hanya sekedar MENGKOPI 
    # file gambar dari riwayat masa lalu (step_X) lalu menimpanya ke 'current.jpg'
    shutil.copy2(src, current_path(session_id))
    meta["current_step"] = target_step
    write_meta(session_id, meta)
    return target_step


def redo_step(session_id: str) -> int:
    """Memulihkan citra kerja ke step lanjutan setelah operasi undo."""
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
    """Mengatur citra kerja ke step tertentu untuk membandingkan tahapan pengolahan."""
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
    """Mengembalikan metadata lengkap berisi urutan operasi dan parameter citra."""
    assert_session(session_id)
    return read_meta(session_id)


# ─── Convenience Reader ───────────────────────────────────────────────────────

def read_current(session_id: str) -> np.ndarray:
    """Membaca citra kerja terbaru sebagai matriks NumPy untuk diproses lebih lanjut."""
    assert_session(session_id)
    return read_image(current_path(session_id))
