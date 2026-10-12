import React, { useState } from 'react';
import { Play, Square, Loader2, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import type { ScraperStatus, CDPStatus } from '../types';

interface ScraperPanelProps {
  cdpStatus: CDPStatus | null;
  scraperStatus: ScraperStatus | null;
  onStartScraping: (keyword: string, citySlug: string, limit: number) => Promise<void>;
  onStopScraping: () => Promise<void>;
}

const CITY_PRESETS = [
  { label: 'Sesuai Akun FB (Default)', value: '' },
  { label: 'Yogyakarta (Jogja)', value: 'jogja' },
  { label: 'Jakarta', value: 'jakarta' },
  { label: 'Bandung', value: 'bandung' },
  { label: 'Surabaya', value: 'surabaya' },
  { label: 'Malang', value: 'malang' },
  { label: 'Semarang', value: 'semarang' },
  { label: 'Solo / Surakarta', value: 'solo' },
];

export const ScraperPanel: React.FC<ScraperPanelProps> = ({
  cdpStatus,
  scraperStatus,
  onStartScraping,
  onStopScraping,
}) => {
  const [keyword, setKeyword] = useState('kost putra jogja');
  const [citySlug, setCitySlug] = useState('');
  const [limit, setLimit] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRunning = scraperStatus?.is_running ?? false;
  const progressPercent = scraperStatus?.target_limit
    ? Math.min(100, Math.round((scraperStatus.items_scraped / scraperStatus.target_limit) * 100))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setIsSubmitting(true);
    try {
      await onStartScraping(keyword.trim(), citySlug, limit);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            Panel Kontrol Scraper Facebook
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ekstrak data listing kost langsung dari tab baru sesi Chrome Anda
          </p>
        </div>

        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-800 rounded-full text-xs text-amber-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Sedang Berjalan ({scraperStatus?.items_scraped} / {scraperStatus?.target_limit})</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Input */}
          <div className="sm:col-span-6 relative">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Kata Kunci Pencarian
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={isRunning}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Contoh: kost putri ugm ac, kost bebas..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Kota Target Dropdown */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Area Kota (Facebook Slug)
            </label>
            <div className="relative">
              <select
                disabled={isRunning}
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                {CITY_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Limit Angka */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Jumlah
            </label>
            <input
              type="number"
              disabled={isRunning}
              min={10}
              max={200}
              step={10}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50 text-center font-medium"
            />
          </div>
        </div>

        {/* Action Buttons & Progress */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="w-full sm:w-auto flex items-center gap-2">
            {!isRunning ? (
              <button
                type="submit"
                disabled={!cdpStatus?.connected || isSubmitting || !keyword.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Mulai Scraping</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopScraping}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Hentikan Scraping</span>
              </button>
            )}

            {!cdpStatus?.connected && (
              <span className="text-xs text-rose-400">
                *Hubungkan Chrome port 9222 terlebih dahulu
              </span>
            )}
          </div>

          {/* Status Message */}
          <div className="text-xs text-slate-400 font-mono text-right w-full sm:w-auto truncate">
            {scraperStatus?.log || 'Scraper siap dijalankan.'}
          </div>
        </div>

        {/* Progress Bar saat running */}
        {isRunning && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Mengumpulkan data kost...</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
