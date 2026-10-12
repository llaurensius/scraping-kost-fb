import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ScraperPanel } from './components/ScraperPanel';
import { FilterBar } from './components/FilterBar';
import { ListingCard } from './components/ListingCard';
import type { CDPStatus, ScraperStatus, Listing, ListingsResponse } from './types';
import { Home, Loader2 } from 'lucide-react';

export function App() {
  // System State
  const [cdpStatus, setCdpStatus] = useState<CDPStatus | null>(null);
  const [checkingCdp, setCheckingCdp] = useState(false);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);

  // Listings & Filter State
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Filter Values
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hideFakePrice, setHideFakePrice] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  // 1. Fetch CDP Status
  const fetchCdpStatus = useCallback(async () => {
    setCheckingCdp(true);
    try {
      const res = await fetch('/api/system/cdp-status');
      if (res.ok) {
        const data = await res.json();
        setCdpStatus(data);
      }
    } catch {
      setCdpStatus({ connected: false, cdp_url: null, browser: null });
    } finally {
      setCheckingCdp(false);
    }
  }, []);

  // 2. Fetch Unique Locations
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setUniqueLocations(data);
      }
    } catch {
      // ignore
    }
  }, []);

  // 3. Fetch Listings
  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (location) params.append('location', location);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      params.append('hide_fake_price', String(hideFakePrice));
      params.append('sort_by', sortBy);
      params.append('limit', '100');

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data: ListingsResponse = await res.json();
        setListings(data.items);
        setTotalItems(data.total);
      }
    } catch (err) {
      console.error('Failed fetching listings:', err);
    } finally {
      setLoadingListings(false);
    }
  }, [query, location, minPrice, maxPrice, hideFakePrice, sortBy]);

  // Initial load
  useEffect(() => {
    fetchCdpStatus();
    fetchLocations();
    fetchListings();
  }, [fetchCdpStatus, fetchLocations, fetchListings]);

  // 4. Polling Scraper Status saat scraping berjalan
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/scraper/status');
        if (res.ok) {
          const status: ScraperStatus = await res.json();
          setScraperStatus(status);

          // Jika sedang running, refresh data listing secara berkala
          if (status.is_running) {
            fetchListings();
            fetchLocations();
          }
        }
      } catch {
        // ignore
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [fetchListings, fetchLocations]);

  // Handlers Scraper
  const handleStartScraping = async (kw: string, city: string, limitVal: number) => {
    const res = await fetch('/api/scraper/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: kw,
        city_slug: city || null,
        limit: limitVal,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Gagal memulai scraper');
    }
  };

  const handleStopScraping = async () => {
    await fetch('/api/scraper/stop', { method: 'POST' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        cdpStatus={cdpStatus}
        checkingCdp={checkingCdp}
        onRefreshCdp={fetchCdpStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Scraper Control Card */}
        <ScraperPanel
          cdpStatus={cdpStatus}
          scraperStatus={scraperStatus}
          onStartScraping={handleStartScraping}
          onStopScraping={handleStopScraping}
        />

        {/* Filter and Sorting Toolbar */}
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          location={location}
          onLocationChange={setLocation}
          uniqueLocations={uniqueLocations}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          hideFakePrice={hideFakePrice}
          onToggleHideFakePrice={() => setHideFakePrice(!hideFakePrice)}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          totalItems={totalItems}
        />

        {/* Listings Grid */}
        <div className="space-y-4">
          {loadingListings && listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">Memuat data kost...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-2xl text-slate-400">
                <Home className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Belum Ada Data Kost</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Jalankan Chrome dengan port 9222, login ke Facebook Marketplace, lalu tekan tombol
                "Mulai Scraping" di atas untuk mengumpulkan data pertama Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onSelectLocation={(loc) => setLocation(loc)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        KostScout FB &bull; Personal Facebook Marketplace Scraper via Chrome DevTools Protocol
      </footer>
    </div>
  );
}

export default App;
