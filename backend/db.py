from pathlib import Path
import aiosqlite

DB_PATH = Path(__file__).parent / "kost.db"

async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS listings (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                price_raw TEXT,
                price_num INTEGER,
                is_price_fake INTEGER DEFAULT 0,
                location TEXT,
                city_slug TEXT,
                image_url TEXT,
                listing_url TEXT NOT NULL,
                scraped_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_listings_price_num ON listings(price_num);
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS scrape_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL,
                city_slug TEXT,
                radius_km INTEGER,
                items_found INTEGER DEFAULT 0,
                status TEXT NOT NULL,
                error_message TEXT,
                created_at TEXT NOT NULL
            );
        """)
        await db.commit()

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
    print(f"Database initialized at {DB_PATH}")
