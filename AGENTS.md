# AGENTS.md

## Project Goal
Aplikasi web untuk scraping dan menampilkan listing kost dari Facebook Marketplace.

## Tech Stack & Ports
- Backend & Scraper: Python 3.12 + FastAPI (Port 8000) + Playwright.
- Scraper Strategy: Chrome Remote Debugging (CDP port 9222). Playwright attach ke instance Windows pengguna yang sudah login FB.
- Frontend: Vite + React (TypeScript) + Tailwind CSS (Port 5173).
- Database: SQLite (kost.db). Zero config, file-based.
- Package Manager: uv (Python), npm (Frontend).

## Scraping Workflow (CDP)
1. User menjalankan Chrome di Windows dengan remote debugging: `--remote-debugging-port=9222`.
2. User login manual di Facebook Marketplace.
3. Backend (WSL2) mendeteksi dan connect via `connect_over_cdp("http://127.0.0.1:9222")`.
4. Scraper membuka **tab baru** khusus scraping agar tab aktif pengguna tidak terganggu.
5. Scraper scroll bertahap dan melakukan streaming extraction (simpan ke SQLite setiap scroll sebelum DOM virtual FB terhapus).
6. Selesai scraping, tab baru otomatis ditutup.

## Gotchas & Constraints
- Anti-bot bypass: Menggunakan profil dan sesi Chrome asli pengguna via CDP. Tidak ada login credential disimpan.
- Tab Isolation: Scraper wajib pakai `new_page()` dan `page.close()` di akhir.
- Virtualized DOM: Elemen kartu lama terhapus saat scroll; harus diekstrak inkremental.
- Environment WSL2: Bridge host via `127.0.0.1` atau gateway host IP di `/etc/resolv.conf`.

## Target Structure
```text
backend/
  scraper/    # Playwright CDP runner
  api/        # FastAPI endpoints
  models.py   # Pydantic schema
  db.py       # SQLite connection & queries
frontend/     # Vite + React UI
docs/         # PRD, TECHNICAL_SPEC, UI_UX_SPEC, IMPLEMENTATION_PLAN
scripts/      # Helper script start Chrome Windows & Linux
```
