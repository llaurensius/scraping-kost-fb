# KostScout FB - Facebook Marketplace Boarding House Scraper

Aplikasi web personal untuk melakukan web scraping dan katalogisasi data listing kost dari Facebook Marketplace menggunakan sesi login Chrome asli melalui **Chrome Remote Debugging (CDP)**.

---

## Fitur Utama

- **CDP Session Bypass**: Memanfaatkan sesi Chrome asli pengguna yang sudah login di Facebook. Tidak memerlukan akun bot atau credential tersimpan.
- **Isolasi Tab**: Setiap kali scraping dijalankan, scraper membuka tab baru khusus dan otomatis menutup tab tersebut setelah selesai tanpa mengganggu tab aktif pengguna.
- **Streaming Extraction**: Mengambil data setiap scroll sebelum elemen DOM virtual Facebook terhapus dari memori.
- **Pembersih Harga Jebakan**: Mendeteksi dan memfilter postingan dengan harga palsu (contoh: Rp 0, Rp 1, Rp 123.456).
- **Katalog & Filter Interaktif**: Filter rentang harga, search teks instan, filter dropdown area/kecamatan unik, dan badge lokasi yang bisa langsung diklik untuk memfilter hasil.

---

## Arsitektur Sistem

- **Backend**: Python 3.12, FastAPI (Port 8000), Playwright, SQLite (`backend/kost.db`), `uv`.
- **Frontend**: Vite + React 18 (TypeScript), Tailwind CSS, Lucide Icons (Port 5173).
- **Browser Connection**: Chrome DevTools Protocol (CDP) pada port 9222.

---

## Panduan Menjalankan Aplikasi

### 1. Jalankan Chrome dengan Port Remote Debugging (9222)

#### Windows (Host):
Jalankan file batch:
```cmd
scripts\start-chrome-windows.bat
```
Atau via terminal Windows:
```cmd
chrome.exe --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\ScraperProfile"
```

#### Linux:
```bash
./scripts/start-chrome-linux.sh
```

> **Langkah Login**: Di jendela browser Chrome yang baru terbuka, login ke akun Facebook Anda secara manual dan buka halaman Facebook Marketplace sekali.

---

### 2. Jalankan Backend (FastAPI)

Buka terminal (WSL2 / Linux):
```bash
cd backend
uv run uvicorn main:app --reload --port 8000
```
Backend akan aktif di `http://127.0.0.1:8000`.

---

### 3. Jalankan Frontend (Vite React)

Buka terminal kedua:
```bash
cd frontend
npm run dev
```
Buka browser Anda di `http://localhost:5173`.

---

## Alur Pemakaian

1. Pastikan indikator di pojok kanan atas dashboard berstatus **🟢 Chrome Terhubung (:9222)**.
2. Masukkan kata kunci pencarian (misal: `kost putra ac jogja`).
3. Tentukan kota target dan batas jumlah item yang ingin dikumpulkan.
4. Klik tombol **▶ Mulai Scraping**.
5. Scraper akan membuka tab baru di Chrome Anda, men-scroll halaman Marketplace, mengekstrak data kartu, dan menyimpannya ke database secara realtime.
6. Gunakan filter harga, search bar, dan klik badge lokasi pada kartu kost untuk menyaring pilihan yang sesuai.
7. Klik tombol **Buka di Facebook ↗** untuk membuka langsung postingan kost yang Anda minati.

---

## Dokumentasi Proyek

- [Product Requirement Document (PRD)](docs/PRD.md)
- [Technical Specification](docs/TECHNICAL_SPEC.md)
- [UI/UX Specification](docs/UI_UX_SPEC.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
