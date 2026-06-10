# Modul Belajar Mandiri: Dasar Image Processing dengan OpenCV & Python

Selamat datang di modul belajar mandiri Image Processing! Modul ini disusun berdasarkan codebase dari project Mini Photoshop yang telah kamu buat. Kita akan membedah setiap fitur pengolahan citra yang ada di dalamnya, mempelajari cara kerjanya, dan bagaimana kode tersebut mengimplementasikannya.

> [!TIP]
> **Analogi Dasar:** Bayangkan sebuah gambar (citra digital) sebagai sebuah kanvas mosaik yang sangat besar. Mosaik ini terdiri dari ribuan kotak kecil yang disebut **piksel**. Setiap kotak kecil ini memiliki nilai angka yang merepresentasikan warnanya. Image processing pada dasarnya adalah "matematika pada kanvas mosaik" ini—kita memanipulasi angka-angka pada kotak-kotak tersebut untuk menghasilkan efek visual yang berbeda.

---

## 1. Transformasi Geometri

### Rotate (Rotasi)

#### Apa itu?
Memutar gambar dengan sudut tertentu. Ibarat memutar selembar foto fisik di atas meja. Fitur ini berguna untuk memperbaiki orientasi gambar yang miring atau sekadar untuk efek artistik.

#### Bagaimana cara kerjanya?
Secara internal, rotasi dilakukan menggunakan perkalian matriks (disebut transformasi Affine). OpenCV menghitung sebuah matriks rotasi 2D berdasarkan titik pusat gambar dan sudut putarannya. Kemudian, semua piksel pada gambar dipindahkan ke lokasi baru berdasarkan hitungan matriks tersebut. Parameter `expand` berguna untuk memperbesar "kanvas" agar sudut gambar yang terputar tidak terpotong (keluar batas frame).

#### Implementasi di project ini
```python
# routers/geometric.py
def rotate(session_id: str, body: RotateBody):
    img = ss.read_current(session_id)
    h, w = img.shape[:2]
    # 1. Menentukan titik pusat rotasi (tengah gambar)
    center = (w / 2, h / 2)
    # 2. Membuat matriks rotasi
    M = cv2.getRotationMatrix2D(center, -body.angle, 1.0)

    if body.expand:
        # Menghitung ukuran kanvas baru agar gambar tidak terpotong
        cos = abs(M[0, 0])
        sin = abs(M[0, 1])
        new_w = int(h * sin + w * cos)
        new_h = int(h * cos + w * sin)
        M[0, 2] += (new_w / 2) - center[0]
        M[1, 2] += (new_h / 2) - center[1]
        # 3. Menerapkan matriks ke gambar dengan ukuran kanvas baru
        result = cv2.warpAffine(img, M, (new_w, new_h), flags=cv2.INTER_LINEAR)
    else:
        # Menerapkan matriks ke gambar dengan ukuran asli
        result = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR)
```

#### Contoh penggunaan
```python
import cv2
img = cv2.imread("foto.jpg")
h, w = img.shape[:2]
matrix = cv2.getRotationMatrix2D((w/2, h/2), 90, 1.0) # Putar 90 derajat
rotated = cv2.warpAffine(img, matrix, (w, h))
```

#### Tips & hal yang perlu diperhatikan
- Saat memutar selain kelipatan 90 derajat (misal 45 derajat) tanpa `expand`, sudut-sudut gambar pasti akan terpotong (hitam).
- Ingat bahwa fungsi `warpAffine` dari OpenCV menangani rotasi dan pergeseran sekaligus!

---

### Flip (Pencerminan)

#### Apa itu?
Membalikkan gambar secara horizontal (seperti melihat di cermin) atau secara vertikal (terbalik atas-bawah).

#### Bagaimana cara kerjanya?
Fungsi ini sekadar menukar posisi piksel. Jika horizontal, piksel di kolom kiri ditukar dengan kolom kanan, dan seterusnya. OpenCV mempermudah ini dengan satu fungsi `cv2.flip` di mana angkanya menentukan arah pencerminan.

#### Implementasi di project ini
```python
# routers/geometric.py
def flip(session_id: str, body: FlipBody):
    img = ss.read_current(session_id)
    # 1 untuk horizontal (kiri-kanan), 0 untuk vertikal (atas-bawah)
    flip_code = 1 if body.direction == "horizontal" else 0
    # Menerapkan pencerminan
    result = cv2.flip(img, flip_code)
```

#### Contoh penggunaan
```python
import cv2
img = cv2.imread("foto.jpg")
flipped = cv2.flip(img, 1) # Flip horizontal
```

#### Tips & hal yang perlu diperhatikan
- Angka `-1` pada `cv2.flip` akan membalik gambar secara horizontal dan vertikal sekaligus (diagonal).

---

### Crop (Pemotongan)

#### Apa itu?
Memotong gambar untuk mengambil bagian tertentu saja (Region of Interest / ROI), membuang bagian luar yang tidak diperlukan.

#### Bagaimana cara kerjanya?
Karena gambar di OpenCV direpresentasikan sebagai NumPy array 3 dimensi (Tinggi, Lebar, Warna), cropping hanyalah masalah *slicing* (memotong) array tersebut dari indeks awal ke indeks akhir. Tidak ada komputasi matematis kompleks, hanya pengambilan subset dari matriks data.

#### Implementasi di project ini
```python
# routers/geometric.py
def crop(session_id: str, body: CropBody):
    img = ss.read_current(session_id)
    h, w = img.shape[:2]

    # Titik akhir x dan y
    x2 = body.x + body.width
    y2 = body.y + body.height

    # Slicing array [baris_awal:baris_akhir, kolom_awal:kolom_akhir]
    result = img[body.y:y2, body.x:x2]
```

#### Contoh penggunaan
```python
import cv2
img = cv2.imread("foto.jpg")
# Memotong gambar dari koordinat (x=100, y=50) dengan ukuran 200x200
cropped_img = img[50:250, 100:300] 
```

#### Tips & hal yang perlu diperhatikan
- Perhatikan urutan indeks! Pada NumPy array, urutannya adalah `[baris (Y), kolom (X)]`, sehingga untuk me-slice kita gunakan `img[y1:y2, x1:x2]`.

---

### Resize (Ubah Ukuran)

#### Apa itu?
Mengubah resolusi gambar menjadi lebih besar (upscale) atau lebih kecil (downscale). 

#### Bagaimana cara kerjanya?
Saat mengecilkan, komputer membuang beberapa piksel. Saat membesarkan, komputer harus menebak nilai piksel kosong yang baru dibuat. Proses menebak ini disebut **interpolasi**. 
- *Nearest-neighbor*: Mengkopi warna dari piksel tetangga terdekat (hasilnya terlihat kotak-kotak/pixelated).
- *Bilinear*: Menghitung rata-rata dari 4 piksel tetangga (hasilnya lebih halus).

#### Implementasi di project ini
```python
# routers/geometric.py
def resize(session_id: str, body: ResizeBody):
    img = ss.read_current(session_id)
    # Memilih metode interpolasi
    interp = cv2.INTER_NEAREST if body.interpolation == "nearest" else cv2.INTER_LINEAR
    # Menerapkan resize
    result = cv2.resize(img, (body.width, body.height), interpolation=interp)
```

#### Contoh penggunaan
```python
import cv2
img = cv2.imread("foto.jpg")
# Mengubah ukuran menjadi lebar=800, tinggi=600
resized = cv2.resize(img, (800, 600), interpolation=cv2.INTER_LINEAR)
```

#### Tips & hal yang perlu diperhatikan
- Selalu perhatikan *aspect ratio* (rasio aspek). Jika kita mengubah ukuran tanpa mempertimbangkan rasio asli, gambar akan terlihat gepeng atau meregang.

---

## 2. Konversi Warna

### To Grayscale (Hitam Putih)

#### Apa itu?
Mengubah gambar berwarna menjadi gambar abu-abu (grayscale) di mana warna dihilangkan dan hanya menyisakan informasi tingkat kecerahan (luminance).

#### Bagaimana cara kerjanya?
Pada gambar berwarna (RGB), setiap piksel memiliki 3 nilai. Untuk menjadi grayscale, ketiga nilai ini digabungkan menggunakan rumus berbobot (karena mata manusia lebih sensitif terhadap warna hijau): `Y = 0.299*R + 0.587*G + 0.114*B`. Pada proyek ini, hasilnya dikonversi balik ke format 3-channel (di mana nilai R=G=B) agar sistem penyimpanan yang menuntut gambar selalu BGR tidak eror.

#### Implementasi di project ini
```python
# routers/color_processing.py
def to_grayscale(session_id: str):
    img = ss.read_current(session_id)
    # Mengonversi gambar BGR ke Grayscale (1 channel)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Mengonversi kembali ke BGR (3 channel) agar konsisten di sistem
    result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR) 
```

#### Contoh penggunaan
```python
import cv2
img = cv2.imread("foto.jpg")
gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
```

#### Tips & hal yang perlu diperhatikan
- Di OpenCV, urutan warna standar adalah **BGR** (Biru, Hijau, Merah), bukan RGB. Ini adalah perbedaan krusial dibandingkan Pillow (PIL) yang menggunakan RGB.

---

### Adjust Hue & Saturation

#### Apa itu?
Hue adalah rona warna dasar (misal: merah, hijau, biru), sedangkan Saturation adalah intensitas/kemurnian warna tersebut (warna kusam vs warna menyala). Ini adalah fitur standar pada aplikasi editing foto.

#### Bagaimana cara kerjanya?
Mengubah Hue & Saturation sangat sulit di ruang warna BGR. Oleh karena itu, kita mengubah gambar ke ruang warna **HSV** (Hue, Saturation, Value/Brightness) terlebih dahulu. Di HSV, warna (Hue), kemurnian (Saturation), dan kecerahan (Value) terpisah dengan rapi. Setelah diubah di HSV, gambar dikembalikan ke BGR untuk ditampilkan.

#### Implementasi di project ini
```python
# routers/color_processing.py
def adjust_hue_saturation(session_id: str, body: HueSatBody):
    img = ss.read_current(session_id)
    # 1. Konversi ke HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)

    # 2. Ubah Hue (kanal ke-0). Di OpenCV, Hue bernilai 0-179.
    hsv[:, :, 0] = (hsv[:, :, 0] + body.hue_shift / 2.0) % 180
    
    # 3. Ubah Saturation (kanal ke-1), lalu batasi nilai agar tidak lebih dari 255 (np.clip)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * body.saturation_scale, 0, 255)

    # 4. Kembalikan ke BGR
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
```

#### Contoh penggunaan
```python
import cv2
import numpy as np

img = cv2.imread("foto.jpg")
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.5, 0, 255) # Tambah saturasi 50%
res = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
```

#### Tips & hal yang perlu diperhatikan
- Mengapa hue dibagi 2? Karena sudut hue aslinya 0-360 derajat, tetapi di OpenCV nilainya disimpan dalam skala 0-179 agar muat dalam 8-bit (maksimal 255).

---

## 3. Filter & Efek (Enhancement)

### Brightness & Contrast (Kecerahan & Kontras)

#### Apa itu?
- **Brightness**: Menerangkan atau menggelapkan seluruh gambar.
- **Contrast**: Memperbesar perbedaan antara piksel terang dan piksel gelap (membuat hitam lebih pekat, putih lebih menyilaukan).

#### Bagaimana cara kerjanya?
- Kecerahan diatur dengan operasi penjumlahan sederhana. Kita menambahkan angka konstan ke semua piksel.
- Kontras diatur dengan operasi perkalian. Kita mengalikan semua piksel dengan angka konstan.
Semua operasi wajib menggunakan `np.clip` untuk memastikan nilai piksel tidak menembus batas 0 (hitam pekat) atau 255 (putih murni).

#### Implementasi di project ini
```python
# routers/enhancement.py
def brightness(session_id: str, body: BrightnessBody):
    img = ss.read_current(session_id)
    # Penjumlahan skalar (menambah kecerahan)
    result = np.clip(img.astype(np.int32) + body.value, 0, 255).astype(np.uint8)

def contrast(session_id: str, body: ContrastBody):
    img = ss.read_current(session_id)
    # Perkalian skalar (memperkuat kontras)
    result = np.clip(img.astype(np.float32) * body.value, 0, 255).astype(np.uint8)
```

#### Tips & hal yang perlu diperhatikan
- Wajib melakukan casting ke `int32` atau `float32` sebelum dihitung! Tipe data `uint8` di OpenCV hanya menampung 0-255. Jika 250 ditambah 10 dalam `uint8`, hasilnya akan *overflow* dan kembali jadi 4, mengubah piksel terang jadi gelap seketika!

---

### Smooth / Gaussian Blur (Penghalusan)

#### Apa itu?
Membuat gambar menjadi buram (blur) atau halus. Efek ini mirip dengan melihat sesuatu tanpa kacamata minus. Sering digunakan untuk menghilangkan bintik-bintik (noise) halus pada foto.

#### Bagaimana cara kerjanya?
Menggunakan konsep konvolusi matriks. Sebuah "jendela" kecil yang disebut *kernel* digeser di atas seluruh gambar. Nilai piksel di tengah kernel diganti dengan rata-rata berbobot dari piksel-piksel di sekitarnya. Gaussian blur memberikan bobot terbesar pada piksel tengah dan semakin kecil pada pinggirannya.

#### Implementasi di project ini
```python
# routers/enhancement.py
def smooth(session_id: str, body: SmoothBody):
    img = ss.read_current(session_id)
    # Menggunakan fungsi GaussianBlur OpenCV
    result = cv2.GaussianBlur(img, (body.kernel_size, body.kernel_size), 0)
```

#### Tips & hal yang perlu diperhatikan
- Ukuran kernel harus selalu angka ganjil (3, 5, 7, dsb) agar ada titik tengah yang pasti!
- *Lihat juga: `median_filter` yang ada di modul Restorasi untuk varian penghapusan noise spesifik (Salt & Pepper noise).*

---

### Sharpen (Penajaman)

#### Apa itu?
Kebalikan dari blur. Memperjelas garis-garis tepi dan detail dalam gambar agar terlihat lebih tajam dan tegas.

#### Bagaimana cara kerjanya?
Menggunakan konvolusi dengan kernel filter *High-Pass*. Filter ini bekerja dengan cara mencari perbedaan nilai yang ekstrem (seperti ujung objek) dan memperkuatnya, sambil mempertahankan area yang warnanya merata.

#### Implementasi di project ini
```python
# routers/enhancement.py
def sharpen(session_id: str, body: SharpenBody):
    img = ss.read_current(session_id)
    # Membuat kernel penajaman manual
    kernel = np.array(
        [
            [0, -body.intensity, 0],
            [-body.intensity, 1 + 4 * body.intensity, -body.intensity],
            [0, -body.intensity, 0],
        ],
        dtype=np.float32,
    )
    # filter2D untuk menerapkan matriks konvolusi bebas (kustom)
    result = cv2.filter2D(img, -1, kernel)
    result = np.clip(result, 0, 255).astype(np.uint8)
```

#### Tips & hal yang perlu diperhatikan
- Jangan menggunakan *sharpen* terlalu banyak, karena justru akan memunculkan *noise* dan membuat gambar terlihat "pecah".

---

## 4. Analisis Lanjut (Biner & Tepi)

### Threshold (Binerisasi)

#### Apa itu?
Mengubah gambar menjadi murni hitam dan murni putih (tanpa abu-abu) seperti siluet.

#### Bagaimana cara kerjanya?
Sistem menentukan sebuah nilai batas (Threshold). Jika piksel lebih terang dari batas, ubah jadi putih (255). Jika lebih gelap, ubah jadi hitam (0).
Metode *Adaptive* menghitung batas yang berbeda-beda untuk tiap area kecil di gambar, sangat bagus untuk gambar yang terkena bayangan pencahayaan tidak merata.

#### Implementasi di project ini
```python
# routers/binary_edge.py
def threshold(session_id: str, body: ThresholdBody):
    img = ss.read_current(session_id)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if body.mode == "adaptive":
        # Adaptive Threshold
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, blockSize=11, C=2
        )
    else:
        # Global Threshold biasa
        _, binary = cv2.threshold(gray, body.value, 255, cv2.THRESH_BINARY)
```

#### Tips & hal yang perlu diperhatikan
- Selalu ubah gambar menjadi Grayscale dulu sebelum di-threshold!

---

### Edge Detection (Deteksi Tepi)

#### Apa itu?
Mencari garis bingkai (outline) dari objek di dalam gambar seperti gambar sketsa pensil.

#### Bagaimana cara kerjanya?
Secara matematis, deteksi tepi mencari area di mana terjadi perubahan warna/intensitas yang sangat drastis dan mendadak (turunan matematis tingkat pertama atau kedua). Terdapat beberapa algoritma populer yang diimplementasikan:
- **Sobel / Prewitt**: Menghitung gradien arah X (kiri-kanan) dan Y (atas-bawah).
- **Canny**: Algoritma cerdas bertahap. Mulai dari blur -> Sobel -> seleksi arah -> menghubungkan tepi (Hysteresis thresholding).

#### Implementasi di project ini
```python
# routers/binary_edge.py (Fungsi Canny)
def _edge_canny(gray, t1, t2):
    blurred = cv2.GaussianBlur(gray, (5, 5), 0) # Blur dulu kurangi noise
    return cv2.Canny(blurred, t1, t2)           # Panggil Canny

# routers/binary_edge.py (Fungsi Sobel)
def _edge_sobel(gray, ksize):
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize) # Gradien sumbu X
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize) # Gradien sumbu Y
    # Menggabungkan gradien X dan Y menggunakan rumus pythagoras
    return np.uint8(np.clip(np.sqrt(gx**2 + gy**2), 0, 255)) 
```

#### Tips & hal yang perlu diperhatikan
- Algoritma Canny umumnya memberikan hasil deteksi tepi yang paling rapi, bersih, dan saling terhubung dibanding yang lain. 

---

## 5. Segmentasi (Region-Based / K-Means)

### Region-Based Segmentation

#### Apa itu?
Mengelompokkan area-area di dalam gambar yang warnanya mirip ke dalam blok warna yang sama persis. Efeknya mirip seperti mengubah foto asli menjadi lukisan *pop-art* dengan warna terbatas.

#### Bagaimana cara kerjanya?
Menggunakan algoritma *Machine Learning* yaitu **K-Means Clustering**. Algoritma akan mencari $K$ (misal $K=4$) warna dominan di gambar tersebut. Setelah ketemu, setiap piksel akan dipaksa mengubah warnanya menyerupai warna dari kelompok terdekat yang sudah ditemukan tersebut.

#### Implementasi di project ini
```python
# routers/segmentation.py
def region_based(session_id: str, body: RegionSegBody):
    img = ss.read_current(session_id)
    h, w = img.shape[:2]

    # Ubah susunan matriks jadi daftar piksel panjang (N x 3) agar bisa masuk Machine Learning
    pixels = img.reshape(-1, 3).astype(np.float32)

    # Menentukan kapan K-Means berhenti mencari (setelah 100 iterasi atau epsilon 0.2)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    
    # Jalankan algoritma K-Means
    _, labels, centers = cv2.kmeans(
        pixels, body.num_clusters, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
    )

    # Warnai ulang gambar dengan pusat kelompok warna yang ditemukan
    centers = centers.astype(np.uint8)
    result = centers[labels.flatten()].reshape(h, w, 3)
```

#### Tips & hal yang perlu diperhatikan
- K-Means sangat berat secara komputasi. Jika gambar ukurannya raksasa, *resize* / kecilkan ukurannya terlebih dahulu sebelum menjalankan fungsi ini!

---

# Rangkuman & Peta Konsep

### Tabel Ringkasan Method

| Method | Kategori | Library | Fungsi Singkat |
|---|---|---|---|
| `rotate` | Transformasi Geometri | OpenCV | Memutar gambar berdasarkan pusat dan sudut (`cv2.warpAffine`) |
| `crop` | Transformasi Geometri | NumPy | Memotong area ROI (`slicing img[y1:y2, x1:x2]`) |
| `resize` | Transformasi Geometri | OpenCV | Mengubah resolusi (`cv2.resize`) |
| `to_grayscale` | Konversi Warna | OpenCV | Merubah ke abu-abu (`cv2.cvtColor`) |
| `adjust_hue_saturation` | Konversi Warna | OpenCV | Modifikasi warna via sistem HSV |
| `brightness` & `contrast` | Filter & Efek | NumPy | Penambahan / perkalian angka konstan ke intensitas warna |
| `smooth` & `sharpen` | Filter & Efek | OpenCV | Konvolusi (perkalian kernel) untuk mengaburkan/menajamkan gambar |
| `threshold` | Binerisasi | OpenCV | Menciptakan gambar siluet hitam putih absolut |
| `edge_detection` | Deteksi Tepi | OpenCV | Mencari outline objek (Canny, Sobel, dsb) |
| `region_based` | Segmentasi | OpenCV | Pengelompokan warna dengan Machine Learning K-Means |

### Pengelompokan Kategori
1. **Transformasi Geometri**: Berurusan dengan memindahkan, memutar, dan mengubah ukuran.
2. **Konversi Warna**: Berurusan dengan ruang warna (Color Space) RGB vs HSV vs Grayscale.
3. **Filter & Efek (Spatial Filtering)**: Berurusan dengan mengolah piksel berdasarkan area tetangganya menggunakan *Kernel* (Blur, Sharpen, Median).
4. **Analisis Biner & Tepi**: Berurusan dengan mengenali bentuk dan batas (Edge, Threshold).
5. **Segmentasi**: Berurusan dengan pemilahan area gambar ke objek/wilayah yang memiliki makna.

### Saran Urutan Belajar
Jika Anda baru belajar Image Processing, sangat disarankan mengikuti urutan berikut:
1. **Dasar Matriks Gambar**: Mulai dengan **Crop**. Ini sangat krusial agar paham bahwa gambar hanyalah kumpulan array angka berderet (NumPy array).
2. **Operasi Piksel (Point Operation)**: Pindah ke **Brightness, Contrast, & To Grayscale**. Anda akan belajar bagaimana matematika sederhana (+ - * /) mengubah estetika gambar.
3. **Konvolusi (Spatial Operation)**: Masuk ke **Smooth & Sharpen**. Di sini Anda dikenalkan dengan konsep "Kernel" dan pengaruh "Tetangga" piksel.
4. **Transformasi Koordinat**: Lanjut ke **Rotate & Resize**. Mempelajari bahwa kita tidak hanya bisa mengubah warnanya, tapi bisa menggeser koordinatnya.
5. **Analisis Lanjutan**: Akhiri dengan **Edge Detection, Threshold, & Segmentation**. Ini adalah tahap awal menuju Computer Vision tingkat lanjut!
