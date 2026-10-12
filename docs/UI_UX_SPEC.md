# UI/UX Specification

## 1. Design Principles & Theme
- **Clean & Fast**: Fokus pada scan data cepat (harga, foto, lokasi).
- **Theme**: Light / Dark mode neutral slate (background: `#0f172a` dark / `#f8fafc` light), aksen warna utama Indigo/Blue (`#3b82f6`).
- **Responsive**: Desktop first (dashboard view 3-4 kolom card), mobile friendly (1 kolom card).

## 2. Layout Structure & Wireframe

```text
+----------------------------------------------------------------------------------------------------+
| [🏠 KostScout FB]                          CDP Status: [🟢 Connected :9222]   [🔄 Cek Ulang]       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [PANEL KONTROL SCRAPER]                                                                           |
|  +----------------------------------------------------------------------------------------------+  |
|  | Keyword: [kost putra ac        ]   Kota Target: [Yogyakarta ▼]   Radius: [ 10 km ▼ ]         |  |
|  | Limit: [ 50 ]                                           [ ▶ Mulai Scraping ] [ ⏹ Stop ]        |  |
|  | Progress Bar: [████████████████████░░░░░░░░░░] 34/50 kost ditemukan                           |  |
|  | Status Log: "Scraping area Yogyakarta... data baru +5"                                       |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  [TOOLBAR FILTER & SORTING HASIL]                                                                  |
|  +----------------------------------------------------------------------------------------------+  |
|  | Cari: [ketik judul...]   Area: [Semua Area / Depok / Pogung ▼]   Harga: [Rp Min] - [Rp Max]  |  |
|  | Urutkan: [Harga Termurah ▼]   [✓ Sembunyikan Harga Palsu]   Total: 128 kost                  |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  [KATALOG LISTING GRID]                                                                            |
|  +----------------------+  +----------------------+  +----------------------+  +------------------+|
|  | [ Gambar Cover Kost] |  | [ Gambar Cover Kost] |  | [ Gambar Cover Kost] |  | ...              ||
|  |                      |  |                      |  |                      |  |                  ||
|  | Rp 850.000 / bln     |  | Rp 1.500.000 / bln   |  | Rp 450.000 / bln     |  |                  ||
|  | Kost Putra Kamar Mand|  | Kost Eksklusif AC WiF|  | Kost Putri Murah Dek |  |                  ||
|  | [📍 Depok, Sleman]   |  | [📍 Pogung Lor]      |  | [📍 Seturan]         |  |                  ||
|  | Update: 2 jam lalu   |  | Update: 5 jam lalu   |  | Update: 1 hari lalu  |  |                  ||
|  | [ ↗ Buka di Facebook]|  | [ ↗ Buka di Facebook]|  | [ ↗ Buka di Facebook]|  |                  ||
|  +----------------------+  +----------------------+  +----------------------+  +------------------+|
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

## 3. Komponen Detail & Integrasi Fitur Lokasi

### A. Top Navigation Bar
- **Logo / App Title**: KostScout FB.
- **CDP Status Badge**:
  - Hijau: `🟢 Chrome Terhubung (Port 9222)`.
  - Merah: `🔴 Chrome Terputus` (Munculkan modal bantuan perintah start Chrome).
- **Refresh Button**: Tombol ping koneksi Chrome tanpa reload web.

### B. Panel Kontrol Scraper (Input Target Pencarian)
- **Keyword Input**: Kata kunci pencarian kost (contoh: "kost putra wifi").
- **Kota / Area Target (Marketplace Location)**:
  - Dropdown preset kota besar Facebook Marketplace (misal: Yogyakarta, Jakarta, Bandung, Surabaya, Malang, Semarang, Medan).
  - Opsi ketik nama kota custom (slug URL Facebook).
- **Radius Pencarian**: Dropdown radius Facebook (misal: 5 km, 10 km, 20 km, 50 km).
- **Batas Item**: Input limit angka (default 50, range 10 - 200).
- **Action Buttons**: "Mulai Scraping" dan "Hentikan".
- **Live Progress**: Bar persentase & teks jumlah item tersimpan.

### C. Toolbar Filter & Sort (Penyaringan Hasil)
- **Filter Area / Lokasi**: Dropdown dinamis berisi daftar kecamatan/daerah unik yang terkumpul di database.
- **Search Bar**: Filter instan berdasarkan judul atau kata kunci deskripsi.
- **Range Input Harga**: Min price & Max price dengan format angka Rupiah.
- **Toggle Harga Wajar**: Checkbox "Sembunyikan harga palsu (Rp 0 - Rp 10.000)".
- **Dropdown Sort**:
  - Harga Termurah (Default)
  - Harga Tertinggi
  - Tanggal Scraping Terbaru

### D. Listing Card (Interaksi Lokasi)
- **Image**: Aspect ratio 4:3, lazy load, fallback gambar placeholder.
- **Price Tag**: Teks tebal ukuran besar (`Rp 850.000 / bln`).
- **Title**: Maksimal 2 baris (truncate).
- **Location Badge**: Badge interaktif (`📍 Depok, Sleman`).
  - *Interaksi*: Mengklik badge lokasi langsung memfilter katalog untuk area tersebut secara instan tanpa ketik manual.
- **CTA Button**: "Buka di Facebook" (buka tab baru ke postingan Facebook).

### E. Empty & Error States
- **Chrome Belum Konek**: Banner instruksi ramah pengguna dengan tombol 1-klik copy perintah terminal start Chrome debug.
- **Belum Ada Data**: Tampilan placeholder informatif untuk memulai scrape pertama.
