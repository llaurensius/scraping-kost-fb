# Technical Specification

## 1. System Architecture & Ports
Komponen utama:
- User Chrome (Windows Host): Chrome biasa dijalankan di Windows dengan remote debugging port 9222 dan sudah login ke akun Facebook pengguna.
- Playwright Scraper (WSL2): Worker backend di WSL2 yang attach ke port 9222 via CDP.
- FastAPI Backend: Port 8000 (`http://localhost:8000`), menyediakan REST API kontrol scraper & query SQLite.
- SQLite Database: File database lokal (`kost.db`).
- Vite React UI: Port 5173 (`http://localhost:5173`), dashboard interaktif.

## 2. Chrome Remote Debugging Setup (WSL2 to Windows Host Bridge)
Browser Chrome dijalankan di Windows host dengan port remote debugging terbuka:

### Menjalankan Chrome di Windows (Command Prompt / PowerShell)
```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\ChromeScraperProfile"
```
Shortcut skrip disediakan di `scripts/start-chrome-windows.bat`.

### Deteksi Koneksi dari WSL2
Backend mendeteksi Chrome host melalui urutan endpoint:
1. `http://127.0.0.1:9222` (WSL2 `localhostForwarding=true`).
2. `http://<WINDOWS_HOST_IP>:9222` (gateway `/etc/resolv.conf`).
- Verifikasi endpoint: `curl http://127.0.0.1:9222/json/version`

## 3. Scraper Mechanics (Playwright)

### A. Tab Strategy: New Tab Isolation
- Sesuai keputusan pengguna, setiap sesi scraping dijalankan di **tab baru** (`context.new_page()`).
- Tab aktif pengguna tidak akan diganggu atau di-scroll paksa.
- Tab scraping otomatis ditutup saat proses scraping selesai atau distop.

### B. Query URL & Penentuan Lokasi
- Lokasi ditentukan via **Keyword pencarian** dan **settingan lokasi aktif di akun Facebook pengguna**.
- URL target:
  `https://www.facebook.com/marketplace/search/?query={encoded_keyword}`
- Contoh: `query=kost%20putra%20jogja`

### C. Incremental / Streaming Extraction (Virtual List DOM Safety)
Facebook Marketplace menggunakan virtualized list di mana elemen kartu lama terhapus dari memori DOM saat scroll ke bawah.
- **Alur Ekstraksi**:
  1. Buka tab baru menuju URL pencarian.
  2. Di setiap interval scroll, langsung query selector semua kartu yang terlihat: `a[href*="/marketplace/item/"]`.
  3. Ekstrak data: ID, judul, harga mentah, lokasi teks, URL cover image, link detail.
  4. Lakukan **Upsert** instan ke SQLite (`INSERT INTO listings ... ON CONFLICT(id) DO UPDATE`).
  5. Lakukan scroll: `window.scrollBy(0, 800)` dengan jeda acak (1.5 - 2.5 detik).
  6. Berhenti jika:
     - Target limit tercapai (default 50 item).
     - Tidak ada item baru bertambah setelah 3 kali scroll berturut-turut.
     - Pengguna menekan tombol Stop di dashboard UI.
  7. Tutup tab scraping (`await page.close()`).

## 4. Database Schema (SQLite: `kost.db`)

### Table: listings
- `id` (TEXT, PRIMARY KEY): Facebook Listing ID unik.
- `title` (TEXT, NOT NULL): Judul postingan kost.
- `price_raw` (TEXT): String harga asli Facebook (misal: "Rp 850.000").
- `price_num` (INTEGER): Angka harga hasil normalisasi (misal: 850000).
- `is_price_fake` (BOOLEAN, DEFAULT 0): 1 jika harga <= 10000 (harga jebakan).
- `location` (TEXT): Lokasi teks pada kartu (misal: "Depok, Sleman").
- `image_url` (TEXT): URL foto cover kost.
- `listing_url` (TEXT, NOT NULL): URL langsung menuju postingan Facebook.
- `scraped_at` (DATETIME, NOT NULL): Waktu data pertama kali disimpan.
- `updated_at` (DATETIME, NOT NULL): Waktu data terakhir diperbarui.

### Table: scrape_sessions
- `id` (INTEGER, PRIMARY KEY AUTOINCREMENT): ID sesi scraping.
- `keyword` (TEXT, NOT NULL): Kata kunci yang dicari.
- `items_found` (INTEGER, DEFAULT 0): Jumlah item unik tersimpan.
- `status` (TEXT, NOT NULL): Status sesi (`running`, `completed`, `stopped`, `failed`).
- `error_message` (TEXT): Pesan error jika gagal.
- `created_at` (DATETIME, NOT NULL): Waktu mulai sesi.

## 5. API Contracts (FastAPI: Port 8000)

### Health & CDP Check
- `GET /api/system/cdp-status`
  - Response: `{"connected": true, "cdp_url": "http://127.0.0.1:9222", "browser_version": "Chrome/120.x"}`

### Scraper Control
- `POST /api/scraper/start`
  - Request body: `{"keyword": "kost putra jogja", "limit": 50}`
  - Response: `{"session_id": 1, "status": "running"}`
- `GET /api/scraper/status`
  - Response: `{"is_running": true, "current_session_id": 1, "items_scraped": 24, "log": "Sedang scroll Facebook..."}`
- `POST /api/scraper/stop`
  - Response: `{"status": "stopped"}`

### Listings & Lokasi Data
- `GET /api/listings`
  - Query params: `min_price`, `max_price`, `location`, `query`, `hide_fake_price` (bool), `sort_by` (`price_asc`, `price_desc`, `newest`), `page`, `page_size`
  - Response: `{"total": 120, "items": [...]}`
- `GET /api/locations`
  - Response: `["Depok, Sleman", "Pogung, Sleman", "Seturan", "Bantul"]`: daftar lokasi unik di DB.

## 6. Frontend Stack & Architecture (Vite React: Port 5173)
- Framework: Vite + React 18+ (TypeScript).
- Styling: Tailwind CSS + Lucide Icons.
- Port: 5173 dengan proxy API ke `http://localhost:8000`.
