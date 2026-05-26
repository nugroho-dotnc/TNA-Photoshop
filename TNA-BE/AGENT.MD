# Agent Instructions: Mini Photoshop — Backend API

## Project Overview

Build a **RESTful backend API** for "Mini Photoshop", a digital image processing application built for an academic course on Digital Image Processing (Pengolahan Citra Digital). The backend handles all image processing logic and exposes it via HTTP endpoints.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.10+ |
| Framework | FastAPI |
| Image Processing | OpenCV (`cv2`), Pillow (`PIL`) |
| Numerical Computing | NumPy |
| Histogram Visualization | Matplotlib |
| ML / Object Recognition | TensorFlow + Keras |
| Server | Uvicorn |
| File Serving | FastAPI StaticFiles |

---

## Architecture Overview

### Pattern: Stateful Session-Based API

The server maintains temporary image state per user session. Each session stores the original uploaded image and a current working copy. All processing operations mutate the current working copy, not the original.

### Session Folder Structure

```
/tmp/mini-photoshop/
└── {session_id}/
    ├── original.jpg          ← never modified (used for reset)
    ├── current.jpg           ← updated after every operation
    ├── history_meta.json     ← operation metadata & step pointer
    └── history/
        ├── step_1.jpg
        ├── step_2.jpg
        └── step_N.jpg        ← stack for undo/redo
```

**`history_meta.json` structure:**
```json
{
  "current_step": 5,
  "max_step": 5,
  "steps": [
    { "step": 1, "label": "Sharpen",    "params": { "intensity": 1.5 } },
    { "step": 2, "label": "Crop",       "params": { "x": 10, "y": 10, "width": 300, "height": 200 } },
    { "step": 3, "label": "Brightness", "params": { "value": 30 } },
    { "step": 4, "label": "Rotate",     "params": { "angle": 90 } },
    { "step": 5, "label": "Canny Edge", "params": { "threshold1": 100, "threshold2": 200 } }
  ]
}
```

- `session_id` is a UUID4 string generated at upload time.
- `current_step` = pointer to the active step (used for undo/redo).
- `max_step` = highest step ever written (redo ceiling).
- When a new operation is applied after an undo, steps beyond `current_step` are truncated and `max_step` is reset.
- `label` is a human-readable operation name displayed in the frontend Layer panel.
- Session cleanup is **manual** (no TTL/auto-expiry). Provide a DELETE endpoint.

### Image Transfer Protocol

- **Client → Server**: `multipart/form-data` (file upload on initial load only)
- **Server → Client**: JSON response containing a URL path to fetch the image
- **Image fetch**: `GET /sessions/{session_id}/current` returns the current image file
- **Original fetch**: `GET /sessions/{session_id}/original` returns the original image file
- No base64 encoding in responses.

---

## Project Structure

```
mini-photoshop-api/
├── main.py
├── config.py
├── routers/
│   ├── session.py
│   ├── image_management.py
│   ├── enhancement.py
│   ├── geometric.py
│   ├── restoration.py
│   ├── binary_edge.py
│   ├── color_processing.py
│   ├── segmentation.py
│   ├── compression.py
│   ├── histogram.py
│   └── ml_recognition.py
├── services/
│   ├── session_service.py    ← session CRUD, path helpers, history_meta R/W
│   ├── image_utils.py        ← read/write image helpers
│   └── ml_service.py         ← load model singleton, run inference
├── models/
│   └── cnn_model.h5          ← pretrained CNN weights
└── requirements.txt
```

---

## Configuration (`config.py`)

```python
SESSION_DIR        = "/tmp/mini-photoshop"
ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "bmp"]
MAX_HISTORY_STEPS  = 20
CNN_MODEL_PATH     = "models/cnn_model.h5"
CNN_INPUT_SIZE     = (224, 224)
CNN_TARGET_CLASS   = "animals"   # options: humans, animals, vehicles, objects
```

---

## API Design

### Standard Response Format

Every endpoint (except file-serving GET routes) returns:

```json
{
  "success": true,
  "session_id": "uuid-string",
  "current_url": "/sessions/{session_id}/current",
  "step": 5,
  "message": "Operation applied successfully"
}
```

On error:

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "code": "INVALID_PARAM | SESSION_NOT_FOUND | PROCESSING_FAILED"
}
```

> The `error` field is displayed verbatim in the frontend log panel. Write clear, human-readable messages.

---

## Endpoints Specification

### 1. Session Management (`/session`)

#### `POST /session/upload`
- **Purpose**: Create a new session and upload the initial image
- **Input**: `multipart/form-data` with field `file` (JPG, PNG, BMP)
- **Behavior**:
  - Validate file extension
  - Generate `session_id` (UUID4)
  - Save uploaded file as `original.jpg` and `current.jpg`
  - Initialize empty `history/` folder
  - Create `history_meta.json` with `current_step: 0`, `max_step: 0`, `steps: []`
- **Response**: `{ session_id, current_url, original_url, step: 0 }`

#### `POST /session/{session_id}/reset`
- **Purpose**: Reset current image back to the original upload
- **Behavior**:
  - Copy `original.jpg` → `current.jpg`
  - Delete all files in `history/`
  - Reset `history_meta.json` to `{ current_step: 0, max_step: 0, steps: [] }`
- **Response**: standard response with `step: 0`

#### `POST /session/{session_id}/undo`
- **Purpose**: Revert to the previous history step
- **Behavior**:
  - Read `current_step` from `history_meta.json`
  - If `current_step == 0`, return error "Nothing to undo. Already at original image."
  - If `current_step == 1`, copy `original.jpg` → `current.jpg`
  - Else copy `history/step_{current_step - 1}.jpg` → `current.jpg`
  - Decrement `current_step` in `history_meta.json`
- **Response**: standard response with updated `step`

#### `POST /session/{session_id}/redo`
- **Purpose**: Re-apply a previously undone step
- **Behavior**:
  - Read `current_step` and `max_step` from `history_meta.json`
  - If `current_step == max_step`, return error "Nothing to redo. Already at latest step."
  - Copy `history/step_{current_step + 1}.jpg` → `current.jpg`
  - Increment `current_step` in `history_meta.json`
- **Response**: standard response with updated `step`

#### `POST /session/{session_id}/jump`
- **Purpose**: Jump directly to a specific history step (used by Layer panel click)
- **Input (JSON body)**: `{ "step": 3 }`
- **Behavior**:
  - Validate `step` is between 0 and `max_step`
  - If `step == 0`, copy `original.jpg` → `current.jpg`
  - Else copy `history/step_{N}.jpg` → `current.jpg`
  - Update `current_step` in `history_meta.json`
- **Response**: standard response with updated `step`

#### `GET /session/{session_id}/history`
- **Purpose**: Return full history metadata for the Layer panel
- **Response**:
```json
{
  "current_step": 5,
  "max_step": 5,
  "steps": [
    { "step": 1, "label": "Sharpen",    "params": { "intensity": 1.5 } },
    { "step": 2, "label": "Crop",       "params": { "x": 10, "y": 10, "width": 300, "height": 200 } },
    { "step": 3, "label": "Brightness", "params": { "value": 30 } },
    { "step": 4, "label": "Rotate",     "params": { "angle": 90 } },
    { "step": 5, "label": "Canny Edge", "params": { "threshold1": 100, "threshold2": 200 } }
  ]
}
```

#### `DELETE /session/{session_id}`
- **Purpose**: Delete session and all its files (manual cleanup)
- **Response**: `{ "success": true, "message": "Session deleted" }`

#### `GET /sessions/{session_id}/current`
- **Purpose**: Serve the current working image file directly
- **Response**: Image binary (served via StaticFiles)

#### `GET /sessions/{session_id}/original`
- **Purpose**: Serve the original uploaded image file
- **Response**: Image binary (served via StaticFiles)

---

### 2. Image Management (`/image`)

#### `POST /image/{session_id}/save`
- **Purpose**: Export current image as downloadable file
- **Input (JSON body)**: `{ "filename": string, "format": "jpg" | "png" | "bmp", "quality": int (1–100) }`
- **Behavior**: Export `current.jpg` with given filename, format, and quality
- **Response**: File binary with header `Content-Disposition: attachment; filename="{filename}.{format}"`

---

### 3. Image Enhancement (`/enhance`)

All enhancement endpoints share this behavior:
- Read `current.jpg` → apply operation → write `history/step_{N+1}.jpg` → overwrite `current.jpg` → update `history_meta.json`
- Response: standard response

#### `POST /enhance/{session_id}/brightness`
- **Input**: `{ "value": int }` (range -100 to 100)
- **Label**: `"Brightness {value:+d}"`
- **Technique**: Add scalar to all pixel channels, clip to 0–255

#### `POST /enhance/{session_id}/contrast`
- **Input**: `{ "value": float }` (range 0.1 to 3.0, 1.0 = no change)
- **Label**: `"Contrast x{value}"`
- **Technique**: Multiply pixel values by factor, clip to 0–255

#### `POST /enhance/{session_id}/histogram-equalization`
- **Input**: none
- **Label**: `"Histogram Equalization"`
- **Technique**: `cv2.equalizeHist` on grayscale; CLAHE per channel on color images

#### `POST /enhance/{session_id}/sharpen`
- **Input**: `{ "intensity": float }` (0.1 to 3.0)
- **Label**: `"Sharpen x{intensity}"`
- **Technique**: Unsharp mask — subtract blurred version from original scaled by intensity

#### `POST /enhance/{session_id}/smooth`
- **Input**: `{ "kernel_size": int }` (must be odd: 3, 5, 7, 9, 11)
- **Label**: `"Smooth k={kernel_size}"`
- **Technique**: `cv2.GaussianBlur`
- **Validation**: If even number provided, return HTTP 400 with message `"Kernel size must be odd. Received: {value}"`

---

### 4. Geometric Transformation (`/geometric`)

#### `POST /geometric/{session_id}/rotate`
- **Input**: `{ "angle": float, "expand": bool }`  (angle: 0–360)
- **Label**: `"Rotate {angle}°"`
- **Technique**: `cv2.getRotationMatrix2D`, bilinear interpolation via `cv2.warpAffine`

#### `POST /geometric/{session_id}/flip`
- **Input**: `{ "direction": "horizontal" | "vertical" }`
- **Label**: `"Flip {direction}"`
- **Technique**: `cv2.flip` (flipCode: 1 = horizontal, 0 = vertical)

#### `POST /geometric/{session_id}/crop`
- **Input**: `{ "x": int, "y": int, "width": int, "height": int }` (pixel coordinates)
- **Label**: `"Crop ({x},{y}) {width}×{height}"`
- **Technique**: NumPy array slicing `img[y:y+height, x:x+width]`
- **Validation**: Reject if crop area exceeds image dimensions with message `"Crop area (x={x}, y={y}, w={width}, h={height}) exceeds image size ({img_w}×{img_h})."`

#### `POST /geometric/{session_id}/resize`
- **Input**: `{ "width": int, "height": int, "interpolation": "nearest" | "bilinear" }`
- **Label**: `"Resize {width}×{height}"`
- **Technique**: `cv2.resize` with `INTER_NEAREST` or `INTER_LINEAR`

#### `POST /geometric/{session_id}/translate`
- **Input**: `{ "tx": int, "ty": int }` (pixel offset)
- **Label**: `"Translate ({tx},{ty})"`
- **Technique**: Affine translation matrix via `cv2.warpAffine`

---

### 5. Image Restoration / Noise Reduction (`/restoration`)

#### `POST /restoration/{session_id}/gaussian-blur`
- **Input**: `{ "kernel_size": int, "sigma": float }`
- **Label**: `"Gaussian Blur k={kernel_size}"`
- **Technique**: `cv2.GaussianBlur`

#### `POST /restoration/{session_id}/median-filter`
- **Input**: `{ "kernel_size": int }` (odd)
- **Label**: `"Median Filter k={kernel_size}"`
- **Technique**: `cv2.medianBlur`

#### `POST /restoration/{session_id}/noise-removal`
- **Input**: `{ "noise_type": "salt_pepper", "strength": int }` (strength: 1–10)
- **Label**: `"Noise Removal (strength={strength})"`
- **Technique**: Median filter with kernel size proportional to strength

---

### 6. Binary & Edge Processing (`/binary-edge`)

#### `POST /binary-edge/{session_id}/threshold`
- **Input**: `{ "value": int, "mode": "binary" | "binary_inv" | "otsu" }` (value: 0–255)
- **Label**: `"Threshold {mode} t={value}"`
- **Technique**: `cv2.threshold`; Otsu mode ignores `value` and auto-computes

#### `POST /binary-edge/{session_id}/edge-detection`
- **Input**: `{ "method": "canny" | "sobel" | "prewitt" | "robert" | "laplacian" | "log", ...method_params }`
- Method-specific params:
  - `canny`: `threshold1: int, threshold2: int`
  - `sobel`: `ksize: int` (1, 3, 5, 7)
  - `laplacian`: `ksize: int`
  - `log`: `sigma: float`
- **Label**: `"Edge: {Method}"`
- **Techniques**:
  - **Canny**: `cv2.Canny`
  - **Sobel**: `cv2.Sobel` X + Y, combine with magnitude
  - **Prewitt**: Custom 3×3 kernels via `cv2.filter2D`
  - **Robert**: Custom 2×2 diagonal kernels via `cv2.filter2D`
  - **Laplacian**: `cv2.Laplacian`
  - **LoG**: `cv2.GaussianBlur` first, then `cv2.Laplacian`

#### `POST /binary-edge/{session_id}/morphology`
- **Input**: `{ "operation": "erosion" | "dilation", "kernel_size": int, "iterations": int }`
- **Label**: `"{Operation} k={kernel_size} i={iterations}"`
- **Technique**: `cv2.erode` / `cv2.dilate` with rectangular structuring element

---

### 7. Color Processing (`/color`)

#### `POST /color/{session_id}/to-grayscale`
- **Input**: none
- **Label**: `"Grayscale"`
- **Technique**: `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)`, saved back as 3-channel image for consistency

#### `POST /color/{session_id}/split-channels`
- **Input**: `{ "channel": "R" | "G" | "B" }`
- **Label**: `"Channel View: {channel}"`
- **Technique**: Split channels via NumPy, zero out the other two channels
- **Important**: This is a **preview-only** operation. It does NOT modify `current.jpg` or write to history. Returns a `preview_url` pointing to a temporary file. `current.jpg` remains unchanged.

#### `POST /color/{session_id}/adjust-hue-saturation`
- **Input**: `{ "hue_shift": int, "saturation_scale": float }` (hue: -180 to 180, sat: 0.0 to 3.0)
- **Label**: `"Hue/Sat H={hue_shift} S=x{saturation_scale}"`
- **Technique**: Convert BGR → HSV, adjust H and S channels, convert back to BGR

#### `GET /color/{session_id}/channel-stats`
- **Purpose**: Return per-channel statistics and histogram data for the Channel panel
- **Read-only**: Does not modify session state
- **Response**:
```json
{
  "red":   { "mean": 128.4, "min": 0, "max": 253, "histogram": [0, 5, 12, ...] },
  "green": { "mean": 112.1, "min": 2, "max": 241, "histogram": [0, 8, 22, ...] },
  "blue":  { "mean": 98.7,  "min": 0, "max": 230, "histogram": [0, 3, 18, ...] }
}
```
- Each `histogram` array contains 256 integer values (pixel count per intensity level)
- Technique: `cv2.calcHist` per channel, `np.min / np.max / np.mean` for stats

---

### 8. Image Segmentation (`/segmentation`)

#### `POST /segmentation/{session_id}/threshold-based`
- **Input**: `{ "threshold": int, "mode": "binary" | "otsu" }`
- **Label**: `"Segmentation: Threshold"`
- **Technique**: Grayscale → threshold → binary mask as result image

#### `POST /segmentation/{session_id}/edge-based`
- **Input**: `{ "threshold1": int, "threshold2": int }`
- **Label**: `"Segmentation: Edge"`
- **Technique**: Canny → `cv2.findContours` → draw contours on original image

#### `POST /segmentation/{session_id}/region-based`
- **Input**: `{ "num_clusters": int }` (2–8)
- **Label**: `"Segmentation: Region (k={num_clusters})"`
- **Technique**: K-means clustering on pixel color values via `cv2.kmeans`, reshape back to image

---

### 9. Image Compression (`/compression`)

#### `POST /compression/{session_id}/save-quality`
- **Input**: `{ "quality": int, "format": "jpeg" | "png" }` (quality: 1–100)
- **Label**: `"Compress {format} q={quality}"`
- **Technique**: Save via Pillow with explicit quality param
- **Response**: standard response + `{ "original_size_kb": float, "compressed_size_kb": float, "ratio": float }`

#### `POST /compression/{session_id}/simulate-jpeg`
- **Input**: `{ "quality": int, "method": "quantization" | "huffman" }` (quality: 1–100)
- **Label**: `"JPEG Simulation q={quality}"`
- **Technique**: Encode to JPEG in-memory (`io.BytesIO`), decode back to show artifacts; update `current.jpg`
- **Response**: standard response + `{ "original_size_kb": float, "compressed_size_kb": float, "ratio": float }`

---

### 10. Histogram Analysis (`/histogram`)

#### `GET /histogram/{session_id}/current`
- **Purpose**: Return histogram data for the current image
- **Read-only**: Does not modify session state
- **Response**:
```json
{
  "grayscale": [0, 12, 45, ...],
  "red":       [0, 5, 30, ...],
  "green":     [0, 8, 22, ...],
  "blue":      [0, 3, 18, ...]
}
```
- Each array: 256 integer values
- Technique: `cv2.calcHist` per channel

#### `GET /histogram/{session_id}/compare`
- **Purpose**: Return histogram for both original and current (Before vs After mode)
- **Read-only**: Does not modify session state
- **Response**:
```json
{
  "original": { "grayscale": [...], "red": [...], "green": [...], "blue": [...] },
  "current":  { "grayscale": [...], "red": [...], "green": [...], "blue": [...] }
}
```

---

### 11. ML Object Recognition (`/ml`) — Bonus Feature

#### `POST /ml/{session_id}/recognize`
- **Purpose**: Run CNN inference on the current image
- **Input**: none (reads `current.jpg` from session)
- **Response**:
```json
{
  "success": true,
  "top_prediction": "cat",
  "predictions": [
    { "label": "cat",  "confidence": 0.92 },
    { "label": "dog",  "confidence": 0.05 },
    { "label": "bird", "confidence": 0.03 }
  ]
}
```

**ML Implementation Notes**:
- Framework: TensorFlow + Keras
- Model file: `models/cnn_model.h5`
- Load model **once at startup** using singleton in `ml_service.py` — never reload per request
- Preprocess: resize to `CNN_INPUT_SIZE` (224×224), normalize pixel values to [0, 1]
- Recommended architecture: MobileNetV2 pretrained on ImageNet
- Return top-5 predictions sorted by confidence descending
- Target object class defined in `config.py` as `CNN_TARGET_CLASS`

---

## Shared Behavior Across All Processing Endpoints

Every image-modifying endpoint must follow this exact flow:

1. Validate `session_id` folder exists — return HTTP 404 if not
2. Read `current.jpg` via `cv2.imread`
3. Apply the requested operation
4. Read `history_meta.json`, get `current_step` → compute `next_step = current_step + 1`
5. If `next_step > MAX_HISTORY_STEPS`, return HTTP 400 "History limit reached. Please reset or undo before continuing."
6. Save result to `history/step_{next_step}.jpg`
7. Overwrite `current.jpg` with result
8. Update `history_meta.json`:
   - Trim `steps` array to only entries where `step <= current_step` (discard redo history)
   - Append `{ "step": next_step, "label": "...", "params": {...} }`
   - Set `current_step = next_step`, `max_step = next_step`
9. Return standard JSON response

All shared logic for steps 1–2 and 4–9 must be implemented as reusable helper functions in `session_service.py`. Routers call these helpers and only implement step 3 (the actual image operation).

---

## Error Response & Log Panel Integration

All error messages are displayed verbatim in the frontend log panel. Write them clearly.

| Scenario | HTTP | `code` | `error` message |
|---|---|---|---|
| Session not found | 404 | `SESSION_NOT_FOUND` | `"Session {id} not found. Please upload an image first."` |
| Invalid file type | 400 | `INVALID_PARAM` | `"File type .gif is not supported. Use JPG, PNG, or BMP."` |
| Even kernel size | 400 | `INVALID_PARAM` | `"Kernel size must be odd. Received: 4"` |
| Crop out of bounds | 400 | `INVALID_PARAM` | `"Crop area (x=10, y=10, w=500, h=300) exceeds image size (400×250)."` |
| Nothing to undo | 400 | `INVALID_PARAM` | `"Nothing to undo. Already at original image."` |
| Nothing to redo | 400 | `INVALID_PARAM` | `"Nothing to redo. Already at latest step."` |
| History limit | 400 | `INVALID_PARAM` | `"History limit reached. Please reset or undo before continuing."` |
| Processing failure | 500 | `PROCESSING_FAILED` | `"Image processing failed: {exception message}"` |

---

## CORS

```python
allow_origins=["*"]
allow_methods=["*"]
allow_headers=["*"]
```

---

## `requirements.txt`

```
fastapi
uvicorn[standard]
opencv-python
pillow
numpy
matplotlib
tensorflow
python-multipart
```

---

## Running the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`