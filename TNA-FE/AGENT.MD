# Agent Instructions: Mini Photoshop — Frontend

## Project Overview

Build the **frontend application** for "Mini Photoshop", a digital image processing application. The frontend communicates with a FastAPI backend via Axios, manages session state locally via React Context + useReducer, and renders a professional dark-themed editor interface.

---

## Tech Stack

| Aspect | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Components | Custom (no component library) |
| State Management | React Context + useReducer |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | lucide-react |
| Font | Plus Jakarta Sans (Google Fonts) |
| Theme | Dark (editor-like) |

---

## Font Setup

Import Plus Jakarta Sans from Google Fonts in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

Set as default font in `tailwind.config.js`:

```js
theme: {
  extend: {
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', 'sans-serif'],
    }
  }
}
```

---

## Dark Theme Color Tokens

Define these in `tailwind.config.js` under `extend.colors`:

```js
colors: {
  surface: {
    DEFAULT: '#0f0f0f',   // app background
    1: '#1a1a1a',         // panel background
    2: '#222222',         // card / section background
    3: '#2a2a2a',         // input / hover background
    4: '#333333',         // border / divider
  },
  accent: {
    DEFAULT: '#4f8ef7',   // primary blue
    hover: '#6ba3ff',     // hover state
    muted: '#1e3a6e',     // subtle accent background
  },
  text: {
    primary: '#f0f0f0',
    secondary: '#a0a0a0',
    muted: '#606060',
  },
  status: {
    error: '#f87171',
    warn: '#fbbf24',
    success: '#4ade80',
    info: '#60a5fa',
  }
}
```

---

## Project Structure

```
mini-photoshop-fe/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── context/
│   │   ├── SessionContext.jsx
│   │   ├── HistoryContext.jsx
│   │   └── LogContext.jsx
│   │
│   ├── hooks/
│   │   ├── useSession.js
│   │   ├── useHistogram.js
│   │   ├── useChannelStats.js
│   │   ├── useEnhancement.js
│   │   ├── useGeometric.js
│   │   ├── useRestoration.js
│   │   ├── useBinaryEdge.js
│   │   ├── useColor.js
│   │   ├── useSegmentation.js
│   │   ├── useCompression.js
│   │   └── useML.js
│   │
│   ├── api/
│   │   ├── axios.js
│   │   ├── sessionApi.js
│   │   ├── enhancementApi.js
│   │   ├── geometricApi.js
│   │   ├── restorationApi.js
│   │   ├── binaryEdgeApi.js
│   │   ├── colorApi.js
│   │   ├── segmentationApi.js
│   │   ├── compressionApi.js
│   │   ├── histogramApi.js
│   │   └── mlApi.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Toolbar.jsx
│   │   │   ├── LeftPanel.jsx
│   │   │   ├── CanvasArea.jsx
│   │   │   ├── RightPanel.jsx
│   │   │   └── LogPanel.jsx
│   │   │
│   │   ├── toolbar/
│   │   │   ├── FileMenu.jsx
│   │   │   ├── ToolbarButton.jsx
│   │   │   └── CanvasTabToggle.jsx
│   │   │
│   │   ├── canvas/
│   │   │   ├── FreeCanvas.jsx
│   │   │   ├── CompareCanvas.jsx
│   │   │   └── CropOverlay.jsx
│   │   │
│   │   ├── panels/
│   │   │   ├── left/
│   │   │   │   ├── ParameterPanel.jsx
│   │   │   │   └── params/
│   │   │   │       ├── BrightnessParams.jsx
│   │   │   │       ├── ContrastParams.jsx
│   │   │   │       ├── HistogramEqParams.jsx
│   │   │   │       ├── SharpenParams.jsx
│   │   │   │       ├── SmoothParams.jsx
│   │   │   │       ├── RotateParams.jsx
│   │   │   │       ├── FlipParams.jsx
│   │   │   │       ├── CropParams.jsx
│   │   │   │       ├── ResizeParams.jsx
│   │   │   │       ├── TranslateParams.jsx
│   │   │   │       ├── GaussianBlurParams.jsx
│   │   │   │       ├── MedianFilterParams.jsx
│   │   │   │       ├── NoiseRemovalParams.jsx
│   │   │   │       ├── ThresholdParams.jsx
│   │   │   │       ├── EdgeDetectionParams.jsx
│   │   │   │       ├── MorphologyParams.jsx
│   │   │   │       ├── GrayscaleParams.jsx
│   │   │   │       ├── HueSaturationParams.jsx
│   │   │   │       ├── ThresholdSegParams.jsx
│   │   │   │       ├── EdgeSegParams.jsx
│   │   │   │       ├── RegionSegParams.jsx
│   │   │   │       ├── SaveQualityParams.jsx
│   │   │   │       └── SimulateJpegParams.jsx
│   │   │   │
│   │   │   └── right/
│   │   │       ├── RightPanel.jsx          ← tab container
│   │   │       ├── HistogramTab.jsx
│   │   │       ├── HistogramChart.jsx
│   │   │       ├── LayerPanel.jsx
│   │   │       ├── ChannelTab.jsx
│   │   │       ├── ChannelSelector.jsx
│   │   │       ├── ChannelChart.jsx
│   │   │       └── CnnTab.jsx
│   │   │
│   │   ├── landing/
│   │   │   └── UploadZone.jsx
│   │   │
│   │   └── common/
│   │       ├── Slider.jsx
│   │       ├── Dropdown.jsx
│   │       ├── Button.jsx
│   │       ├── Toggle.jsx
│   │       ├── Modal.jsx
│   │       ├── Spinner.jsx
│   │       └── Tabs.jsx
│   │
│   └── utils/
│       ├── imageHelpers.js
│       └── logHelpers.js
│
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## package.json dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Axios Setup (`src/api/axios.js`)

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

// Response interceptor — push errors to LogContext
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Unknown error'
    // Dispatch to LogContext via custom event (decoupled from React tree)
    window.dispatchEvent(new CustomEvent('api:error', { detail: message }))
    return Promise.reject(error)
  }
)

export default api
```

`VITE_API_URL` is set in `.env`:
```
VITE_API_URL=http://localhost:8000
```

---

## Context Design

### `SessionContext`

```jsx
// State shape
const initialState = {
  sessionId: null,
  currentUrl: null,
  originalUrl: null,
  isLoading: false,
  activeFeature: null,     // string key e.g. "brightness", "rotate", "canny"
  canvasTab: 'free',       // 'free' | 'compare'
  channelView: 'rgb',      // 'rgb' | 'r' | 'g' | 'b'
  cropMode: false,         // true when user activates crop tool
  pendingCrop: null,       // { x, y, width, height } from canvas selection
}

// Actions
// SET_SESSION       → { sessionId, currentUrl, originalUrl }
// SET_LOADING       → boolean
// SET_ACTIVE_FEATURE → string | null
// SET_CANVAS_TAB    → 'free' | 'compare'
// SET_CHANNEL_VIEW  → 'rgb' | 'r' | 'g' | 'b'
// SET_CROP_MODE     → boolean
// SET_PENDING_CROP  → { x, y, width, height } | null
// REFRESH_CURRENT   → new currentUrl with cache-bust timestamp
// CLEAR_SESSION     → reset to initialState
```

### `HistoryContext`

```jsx
// State shape
const initialState = {
  currentStep: 0,
  maxStep: 0,
  steps: [],        // [{ step, label, params }] from BE
  canUndo: false,
  canRedo: false,
}

// Actions
// SET_HISTORY  → { currentStep, maxStep, steps }
// SYNC_STEP    → { step } — update currentStep after undo/redo/jump
```

### `LogContext`

```jsx
// State shape
const initialState = {
  isVisible: false,
  entries: [],      // [{ id, level, timestamp, message }]
}

// Actions
// ADD_LOG      → { level: 'info'|'warn'|'error'|'success', message: string }
// TOGGLE_LOG   → toggle isVisible
// SHOW_LOG     → force isVisible = true (called on ERROR)
// CLEAR_LOG    → empty entries array

// level 'error' must also dispatch SHOW_LOG automatically
```

---

## App Layout Structure (`App.jsx`)

```jsx
// Conditional render:
// - If sessionId is null → show <UploadZone />
// - If sessionId exists  → show full editor layout

<SessionProvider>
  <HistoryProvider>
    <LogProvider>
      {!sessionId ? (
        <UploadZone />
      ) : (
        <div className="flex flex-col h-screen bg-surface text-text-primary font-sans overflow-hidden">
          <Toolbar />
          <div className="flex flex-1 overflow-hidden">
            <LeftPanel />
            <CanvasArea />
            <RightPanel />
          </div>
          <LogPanel />
        </div>
      )}
    </LogProvider>
  </HistoryProvider>
</SessionProvider>
```

---

## Component Specifications

### `UploadZone`
- Full screen centered layout on `bg-surface`
- App name "Mini Photoshop" as heading using `text-text-primary font-bold`
- Dashed border drop zone with `border-surface-4 hover:border-accent` transition
- Icon: `lucide-react` → `Upload` icon centered inside drop zone
- Supports drag & drop and click-to-browse
- On file drop/select: validate extension (jpg, jpeg, png, bmp) client-side first
- On valid file: call `POST /session/upload`, dispatch `SET_SESSION` to context
- On invalid file: add ERROR log entry
- Show `<Spinner />` while uploading

---

### `Toolbar`
- Fixed height bar `h-12 bg-surface-1 border-b border-surface-4`
- Left section: `[📁 File]` dropdown button using `FileMenu` component
- Center section: feature group buttons — Enhance, Geometric, Filter, Color, Segment, Compress, ML
  - Each button: `ToolbarButton` component, highlights when `activeFeature` belongs to its group
  - Icon from lucide-react per group:
    - Enhance → `SunMedium`
    - Geometric → `Move`
    - Filter → `Layers`
    - Color → `Palette`
    - Segment → `Scissors`
    - Compress → `FileArchive`
    - ML → `Brain`
- Right section: `CanvasTabToggle` — two tab pills: "Free Canvas" | "Compare"
- Bottom bar: `[ ↩ Undo ] [ ↪ Redo ] [ ⟳ Reset ]` + `step {currentStep} / {maxStep}` indicator
  - Undo icon: `Undo2`, Redo icon: `Redo2`, Reset icon: `RotateCcw`
  - Undo/Redo buttons disabled when `canUndo`/`canRedo` is false

---

### `FileMenu`
- Dropdown triggered by clicking `[📁 File]` button
- Icon: `FolderOpen` from lucide-react
- Menu items:
  - `📂 Open New Image` — triggers file picker, on select shows confirmation modal if session exists
  - `💾 Save / Export` — opens export modal
- Confirmation modal content: "Current image will be replaced. Save first?" with buttons `[Save First]` and `[Continue]`
- Export modal fields: Filename (text input), Format (dropdown: JPG/PNG/BMP), Quality (slider 1–100, only visible for JPG)

---

### `LeftPanel`
- Fixed width `w-64 bg-surface-1 border-r border-surface-4 flex flex-col`
- Top: label showing active feature name, or placeholder "Select a tool" when none active
- Middle (scrollable): renders `<ParameterPanel />` based on `activeFeature`
- Bottom: `[ Apply ]` button — `bg-accent hover:bg-accent-hover text-white w-full`
  - Disabled and grayed out when no feature is active or when `isLoading` is true
  - Shows `<Spinner />` inside button while loading

---

### `ParameterPanel`
- Dynamically renders the correct params component based on `activeFeature`
- Map of `activeFeature` key → params component:

| activeFeature | Component |
|---|---|
| `brightness` | `BrightnessParams` |
| `contrast` | `ContrastParams` |
| `histogram-eq` | `HistogramEqParams` |
| `sharpen` | `SharpenParams` |
| `smooth` | `SmoothParams` |
| `rotate` | `RotateParams` |
| `flip` | `FlipParams` |
| `crop` | `CropParams` |
| `resize` | `ResizeParams` |
| `translate` | `TranslateParams` |
| `gaussian-blur` | `GaussianBlurParams` |
| `median-filter` | `MedianFilterParams` |
| `noise-removal` | `NoiseRemovalParams` |
| `threshold` | `ThresholdParams` |
| `edge-detection` | `EdgeDetectionParams` |
| `morphology` | `MorphologyParams` |
| `grayscale` | `GrayscaleParams` |
| `hue-saturation` | `HueSaturationParams` |
| `seg-threshold` | `ThresholdSegParams` |
| `seg-edge` | `EdgeSegParams` |
| `seg-region` | `RegionSegParams` |
| `compression-quality` | `SaveQualityParams` |
| `compression-jpeg` | `SimulateJpegParams` |

- Each params component manages its own local state for parameter values
- On Apply click (from LeftPanel), params component exposes a `getParams()` method via `useImperativeHandle` ref, which LeftPanel calls to collect values before dispatching the API call

---

### `CanvasArea`
- Fills remaining space `flex-1 bg-surface overflow-hidden relative`
- Renders either `<FreeCanvas />` or `<CompareCanvas />` based on `canvasTab`

---

### `FreeCanvas`
- Renders current image from `currentUrl`
- Image cache-busting: append `?t={Date.now()}` to URL on every refresh
- **Pan**: mouse drag moves image position (transform: translate)
- **Zoom**: scroll wheel scales image (transform: scale), clamped between 0.1× and 10×
- **Crop mode** (when `cropMode === true`):
  - Cursor changes to crosshair
  - Mouse drag draws a selection rectangle overlay (`<CropOverlay />`)
  - On mouse up: dispatch `SET_PENDING_CROP` with `{ x, y, width, height }` in image pixel coordinates (convert from screen coords using current scale/translate)
  - Auto-populate `CropParams` fields via context
- When `channelView !== 'rgb'`: display channel preview image from `split-channels` endpoint instead of `currentUrl`

---

### `CompareCanvas`
- Split view: left half = `originalUrl`, right half = `currentUrl`
- Both images same size, displayed side by side with a center divider line
- Labels: "BEFORE" (left) and "AFTER" (right) in `text-text-muted text-xs`
- Not interactive (no pan/zoom/crop)

---

### `CropOverlay`
- Absolutely positioned SVG or div overlay on top of `FreeCanvas`
- Shows semi-transparent dark mask outside selection area
- Selection rectangle shown with dashed white border
- Corner handles (small squares) at each corner for visual affordance

---

### `RightPanel`
- Fixed width `w-72 bg-surface-1 border-l border-surface-4 flex flex-col`
- Three tabs at top: `Histogram` | `Channel` | `CNN`
- Tab icons from lucide-react: `BarChart2` | `Layers` | `Brain`
- Active tab underline with `border-b-2 border-accent`
- Tab content fills remaining height

---

### `HistogramTab`
Upper section — Histogram chart:
- Toggle between "Current" and "Before / After" mode using a small toggle pill
- "Current" mode: fetch `GET /histogram/{id}/current`, render single `<HistogramChart />`
- "Before/After" mode: fetch `GET /histogram/{id}/compare`, render two `<HistogramChart />` side by side
- Channel checkboxes: Gray | R | G | B — toggle visibility of each line in chart
- Auto-refresh histogram after every successful Apply operation

Lower section — Layer panel:
- Scrollable list of history steps
- Each item: step number + label (from `history_meta.json`) + params summary
- Active step highlighted with `bg-accent-muted border-l-2 border-accent`
- Past steps: `text-text-secondary`
- Click any step → call `POST /session/{id}/jump` → update canvas
- "original" entry always at bottom of list
- Icon per step type using lucide-react:
  - Brightness/Contrast/Sharpen/Smooth → `SunMedium`
  - Rotate/Flip/Crop/Resize/Translate → `Move`
  - Gaussian/Median/Noise → `Wind`
  - Threshold/Edge/Morphology → `Scan`
  - Grayscale/Hue/Sat → `Palette`
  - Segmentation → `Scissors`
  - Compression → `FileArchive`
  - Original → `ImageIcon`

---

### `HistogramChart`
- Uses Recharts `AreaChart` or `LineChart`
- X axis: 0–255 (intensity values), hidden tick labels to save space
- Y axis: pixel count, hidden
- One line/area per active channel (Gray = white, R = red, G = green, B = blue)
- Tooltip on hover showing intensity and count
- Responsive via `<ResponsiveContainer width="100%" height={120} />`
- Filled area with low opacity (0.15) per channel color

---

### `ChannelTab`
- Channel selector buttons at top: `[R] [G] [B] [RGB]`
  - Active button: `bg-accent text-white`
  - Inactive: `bg-surface-3 text-text-secondary`
  - Clicking R/G/B: dispatch `SET_CHANNEL_VIEW`, trigger `POST /color/{id}/split-channels`, render preview in FreeCanvas
  - Clicking RGB: dispatch `SET_CHANNEL_VIEW` → 'rgb', restore `currentUrl` in FreeCanvas
- Below selector: fetch `GET /color/{id}/channel-stats` and render three `<ChannelChart />` components
- Each `ChannelChart`: small bar chart (Recharts `BarChart`) for that channel's 256-value histogram
  - Color: red / green / blue respectively
  - Below chart: stats row — `mean: {x}  min: {x}  max: {x}`
  - Height: `h-20` each
- Auto-refresh channel stats after every successful Apply

---

### `CnnTab`
- Model info row: `Model: MobileNetV2` | `Target: {CNN_TARGET_CLASS}`
- Large centered `[ ▶ Run Recognition ]` button
  - Icon: `Play` from lucide-react
  - On click: call `POST /ml/{id}/recognize`, show `<Spinner />` while loading
- Results section (hidden until first run):
  - Top prediction badge: large label + confidence percentage
  - List of top 5 predictions with confidence bar (div width % relative to confidence)
  - Bar colors: gold for 1st, silver for 2nd, others `bg-accent-muted`

---

### `LogPanel`
- Fixed height bottom bar, collapsible
- **Collapsed state** (default): single row `h-7 bg-surface-1 border-t border-surface-4`
  - Shows: `LOG  ▼ Show` button on right using `ChevronUp` icon
  - If last entry is error: show abbreviated error message in collapsed bar with `text-status-error`
- **Expanded state**: `h-40` with scrollable log list
  - Header row: `LOG` label + `▲ Hide` button using `ChevronDown` icon + `🗑 Clear` button
  - Each log entry row:
    - Icon: `Info` (info/blue), `AlertTriangle` (warn/yellow), `XCircle` (error/red), `CheckCircle2` (success/green)
    - Timestamp in `text-text-muted text-xs`
    - Message in appropriate status color
  - Auto-scroll to bottom on new entry
  - Auto-expand when a new ERROR entry is added

---

## Custom Common Components

### `Slider`
```jsx
// Props: label, min, max, step, value, onChange, unit (optional suffix e.g. "°", "%")
// Renders: label row with current value, then native <input type="range" />
// Styling: thumb accent color, track surface-4
```

### `Dropdown`
```jsx
// Props: label, options [{ value, label }], value, onChange
// Custom styled select, not native <select>
// Opens downward, bg-surface-2, border-surface-4
```

### `Button`
```jsx
// Props: variant ('primary'|'ghost'|'danger'), size ('sm'|'md'), icon, disabled, loading, onClick, children
// primary: bg-accent hover:bg-accent-hover text-white
// ghost: bg-transparent hover:bg-surface-3 text-text-secondary
// danger: bg-red-900 hover:bg-red-800 text-status-error
```

### `Toggle`
```jsx
// Props: value (bool), onChange, label
// Pill toggle switch, accent color when active
```

### `Spinner`
```jsx
// Animated circular spinner using Tailwind animate-spin
// Sizes: sm (w-4 h-4), md (w-6 h-6), lg (w-10 h-10)
// Color: border-accent
```

### `Tabs`
```jsx
// Props: tabs [{ key, label, icon }], activeTab, onChange
// Reusable tab bar used by both RightPanel and HistogramTab internal toggle
```

---

## Hooks Design

Each hook encapsulates API calls + context dispatch + log dispatch.

### `useSession`
```js
// Returns: { upload, reset, undo, redo, jump }
// upload(file)     → POST /session/upload → dispatch SET_SESSION + SET_HISTORY
// reset()          → POST /session/{id}/reset → dispatch REFRESH_CURRENT + SET_HISTORY
// undo()           → POST /session/{id}/undo → dispatch SYNC_STEP + REFRESH_CURRENT
// redo()           → POST /session/{id}/redo → dispatch SYNC_STEP + REFRESH_CURRENT
// jump(step)       → POST /session/{id}/jump → dispatch SYNC_STEP + REFRESH_CURRENT
```

### Feature Hooks (useEnhancement, useGeometric, etc.)
Each hook returns action functions. Every action:
1. Dispatches `SET_LOADING: true`
2. Calls the API endpoint
3. On success: dispatches `REFRESH_CURRENT`, fetches updated history, adds INFO log
4. On error: adds ERROR log (interceptor handles this automatically)
5. Dispatches `SET_LOADING: false`

```js
// useEnhancement returns:
// { applyBrightness, applyContrast, applyHistogramEq, applySharpen, applySmooth }

// useGeometric returns:
// { applyRotate, applyFlip, applyCrop, applyResize, applyTranslate }

// useRestoration returns:
// { applyGaussianBlur, applyMedianFilter, applyNoiseRemoval }

// useBinaryEdge returns:
// { applyThreshold, applyEdgeDetection, applyMorphology }

// useColor returns:
// { applyGrayscale, applySplitChannel, applyHueSaturation, fetchChannelStats }

// useSegmentation returns:
// { applyThresholdSeg, applyEdgeSeg, applyRegionSeg }

// useCompression returns:
// { applySaveQuality, applySimulateJpeg }

// useHistogram returns:
// { fetchCurrent, fetchCompare }

// useML returns:
// { runRecognition }
```

---

## Image Cache Busting

Every time `currentUrl` is refreshed after an operation, append a timestamp query param to force browser to re-fetch:

```js
// In imageHelpers.js
export const bustCache = (url) => `${url}?t=${Date.now()}`
```

Use `bustCache(currentUrl)` wherever the current image is rendered in `<img src />`.

---

## API Modules

All api files call the shared `axios.js` instance. Example pattern:

```js
// enhancementApi.js
import api from './axios'

export const applyBrightness = (sessionId, value) =>
  api.post(`/enhance/${sessionId}/brightness`, { value })

export const applyContrast = (sessionId, value) =>
  api.post(`/enhance/${sessionId}/contrast`, { value })

export const applyHistogramEq = (sessionId) =>
  api.post(`/enhance/${sessionId}/histogram-equalization`)

export const applySharpen = (sessionId, intensity) =>
  api.post(`/enhance/${sessionId}/sharpen`, { intensity })

export const applySmooth = (sessionId, kernel_size) =>
  api.post(`/enhance/${sessionId}/smooth`, { kernel_size })
```

All other API modules follow the same pattern matching the BE endpoints defined in `agent.md`.

---

## Log Entry Format

```js
// logHelpers.js
export const createLog = (level, message) => ({
  id: crypto.randomUUID(),
  level,           // 'info' | 'warn' | 'error' | 'success'
  timestamp: new Date().toLocaleTimeString(),
  message,
})
```

Log messages to use:
- Upload success: `"Session started. Image loaded successfully."`
- Apply success: `"Applied: {label} — step {N}"`
- Undo: `"Undo — reverted to step {N}"`
- Redo: `"Redo — moved to step {N}"`
- Reset: `"Reset — restored to original image."`
- Jump: `"Jumped to step {N}: {label}"`
- CNN result: `"Recognition complete — top prediction: {label} ({confidence}%)"`
- Error: verbatim from `error.response.data.error`

---

## Responsive Behavior

This is a desktop-first application. Minimum supported viewport: **1280px wide**.
No mobile layout required. Panels have fixed widths; canvas area fills the remainder.

---

## Running the App

```bash
npm install
npm run dev
```

App runs at: `http://localhost:5173`

Ensure `VITE_API_URL` in `.env` points to the running FastAPI backend.