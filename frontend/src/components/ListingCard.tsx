import React from 'react';
import { ExternalLink, MapPin, AlertCircle, Calendar } from 'lucide-react';
import type { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  onSelectLocation: (loc: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelectLocation }) => {
  const formattedPrice = listing.price_num
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(listing.price_num)
    : listing.price_raw || 'Hubungi Penjual';

  // Format tanggal singkat
  const dateFormatted = new Date(listing.scraped_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col hover:border-slate-700 transition group">
      {/* Cover Image Container */}
      <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
            <span className="text-3xl">🏠</span>
            <span className="text-xs">Foto tidak tersedia</span>
          </div>
        )}

        {/* Fake Price Warning Badge */}
        {listing.is_price_fake && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 backdrop-blur">
            <AlertCircle className="w-3 h-3" />
            <span>Harga Tidak Wajar</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <span className="text-base font-extrabold text-indigo-400">
              {formattedPrice}
            </span>
            <span className="text-[10px] text-slate-400">/ bulan</span>
          </div>

          {/* Title */}
          <h3
            title={listing.title}
            className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed"
          >
            {listing.title}
          </h3>
        </div>

        {/* Footer info: Location & Date */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            {listing.location ? (
              <button
                type="button"
                onClick={() => onSelectLocation(listing.location!)}
                title="Klik untuk filter lokasi ini"
                className="flex items-center gap-1 hover:text-indigo-400 transition truncate max-w-[70%]"
              >
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{listing.location}</span>
              </button>
            ) : (
              <span className="text-slate-600">Lokasi tidak tertera</span>
            )}

            <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{dateFormatted}</span>
            </div>
          </div>

          {/* Action CTA Link to Facebook */}
          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow"
          >
            <span>Buka di Facebook</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
