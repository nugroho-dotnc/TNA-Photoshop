# TNA Frontend

Frontend ini adalah aplikasi editor citra berbasis React, TypeScript, dan Vite. Aplikasi terhubung ke backend FastAPI untuk upload gambar, memanggil operasi pengolahan citra, menampilkan canvas, mengelola history, serta menampilkan histogram dan hasil ML recognition.

## Fitur Utama

- Upload gambar untuk memulai session.
- Canvas editor dengan mode free view dan compare.
- Panel parameter untuk enhancement, geometric transform, restoration, binary/edge, color processing, segmentation, dan compression.
- Panel kanan untuk layer/history, histogram, channel, dan CNN recognition.
- Toolbar untuk aksi file, undo, redo, reset, dan kontrol canvas.
- Log panel untuk mencatat aksi dan error.

## Tech Stack

- React
- TypeScript
- Vite
- Axios
- Tailwind CSS
- Recharts
- Lucide React
- ESLint

## Cara Setup Aplikasi

Pastikan Node.js dan npm sudah terpasang.

1. Masuk ke folder frontend.

```bash
cd TNA-FE
```

2. Install dependency.

```bash
npm install
```

3. Buat file `.env` jika ingin mengatur URL backend secara eksplisit.

```bash
VITE_API_URL=http://localhost:8000
```

Jika `.env` tidak dibuat, aplikasi otomatis memakai:

```text
http://localhost:8000
```

4. Jalankan development server.

```bash
npm run dev
```

5. Buka aplikasi di browser.

```text
http://localhost:5173
```

Pastikan backend juga berjalan di `http://localhost:8000`.

## Script yang Tersedia

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite dev server. |
| `npm run build` | Type check dan build aplikasi production ke folder `dist/`. |
| `npm run lint` | Menjalankan ESLint. |
| `npm run preview` | Preview hasil build production. |

## Struktur Aplikasi

```text
TNA-FE/
|-- index.html
|-- package.json
|-- vite.config.ts
|-- tailwind.config.js
|-- public/
|   |-- favicon.svg
|   `-- icons.svg
|-- src/
|   |-- main.tsx
|   |-- App.tsx
|   |-- index.css
|   |-- App.css
|   |-- api/
|   |-- assets/
|   |-- components/
|   |-- context/
|   |-- hooks/
|   `-- utils/
`-- README.md
```

## Penjelasan Folder `src`

| Folder/File | Fungsi |
| --- | --- |
| `main.tsx` | Entry point React, render aplikasi ke DOM. |
| `App.tsx` | Komposisi provider dan layout utama editor. |
| `api/` | Wrapper request Axios untuk setiap domain fitur backend. |
| `api/axios.ts` | Konfigurasi base URL, timeout, dan interceptor error API. |
| `components/common/` | Komponen UI reusable seperti button, modal, dropdown, slider, tabs, toggle, spinner. |
| `components/layout/` | Layout utama: toolbar, left panel, canvas area, right panel, dan log panel. |
| `components/canvas/` | Komponen canvas untuk menampilkan gambar, compare view, dan crop overlay. |
| `components/landing/` | Tampilan awal upload gambar. |
| `components/panels/left/` | Panel pilihan fitur dan parameter operasi citra. |
| `components/panels/right/` | Panel layer/history, histogram, channel, dan CNN. |
| `components/toolbar/` | Komponen pendukung toolbar seperti file menu dan toggle tab canvas. |
| `context/` | State global untuk session, history, dan log. |
| `hooks/` | Hook orchestration seperti upload, reset, undo, redo, jump, refresh history, dan apply feature. |
| `utils/` | Helper untuk image URL/cache busting dan log. |
| `assets/` | Asset lokal seperti gambar hero atau icon bawaan. |

## Alur Kerja Frontend

1. User upload gambar dari `UploadZone`.
2. FE mengirim file ke `POST /session/upload`.
3. Backend mengembalikan `session_id`, `current_url`, dan `original_url`.
4. FE menyimpan data session ke `SessionContext`.
5. FE mengambil history dari `GET /session/{session_id}/history`.
6. User memilih fitur dan parameter di left panel.
7. FE memanggil API sesuai fitur, misalnya `/enhance/{session_id}/brightness`.
8. Backend mengembalikan `current_url` dan `step` terbaru.
9. FE refresh gambar dengan cache busting dan memperbarui history/log.

## Integrasi dengan Backend

Konfigurasi API ada di `src/api/axios.ts`.

```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})
```

Semua request fitur dikelompokkan di folder `src/api/`, misalnya:

- `sessionApi.ts` untuk upload, reset, undo, redo, history, dan save image.
- `enhancementApi.ts` untuk brightness, contrast, histogram equalization, sharpen, dan smooth.
- `geometricApi.ts` untuk rotate, flip, crop, resize, dan translate.
- `restorationApi.ts` untuk gaussian blur, median filter, dan noise removal.
- `binaryEdgeApi.ts` untuk threshold, edge detection, dan morphology.
- `colorApi.ts` untuk grayscale, split channel, hue/saturation, dan histogram.
- `segmentationApi.ts` untuk threshold, edge, dan region segmentation.
- `compressionApi.ts` untuk save quality dan simulate JPEG.
- `histogramApi.ts` untuk histogram current dan compare.
- `mlApi.ts` untuk recognition.

## State Management

Aplikasi menggunakan React Context dan hook lokal.

| Context/Hook | Fungsi |
| --- | --- |
| `SessionContext` | Menyimpan `sessionId`, URL gambar, loading state, active feature, canvas tab, channel view, dan crop state. |
| `HistoryContext` | Menyimpan step aktif, max step, dan daftar step history. |
| `LogContext` | Menyimpan pesan sukses, info, dan error untuk log panel. |
| `useSessionActions` | Mengelola upload, reset, undo, redo, jump, dan refresh history. |
| `useApply` | Pola generic untuk menjalankan operasi fitur dan refresh gambar/history. |

## Build Production

```bash
npm run build
```

Hasil build akan berada di:

```text
dist/
```

Untuk preview hasil build:

```bash
npm run preview
```

## Rekomendasi Isi Tambahan

Bagian berikut direkomendasikan jika proyek akan dikembangkan atau dikumpulkan sebagai dokumentasi final:

- Screenshot halaman upload, editor, panel parameter, histogram, dan compare view.
- Daftar fitur lengkap beserta parameter yang tersedia di UI.
- Mapping fitur UI ke endpoint backend.
- Penjelasan desain state management dan alasan memakai Context.
- Catatan validasi input di sisi UI.
- Dokumentasi environment variable.
- Panduan troubleshooting koneksi FE-BE dan CORS.
- Panduan kontribusi: naming komponen, struktur API client, dan cara menambah fitur baru.
- Testing plan untuk komponen utama dan flow upload sampai apply fitur.

## Troubleshooting Singkat

- Jika gambar tidak tampil setelah upload, pastikan backend berjalan dan `VITE_API_URL` benar.
- Jika request timeout, cek apakah operasi backend berat atau model ML sedang load.
- Jika muncul error CORS, pastikan middleware CORS backend mengizinkan origin frontend.
- Jika build gagal, jalankan `npm run lint` dan cek error TypeScript dari `npm run build`.
