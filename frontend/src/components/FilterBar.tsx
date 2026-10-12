import React from 'react';
import { Search, Filter, ArrowUpDown, DollarSign, MapPin, CheckSquare, Square } from 'lucide-react';

interface FilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  uniqueLocations: string[];
  minPrice: string;
  onMinPriceChange: (v: string) => void;
  maxPrice: string;
  onMaxPriceChange: (v: string) => void;
  hideFakePrice: boolean;
  onToggleHideFakePrice: () => void;
  sortBy: string;
  onSortByChange: (v: string) => void;
  totalItems: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  query,
  onQueryChange,
  location,
  onLocationChange,
  uniqueLocations,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  hideFakePrice,
  onToggleHideFakePrice,
  sortBy,
  onSortByChange,
  totalItems,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Penyaringan Hasil</span>
          <span className="text-xs font-normal text-slate-400">({totalItems} kost ditemukan)</span>
        </div>

        {/* Checkbox Sembunyikan Harga Palsu */}
        <button
          type="button"
          onClick={onToggleHideFakePrice}
          className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition cursor-pointer select-none self-start md:self-auto"
        >
          {hideFakePrice ? (
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          ) : (
            <Square className="w-4 h-4 text-slate-500" />
          )}
          <span>Sembunyikan harga jebakan (&le; Rp 10.000)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Teks */}
        <div className="lg:col-span-4 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari kata di judul / lokasi..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        {/* Dropdown Lokasi Unik */}
        <div className="lg:col-span-3 relative">
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Semua Area / Lokasi</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        {/* Range Harga Min - Max */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="Harga Min"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
          </div>
          <span className="text-slate-500 text-xs">-</span>
          <div className="relative flex-1">
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="Harga Max"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="lg:col-span-2 relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="newest">Data Terbaru</option>
            <option value="price_asc">Harga Termurah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>
    </div>
  );
};
