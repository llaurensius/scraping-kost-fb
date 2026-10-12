from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import aiosqlite
from models import normalize_price

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def upsert_listing(db: aiosqlite.Connection, item: Dict[str, Any]) -> bool:
    """
    Simpan atau perbarui listing.
    Kembalikan True jika item baru, False jika item sudah ada sebelumnya (update).
    """
    now = now_iso()
    price_num, is_fake = normalize_price(item.get("price_raw"))
    
    # Cek apakah sudah ada
    async with db.execute("SELECT id FROM listings WHERE id = ?", (item["id"],)) as cursor:
        exists = await cursor.fetchone() is not None

    if exists:
        await db.execute("""
            UPDATE listings SET
                title = ?,
                price_raw = ?,
                price_num = ?,
                is_price_fake = ?,
                location = ?,
                city_slug = COALESCE(?, city_slug),
                image_url = COALESCE(?, image_url),
                listing_url = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            item["title"],
            item.get("price_raw"),
            price_num,
            1 if is_fake else 0,
            item.get("location"),
            item.get("city_slug"),
            item.get("image_url"),
            item["listing_url"],
            now,
            item["id"]
        ))
    else:
        await db.execute("""
            INSERT INTO listings (
                id, title, price_raw, price_num, is_price_fake,
                location, city_slug, image_url, listing_url, scraped_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["id"],
            item["title"],
            item.get("price_raw"),
            price_num,
            1 if is_fake else 0,
            item.get("location"),
            item.get("city_slug"),
            item.get("image_url"),
            item["listing_url"],
            now,
            now
        ))
    await db.commit()
    return not exists

async def get_listings(
    db: aiosqlite.Connection,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    location: Optional[str] = None,
    query: Optional[str] = None,
    hide_fake_price: bool = True,
    sort_by: str = "newest",
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    conditions = []
    params: List[Any] = []

    if hide_fake_price:
        conditions.append("is_price_fake = 0")

    if min_price is not None:
        conditions.append("price_num >= ?")
        params.append(min_price)

    if max_price is not None:
        conditions.append("price_num <= ?")
        params.append(max_price)

    if location and location.strip():
        conditions.append("location LIKE ?")
        params.append(f"%{location.strip()}%")

    if query and query.strip():
        conditions.append("(title LIKE ? OR location LIKE ?)")
        params.append(f"%{query.strip()}%")
        params.append(f"%{query.strip()}%")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Sort
    order_clause = "ORDER BY scraped_at DESC"
    if sort_by == "price_asc":
        order_clause = "ORDER BY CASE WHEN price_num IS NULL THEN 1 ELSE 0 END, price_num ASC"
    elif sort_by == "price_desc":
        order_clause = "ORDER BY CASE WHEN price_num IS NULL THEN 1 ELSE 0 END, price_num DESC"

    # Count total
    count_sql = f"SELECT COUNT(*) FROM listings {where_clause}"
    async with db.execute(count_sql, params) as cursor:
        total = (await cursor.fetchone())[0]

    # Fetch items
    fetch_sql = f"""
        SELECT id, title, price_raw, price_num, is_price_fake,
               location, city_slug, image_url, listing_url, scraped_at, updated_at
        FROM listings
        {where_clause}
        {order_clause}
        LIMIT ? OFFSET ?
    """
    async with db.execute(fetch_sql, params + [limit, offset]) as cursor:
        rows = await cursor.fetchall()
        items = [dict(row) for row in rows]

    return {
        "total": total,
        "items": items,
        "limit": limit,
        "offset": offset
    }

async def get_unique_locations(db: aiosqlite.Connection) -> List[str]:
    async with db.execute("""
        SELECT DISTINCT location FROM listings
        WHERE location IS NOT NULL AND TRIM(location) != ''
        ORDER BY location ASC
    """) as cursor:
        rows = await cursor.fetchall()
        return [r[0] for r in rows if r[0]]

async def create_session(db: aiosqlite.Connection, keyword: str, city_slug: Optional[str] = None, radius_km: Optional[int] = None) -> int:
    now = now_iso()
    cursor = await db.execute("""
        INSERT INTO scrape_sessions (keyword, city_slug, radius_km, items_found, status, created_at)
        VALUES (?, ?, ?, 0, 'running', ?)
    """, (keyword, city_slug, radius_km, now))
    await db.commit()
    return cursor.lastrowid

async def update_session(db: aiosqlite.Connection, session_id: int, items_found: int, status: str, error_message: Optional[str] = None):
    await db.execute("""
        UPDATE scrape_sessions
        SET items_found = ?, status = ?, error_message = ?
        WHERE id = ?
    """, (items_found, status, error_message, session_id))
    await db.commit()
