import asyncio
import random
import re
import urllib.parse
from typing import Callable, Optional, Dict, Any, List
from playwright.async_api import async_playwright, Page, BrowserContext
from db import DB_PATH
from crud import upsert_listing
import aiosqlite

class FacebookScraper:
    def __init__(self, cdp_url: str):
        self.cdp_url = cdp_url
        self.is_running = False
        self.should_stop = False
        self.current_count = 0
        self.log_callback: Optional[Callable[[str], None]] = None

    def log(self, message: str):
        if self.log_callback:
            self.log_callback(message)
        print(f"[Scraper] {message}")

    def build_search_url(self, keyword: str, city_slug: Optional[str] = None) -> str:
        encoded_query = urllib.parse.quote(keyword)
        if city_slug and city_slug.strip():
            slug = city_slug.strip().lower()
            return f"https://www.facebook.com/marketplace/{slug}/search/?query={encoded_query}"
        return f"https://www.facebook.com/marketplace/search/?query={encoded_query}"

    async def extract_cards(self, page: Page) -> List[Dict[str, Any]]:
        """
        Ambil kartu listing yang saat ini sedang dirender di DOM.
        """
        # Eksekusi script JS langsung di browser context untuk keandalan ekstraksi
        raw_items = await page.evaluate("""() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'));
            const results = [];

            for (const a of anchors) {
                const href = a.href || '';
                const match = href.match(/\\/marketplace\\/item\\/(\\d+)/);
                if (!match) continue;
                const id = match[1];

                // Ambil gambar cover pertama dalam kartu
                const img = a.querySelector('img');
                const imageUrl = img ? img.src : null;

                // Ambil teks-teks dalam kartu
                // Facebook biasanya merender teks berurutan: Harga, Judul, Lokasi
                const textElements = Array.from(a.querySelectorAll('span, div'))
                    .map(el => el.textContent.trim())
                    .filter(t => t.length > 0 && !t.includes('\\n'));
                
                // Ambil teks unik untuk menghindari duplikasi render
                const uniqueTexts = [];
                for (const t of textElements) {
                    if (!uniqueTexts.includes(t)) {
                        uniqueTexts.push(t);
                    }
                }

                let priceRaw = null;
                let title = 'Kost Listing';
                let location = null;

                for (let i = 0; i < uniqueTexts.length; i++) {
                    const text = uniqueTexts[i];
                    // Jika teks mengandung Rp atau format angka
                    if (!priceRaw && (text.includes('Rp') || text.includes('IDR') || /^\\d[\\d.,]*$/.test(text))) {
                        priceRaw = text;
                        if (i + 1 < uniqueTexts.length) {
                            title = uniqueTexts[i + 1];
                        }
                        if (i + 2 < uniqueTexts.length) {
                            location = uniqueTexts[i + 2];
                        }
                        break;
                    }
                }

                if (!priceRaw && uniqueTexts.length > 0) {
                    // Fallback jika tidak terdeteksi simbol Rp
                    priceRaw = uniqueTexts[0];
                    if (uniqueTexts.length > 1) title = uniqueTexts[1];
                    if (uniqueTexts.length > 2) location = uniqueTexts[2];
                }

                results.push({
                    id: id,
                    title: title,
                    price_raw: priceRaw,
                    location: location,
                    image_url: imageUrl,
                    listing_url: 'https://www.facebook.com/marketplace/item/' + id + '/'
                });
            }
            return results;
        }""")
        return raw_items

    async def run(
        self,
        keyword: str,
        city_slug: Optional[str] = None,
        limit: int = 50,
        status_updater: Optional[Callable[[int, str], None]] = None
    ) -> int:
        self.is_running = True
        self.should_stop = False
        self.current_count = 0

        search_url = self.build_search_url(keyword, city_slug)
        self.log(f"Menghubungkan ke Chrome via CDP di {self.cdp_url}...")

        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(self.cdp_url)
            # Dapatkan konteks pengguna utama
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            
            # Wajib tab baru agar tab aktif user tidak terganggu
            page = await context.new_page()
            try:
                self.log(f"Membuka halaman target: {search_url}")
                await page.goto(search_url, wait_until="domcontentloaded", timeout=45000)
                await asyncio.sleep(3.0)

                seen_ids = set()
                consecutive_no_new = 0

                async with aiosqlite.connect(DB_PATH) as db:
                    db.row_factory = aiosqlite.Row

                    while self.current_count < limit and not self.should_stop:
                        # Ekstrak kartu yang terlihat di DOM saat ini
                        items = await self.extract_cards(page)
                        new_found_this_batch = 0

                        for item in items:
                            item_id = item["id"]
                            if item_id not in seen_ids:
                                seen_ids.add(item_id)
                                item["city_slug"] = city_slug
                                await upsert_listing(db, item)
                                self.current_count += 1
                                new_found_this_batch += 1
                                
                                if status_updater:
                                    status_updater(self.current_count, f"Ditemukan {self.current_count}/{limit} kost...")

                                if self.current_count >= limit or self.should_stop:
                                    break

                        self.log(f"Batch selesai: +{new_found_this_batch} item baru (Total: {self.current_count}/{limit})")

                        if new_found_this_batch == 0:
                            consecutive_no_new += 1
                            if consecutive_no_new >= 4:
                                self.log("Tidak ada listing baru lagi setelah beberapa kali scroll. Selesai.")
                                break
                        else:
                            consecutive_no_new = 0

                        # Scroll bertahap ke bawah
                        scroll_amount = random.randint(700, 1000)
                        await page.evaluate(f"window.scrollBy(0, {scroll_amount});")
                        
                        # Jeda anti-bot acak
                        sleep_time = random.uniform(1.8, 3.2)
                        await asyncio.sleep(sleep_time)

                self.log(f"Scraping selesai! Berhasil mengumpulkan {self.current_count} listing kost.")
                return self.current_count

            except Exception as e:
                self.log(f"Error saat scraping: {str(e)}")
                raise e
            finally:
                self.is_running = False
                try:
                    await page.close()
                    self.log("Tab scraper berhasil ditutup.")
                except Exception:
                    pass

    def stop(self):
        self.should_stop = True
        self.log("Permintaan stop diterima. Menghentikan scraping...")
