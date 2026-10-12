# Product Requirement Document (PRD)

## 1. Overview & Problem Statement
Mencari kost di Facebook Marketplace secara manual memiliki kendala:
- Banyak postingan duplikat dan harga tidak realistis (contoh: Rp 1, Rp 123.456, gratis).
- Navigasi lambat dan tidak ada filter rentang harga yang bersih.
- Tidak ada penyimpanan data lokal untuk membandingkan opsi kost.

Aplikasi ini adalah personal web dashboard yang melakukan web scraping ke Facebook Marketplace melalui Chrome Remote Debugging (CDP) sesi pengguna sendiri, lalu menyajikan data dalam katalog terstruktur dengan filter harga, lokasi, dan pencarian cepat.

## 2. User Persona & Use Case
- **User**: Mahasiswa atau pekerja pencari kost yang memiliki akun Facebook.
- **Workflow Utama**:
  1. Pengguna membuka Chrome dengan remote debugging port dan login Facebook.
  2. Pengguna membuka dashboard web lokal.
  3. Pengguna memasukkan keyword (contoh: "kost putra ac"), target lokasi/kota, dan batas jumlah data.
  4. Pengguna menekan tombol "Mulai Scraping".
  5. Scraper mengambil data dari halaman pencarian FB Marketplace via CDP.
  6. Data masuk ke database lokal dan langsung tampil di UI.
  7. Pengguna menyaring hasil (harga min-max, sortir termurah, kata kunci) dan mengklik link untuk langsung membuka postingan di Facebook.

## 3. Fitur & Ruang Lingkup (Scope)

### Core Features (MVP)
1. **CDP Connection Status**
   - Indikator status koneksi ke Chrome (Connected / Disconnected).
   - Petunjuk perintah start Chrome jika belum terhubung.
2. **Scraper Controller**
   - Form input: Keyword pencarian, Kota/Lokasi (opsional), Batas maksimum item (default 50).
   - Kontrol: Tombol mulai scraping dan indikator progress (idle, running, completed, error).
3. **Penyimpanan & Deduplikasi Data**
   - Data disimpan ke SQLite lokal.
   - Menggunakan Facebook Listing ID unik: data baru ditambahkan, data lama diupdate harga/statusnya (upsert).
4. **Data Normalization**
   - Parsing harga string ke integer angka (`Rp 750.000` -> `750000`).
   - Penandaan harga tidak valid/placeholder (Rp 0, Rp 1, Rp 123).
5. **Katalog & Filter UI**
   - Tampilan grid card berisi: Foto sampul, judul, harga terformat, lokasi, tanggal diambil, tombol buka di FB.
   - Filter real-time: Rentang harga (Min - Max), pencarian teks judul/lokasi.
   - Sorting: Harga termurah, harga tertinggi, data terbaru.

### Out of Scope (Future Improvements)
- Detail page crawler mendalam (scrape chat/nomor WA pemilik secara otomatis).
- Multiple user authentication (aplikasi didesain untuk personal tool lokal).
- Auto messaging ke penjual.

## 4. UI/UX Wireframe Flow
- Header: Logo KostScout FB, Status Badge Chrome Connected/Disconnected, Tombol Refresh status.
- Control Panel: Form input keyword, limit data, tombol Start Scraping, status bar proses scraping.
- Filter Bar: Pencarian teks instan, rentang harga Min - Max, dropdown sorting (Termurah, Termahal, Terbaru).
- Listing Grid: Kartu kost responsive menampilkan foto cover, harga terformat, judul, lokasi, dan tombol link langsung ke postingan Facebook asli.
