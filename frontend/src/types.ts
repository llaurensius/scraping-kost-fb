export interface Listing {
  id: string;
  title: string;
  price_raw: string | null;
  price_num: number | null;
  is_price_fake: boolean;
  location: string | null;
  city_slug: string | null;
  image_url: string | null;
  listing_url: string;
  scraped_at: string;
  updated_at: string;
}

export interface ListingsResponse {
  total: number;
  items: Listing[];
  limit: number;
  offset: number;
}

export interface CDPStatus {
  connected: boolean;
  cdp_url: string | null;
  browser: string | null;
}

export interface ScraperStatus {
  is_running: boolean;
  session_id: number | null;
  items_scraped: number;
  target_limit: number;
  log: string;
}
