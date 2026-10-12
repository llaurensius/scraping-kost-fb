# Implementation Plan

Panduan bertahap (step-by-step) untuk membangun aplikasi web scraping kost Facebook Marketplace.

---

## Tahap 1: Setup Workspace & Environment
Tujuan: Menginisialisasi direktori backend dan frontend serta memastikan dependensi terinstal.

- [ ] **Step 1.1**: Inisialisasi backend Python dengan `uv`.
  - Buat folder `backend/`.
  - Inisialisasi project `uv init backend`.
  - Tambahkan dependensi: `fastapi`, `uvicorn[standard]`, `playwright`, `aiosqlite`, `pydantic`, `httpx`.
- [ ] **Step 1.2**: Inisialisasi frontend dengan Vite + React + TypeScript.
  - Buat folder `frontend/` via `npm create vite@latest frontend -- --template react-ts`.
  - Install dependensi UI: Tailwind CSS, Lucide React (ikon), TanStack Query / Axios.
- [ ] **Step 1.3**: Buat skrip pembantu launch Chrome CDP.
  - Buat file `scripts/start-chrome.bat` (Windows) dan `scripts/start-chrome.sh` (Linux) dengan flag remote debugging port 9222.

---

## Tahap 2: Database & Data Schema (Backend)
Tujuan: Menyediakan persistensi data lokal menggunakan SQLite.

- [ ] **Step 2.1**: Buat modul koneksi database (`backend/db.py`).
  - Inisialisasi database SQLite (`kost.db`).
  - Auto-create tabel `listings` dan `scrape_sessions`.
- [ ] **Step 2.2**: Buat schema Pydantic & fungsi CRUD (`backend/models.py` & `backend/crud.py`).
  - Fungsi upsert data listing (insert baru jika belum ada, update jika ID sama).
  - Normalisasi harga teks ke angka integer (contoh: "Rp 850.000" -> 850000).
  - Query filtering listings: filter harga, filter lokasi, text search, sorting.
  - Query list lokasi unik untuk filter dropdown.

---

## Tahap 3: Scraper Core via CDP (Backend)
Tujuan: Mengimplementasikan mekanisme koneksi ke Chrome yang sedang aktif dan scraping listing FB.

- [ ] **Step 3.1**: Modul verifikasi koneksi CDP (`backend/scraper/cdp_client.py`).
  - Healthcheck ke `http://localhost:9222/json/version` untuk memastikan Chrome debug aktif.
  - Fallback deteksi host IP untuk pengguna WSL2.
- [ ] **Step 3.2**: Parser & Runner Playwright (`backend/scraper/fb_scraper.py`).
  - Attach ke browser via `playwright.chromium.connect_over_cdp`.
  - Navigasi ke URL pencarian Facebook Marketplace berdasarkan kata kunci, slug kota, dan radius.
  - Loop infinite scroll dengan delay acak aman (anti-detection).
  - Ekstraksi elemen kartu listing: ID, judul, harga mentah, lokasi, cover image, link listing.
  - Simpan hasil batch langsung ke SQLite.
- [ ] **Step 3.3**: Uji coba koneksi scraper secara standalone via script terminal.

---

## Tahap 4: FastAPI REST API Endpoints (Backend)
Tujuan: Mengekspos kontrol scraper dan data listings ke frontend.

- [ ] **Step 4.1**: Endpoint status sistem & CDP (`GET /api/system/cdp-status`).
- [ ] **Step 4.2**: Endpoint kontrol scraper background task:
  - `POST /api/scraper/start`: Menjalankan background task scraping.
  - `GET /api/scraper/status`: Polling status scraping, progress counter, dan log terbaru.
  - `POST /api/scraper/stop`: Membatalkan atau menghentikan scraping yang berjalan.
- [ ] **Step 4.3**: Endpoint data:
  - `GET /api/listings`: Query listing dengan filter harga, lokasi, pencarian teks, dan sorting.
  - `GET /api/locations`: Daftar opsi lokasi unik.
- [ ] **Step 4.4**: Setup CORS middleware untuk komunikasi dengan Vite dev server (port 5173).

---

## Tahap 5: Frontend UI & State Management
Tujuan: Membangun antarmuka dashboard sesuai wireframe `docs/UI_UX_SPEC.md`.

- [ ] **Step 5.1**: Setup komponen Navbar & Status CDP.
  - Badge koneksi port 9222 (indikator warna hijau/merah).
  - Modal instruksi run Chrome jika terputus.
- [ ] **Step 5.2**: Komponen Scraper Panel.
  - Form input keyword, dropdown kota target & radius, input limit item.
  - Tombol aksi: Mulai Scraping & Hentikan.
  - Progress bar & live counter status.
- [ ] **Step 5.3**: Komponen Filter & Search Toolbar.
  - Text search bar (real-time filter).
  - Dropdown filter lokasi dinamis.
  - Input range harga (Min - Max).
  - Dropdown urutkan (Termurah, Termahal, Terbaru).
- [ ] **Step 5.4**: Komponen Listing Card & Grid.
  - Render kartu listing (foto, harga tebal, judul, link Facebook).
  - Badge lokasi yang dapat diklik untuk filter cepat.
- [ ] **Step 5.5**: Integrasi API & Polling (React Query / Fetch hook).

---

## Tahap 6: End-to-End Verification & Finishing
Tujuan: Pengujian alur utuh dari browser pengguna hingga tampilan web dashboard.

- [ ] **Step 6.1**: Jalankan Chrome debug -> verifikasi status hijau di UI.
- [ ] **Step 6.2**: Trigger scraping keyword kost -> pastikan data masuk ke SQLite dan progress bar bergerak.
- [ ] **Step 6.3**: Uji fitur filter harga, filter lokasi klik-badge, dan sortir data.
- [ ] **Step 6.4**: Dokumentasikan petunjuk operasional di `README.md`.
