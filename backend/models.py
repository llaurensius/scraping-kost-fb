import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

def normalize_price(price_raw: Optional[str]) -> tuple[Optional[int], bool]:
    """
    Ekstrak angka dari string harga (misal: 'Rp 850.000' -> (850000, False)).
    Tandai is_fake=True jika harga <= 10.000 atau format aneh seperti Rp 1 / Rp 123.
    """
    if not price_raw:
        return None, True
    
    clean = re.sub(r"[^\d]", "", price_raw)
    if not clean:
        return None, True
    
    try:
        val = int(clean)
        is_fake = val <= 10000 or val == 123456
        return val, is_fake
    except ValueError:
        return None, True

class ListingBase(BaseModel):
    id: str
    title: str
    price_raw: Optional[str] = None
    price_num: Optional[int] = None
    is_price_fake: bool = False
    location: Optional[str] = None
    city_slug: Optional[str] = None
    image_url: Optional[str] = None
    listing_url: str

class ListingCreate(BaseModel):
    id: str
    title: str
    price_raw: Optional[str] = None
    location: Optional[str] = None
    city_slug: Optional[str] = None
    image_url: Optional[str] = None
    listing_url: str

class ListingResponse(ListingBase):
    scraped_at: str
    updated_at: str

class ScrapeSessionCreate(BaseModel):
    keyword: str
    city_slug: Optional[str] = None
    radius_km: Optional[int] = None

class ScrapeSessionResponse(BaseModel):
    id: int
    keyword: str
    city_slug: Optional[str] = None
    radius_km: Optional[int] = None
    items_found: int
    status: str
    error_message: Optional[str] = None
    created_at: str
