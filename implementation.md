# Implementation Plan - Integrasi TNA-BE dan TNA-FE

Status: implemented in code after review request.

Dokumen ini adalah hasil audit integrasi statis antara `TNA-BE` dan `TNA-FE`. Belum ada implementasi kode yang dilakukan. Tujuannya agar perubahan bisa direview dulu sebelum diterapkan.

## Ringkasan

Integrasi endpoint dasar antara frontend dan backend sebagian besar sudah cocok: path upload, session action, enhancement, geometric, restoration, binary/edge, segmentation, compression, histogram, save/export, dan ML sudah mengarah ke route yang ada di backend.

Namun ada beberapa masalah yang kemungkinan membuat fitur utama gagal saat dipakai:

1. Hampir semua endpoint pemrosesan gambar di backend akan error karena pemanggilan `save_step` tidak sesuai signature.
2. Response ML backend tidak cocok dengan field yang dibaca frontend.
3. Fitur Channel tab di frontend memperlakukan split channel seperti mode preview, padahal backend memutasikan image dan menambah history step.
4. Model ML belum tersedia di `TNA-BE/models/cnn_model.h5`, sehingga endpoint recognition akan mengembalikan 503 sampai model ditambahkan.
5. Verifikasi build/runtime belum bisa dijalankan di environment saat audit karena command `npm`, `python`, dan `py` tidak tersedia; `node_modules/.bin/tsc.cmd` serta `.venv/Scripts/python.exe` juga terkena `Access is denied`.

## Temuan Detail

### 1. Backend processing endpoint gagal karena `save_step` wajib menerima `label`

Lokasi:

- `TNA-BE/services/session_service.py:129`
- `TNA-BE/services/session_service.py:132`
- Contoh caller: `TNA-BE/routers/enhancement.py:37`
- Caller lain: `TNA-BE/routers/geometric.py`, `binary_edge.py`, `color_processing.py`, `segmentation.py`, `restoration.py`, `compression.py`

`save_step` didefinisikan seperti ini:

```python
def save_step(session_id: str, img: np.ndarray, label: str, params: Optional[Dict[str, Any]] = None) -> int:
```

Tetapi hampir semua router memanggil:

```python
ss.save_step(session_id, result)
```

Dampak:

- Operasi seperti brightness, rotate, crop, grayscale, threshold, blur, segmentation, compression kemungkinan mengembalikan HTTP 500.
- Frontend `useApply` menunggu response berisi `current_url` dan `step`, tapi response itu tidak pernah sampai karena backend error.
- Layer/history panel juga tidak akan mendapat label operasi.

Rencana perbaikan:

- Tambahkan `label` dan `params` pada setiap pemanggilan `ss.save_step`.
- Gunakan label yang konsisten dengan nama fitur frontend, misalnya `Brightness`, `Contrast`, `Rotate`, `Crop`, `Gaussian Blur`, `Threshold`, dan seterusnya.
- Isi `params` dari request body agar Layer panel dan history metadata informatif.
- Alternatif minimal: beri default `label="Operation"` di `save_step`, tetapi ini kurang bagus karena history kehilangan konteks. Rekomendasi: update caller satu per satu.

### 2. Response ML tidak cocok dengan frontend

Lokasi:

- Backend: `TNA-BE/services/ml_service.py:130`
- Backend route: `TNA-BE/routers/ml_recognition.py:22`
- Frontend: `TNA-FE/src/components/panels/right/CnnTab.tsx:15`
- Frontend usage: `TNA-FE/src/components/panels/right/CnnTab.tsx:33`, `:64`, `:65`

Backend mengembalikan:

```json
{
  "success": true,
  "predictions": [
    { "label": "...", "confidence": 0.9 }
  ],
  "top_prediction": "..."
}
```

Frontend membaca:

```ts
top_label: string
top_confidence: number
```

Dampak:

- `result.top_label` menjadi `undefined`.
- `Math.round(result.top_confidence * 100)` menjadi `NaN`.
- Log dan UI Top Prediction tidak tampil benar, walaupun backend berhasil inference.

Rencana perbaikan:

- Pilih satu kontrak response.
- Rekomendasi: backend mengirim field tambahan yang frontend butuhkan:

```json
{
  "success": true,
  "top_label": "...",
  "top_confidence": 0.9,
  "predictions": [...]
}
```

- Bisa tetap mempertahankan `top_prediction` sementara untuk backward compatibility.

### 3. Channel tab memutasikan gambar saat user hanya memilih channel view

Lokasi:

- `TNA-FE/src/components/panels/right/ChannelTab.tsx:80`
- `TNA-FE/src/components/panels/right/ChannelTab.tsx:84`
- `TNA-FE/src/components/panels/right/ChannelTab.tsx:86`
- Backend endpoint: `TNA-BE/routers/color_processing.py:55`

Frontend mengubah channel view dengan memanggil:

```ts
applySplitChannel(state.sessionId, apiCh)
```

Backend endpoint `/color/{session_id}/split-channels` bukan preview endpoint. Endpoint ini menyimpan hasil sebagai image baru lewat `save_step`, sehingga current image berubah permanen dan history bertambah.

Dampak:

- Klik `R`, lalu `G`, lalu `B` akan memproses hasil channel sebelumnya, bukan image RGB asli.
- Klik `RGB` hanya melakukan cache bust pada `state.currentUrl`; itu tidak mengembalikan image ke kondisi sebelum split.
- History frontend tidak di-refresh setelah split channel dari Channel tab, sehingga backend history dan frontend Layer panel bisa tidak sinkron.

Rencana perbaikan:

- Tentukan perilaku yang diinginkan:
  - Jika Channel tab hanya untuk preview, jangan panggil endpoint mutating. Buat endpoint read-only seperti `GET /color/{session_id}/channel-preview?channel=R` atau lakukan preview di frontend canvas.
  - Jika split channel memang operasi edit permanen, pindahkan kontrol ini ke flow `useApply`, refresh history setelah sukses, dan ubah copy/UI agar jelas sebagai operasi.
- Rekomendasi: jadikan Channel tab sebagai preview non-mutating, karena UI-nya saat ini berbentuk selector view.

### 4. ML model belum ada

Lokasi:

- `TNA-BE/config.py:13`
- `TNA-BE/main.py:49`
- `TNA-BE/services/ml_service.py:88`
- Folder saat audit: `TNA-BE/models` hanya berisi `.gitkeep`

Backend mencari model di:

```text
TNA-BE/models/cnn_model.h5
```

Dampak:

- Saat startup, backend memberi warning model tidak ditemukan.
- Endpoint `/ml/{session_id}/recognize` akan mengembalikan 503 dengan pesan bahwa model belum loaded.

Rencana perbaikan:

- Tambahkan file model `cnn_model.h5` dan opsional `labels.txt`.
- Atau, jika model belum masuk scope, frontend perlu menampilkan state "model unavailable" dengan pesan yang ramah saat menerima HTTP 503.

### 5. Error response backend belum seragam

Lokasi contoh:

- `TNA-BE/routers/session.py` memakai `detail: { success, error, code }`
- Banyak router lain memakai `detail: "string"`
- Frontend interceptor: `TNA-FE/src/api/axios.ts`

Frontend interceptor sudah cukup fleksibel:

```ts
const detail = error.response?.data?.detail
const message = (typeof detail === 'object' ? detail?.error : detail) || error.message
```

Dampak:

- Tidak langsung memblokir integrasi.
- Namun format error tidak konsisten untuk UI/logging dan debugging.

Rencana perbaikan:

- Standarkan error backend menjadi bentuk:

```json
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE"
}
```

- Terapkan helper `_err` di semua router, minimal untuk `FileNotFoundError`, validasi, dan processing error.

## Rencana Implementasi Yang Direkomendasikan

1. Perbaiki `save_step` usage di semua router backend.
   - Tambahkan label operasi dan params.
   - Pastikan setiap operasi mengembalikan `{ success, session_id, current_url, step, message }`.

2. Perbaiki kontrak ML response.
   - Tambahkan `top_label` dan `top_confidence` dari prediction pertama.
   - Pertahankan `predictions`.
   - Opsional pertahankan `top_prediction`.

3. Rapikan Channel tab.
   - Pilih mode preview non-mutating atau operasi edit permanen.
   - Rekomendasi preview non-mutating agar sesuai UX selector channel.
   - Jika tetap mutating, integrasikan dengan `useApply` dan `refreshHistory`.

4. Tambahkan handling model unavailable di frontend.
   - Saat `/ml/{session_id}/recognize` mengembalikan 503, tampilkan pesan bahwa model belum tersedia.

5. Standarkan error shape backend.
   - Gunakan helper error response yang sama lintas router.

6. Setelah implementasi, jalankan verifikasi:
   - Backend: start `uvicorn main:app --reload --host 0.0.0.0 --port 8000`.
   - Frontend: `npm run build` dan `npm run dev`.
   - Manual smoke test: upload image, brightness, rotate, crop, histogram current/compare, undo/redo/jump, save/export, channel view, ML unavailable/success path.

## Checklist Implementasi

- [x] `save_step` caller diberi label/params eksplisit.
- [x] Response ML menambahkan `top_label` + `top_confidence` sambil mempertahankan `top_prediction`.
- [x] Channel tab dibuat sebagai preview non-mutating lewat endpoint read-only.
- [ ] File `cnn_model.h5` belum tersedia di repository; endpoint ML tetap akan 503 sampai model disediakan.
- [x] Implementasi diprioritaskan dari bug `save_step` terlebih dahulu.

## Verifikasi Yang Sudah Dicoba

- Endpoint path FE vs BE dicek secara statis dan mayoritas cocok.
- Setelah implementasi, pencarian statis memastikan tidak ada lagi pemanggilan `ss.save_step(session_id, result)` / `decoded` / `img` tanpa label di router backend.
- Setelah implementasi, frontend type-check berhasil dengan `node .\node_modules\typescript\bin\tsc -b`.
- Setelah implementasi, production build frontend berhasil dengan `node .\node_modules\vite\bin\vite.js build`.
- Setelah implementasi, file backend yang berubah lolos syntax check dengan `.venv\Scripts\python.exe -m py_compile`.
- `npm run build` belum bisa dijalankan karena `npm` tidak ditemukan di PATH.
- `node_modules/.bin/tsc.cmd -b` gagal dengan `Access is denied`.
- `python --version` dan `py --version` tidak tersedia di PATH.
- `.venv/Scripts/python.exe --version` sebelumnya gagal dengan `Access is denied`.
