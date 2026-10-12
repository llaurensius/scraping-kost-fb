import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import init_db, DB_PATH
import crud
import aiosqlite
from scraper.cdp_client import check_cdp_connection
from scraper.fb_scraper import FacebookScraper

# State scraper in-memory
class ScraperState:
    is_running: bool = False
    current_session_id: Optional[int] = None
    items_scraped: int = 0
    target_limit: int = 50
    current_log: str = "Idle"
    scraper_instance: Optional[FacebookScraper] = None

state = ScraperState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inisialisasi database SQLite saat startup
    await init_db()
    yield

app = FastAPI(title="KostScout FB API", lifespan=lifespan)

# Setup CORS untuk frontend Vite (Port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Schemas -----------------
class ScraperStartRequest(BaseModel):
    keyword: str
    city_slug: Optional[str] = None
    limit: int = 50

# ----------------- Endpoints -----------------

@app.get("/api/system/cdp-status")
async def get_cdp_status():
    """
    Cek ketersediaan Chrome Remote Debugging port 9222.
    """
    connected, url, info = await check_cdp_connection()
    return {
        "connected": connected,
        "cdp_url": url,
        "browser": info.get("Browser") if info else None
    }

async def run_scraper_task(session_id: int, cdp_url: str, keyword: str, city_slug: Optional[str], limit: int):
    scraper = FacebookScraper(cdp_url)
    state.scraper_instance = scraper

    def on_status_update(count: int, log_text: str):
        state.items_scraped = count
        state.current_log = log_text

    scraper.log_callback = lambda msg: setattr(state, 'current_log', msg)

    try:
        total_found = await scraper.run(
            keyword=keyword,
            city_slug=city_slug,
            limit=limit,
            status_updater=on_status_update
        )
        async with aiosqlite.connect(DB_PATH) as db:
            await crud.update_session(db, session_id, total_found, "completed")
        state.current_log = f"Scraping selesai! {total_found} kost berhasil dikumpulkan."
    except Exception as e:
        async with aiosqlite.connect(DB_PATH) as db:
            await crud.update_session(db, session_id, state.items_scraped, "failed", str(e))
        state.current_log = f"Scraping gagal: {str(e)}"
    finally:
        state.is_running = False
        state.scraper_instance = None

@app.post("/api/scraper/start")
async def start_scraper(req: ScraperStartRequest, background_tasks: BackgroundTasks):
    if state.is_running:
        raise HTTPException(status_code=400, detail="Scraper sedang berjalan. Harap tunggu atau hentikan sesi saat ini.")

    connected, cdp_url, _ = await check_cdp_connection()
    if not connected or not cdp_url:
        raise HTTPException(
            status_code=503,
            detail="Chrome Remote Debugging (port 9222) belum terhubung. Jalankan Chrome dengan script start-chrome lebih dulu."
        )

    # Buat session di DB
    async with aiosqlite.connect(DB_PATH) as db:
        session_id = await crud.create_session(db, req.keyword, req.city_slug)

    state.is_running = True
    state.current_session_id = session_id
    state.items_scraped = 0
    state.target_limit = req.limit
    state.current_log = f"Memulai scraping untuk keyword: '{req.keyword}'..."

    background_tasks.add_task(
        run_scraper_task,
        session_id=session_id,
        cdp_url=cdp_url,
        keyword=req.keyword,
        city_slug=req.city_slug,
        limit=req.limit
    )

    return {
        "status": "started",
        "session_id": session_id,
        "message": "Scraper berhasil dijalankan di background."
    }

@app.get("/api/scraper/status")
async def get_scraper_status():
    return {
        "is_running": state.is_running,
        "session_id": state.current_session_id,
        "items_scraped": state.items_scraped,
        "target_limit": state.target_limit,
        "log": state.current_log
    }

@app.post("/api/scraper/stop")
async def stop_scraper():
    if not state.is_running or not state.scraper_instance:
        return {"status": "not_running", "message": "Tidak ada scraper yang sedang berjalan."}

    state.scraper_instance.stop()
    state.current_log = "Menghentikan scraper..."
    return {"status": "stopping", "message": "Perintah berhenti telah dikirim ke scraper."}

@app.get("/api/listings")
async def get_listings(
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    location: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    hide_fake_price: bool = Query(True),
    sort_by: str = Query("newest"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        return await crud.get_listings(
            db=db,
            min_price=min_price,
            max_price=max_price,
            location=location,
            query=query,
            hide_fake_price=hide_fake_price,
            sort_by=sort_by,
            limit=limit,
            offset=offset
        )

@app.get("/api/locations")
async def get_locations():
    async with aiosqlite.connect(DB_PATH) as db:
        return await crud.get_unique_locations(db)
