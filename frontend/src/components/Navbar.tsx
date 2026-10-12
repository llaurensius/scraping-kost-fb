import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Terminal, HelpCircle } from 'lucide-react';
import type { CDPStatus } from '../types';

interface NavbarProps {
  cdpStatus: CDPStatus | null;
  checkingCdp: boolean;
  onRefreshCdp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cdpStatus, checkingCdp, onRefreshCdp }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            🏠
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              KostScout FB
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                CDP Scraper
              </span>
            </h1>
            <p className="text-xs text-slate-400">Pencari Kost Facebook Marketplace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              cdpStatus?.connected
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-rose-950/60 border-rose-800 text-rose-400'
            }`}
          >
            {cdpStatus?.connected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chrome Terhubung (:9222)</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Chrome Terputus</span>
              </>
            )}
          </div>

          <button
            onClick={onRefreshCdp}
            disabled={checkingCdp}
            title="Cek Ulang Koneksi Chrome"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checkingCdp ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>
        </div>
      </div>

      {/* Modal Help Chrome Debug */}
      {showHelp && (
        <div className="border-t border-slate-800 bg-slate-950/95 px-4 py-4 sm:px-8 text-xs text-slate-300 animate-in fade-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Cara Menjalankan Chrome dengan Debugging Port 9222:
              </span>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <p className="font-medium text-indigo-400">Windows (Command Prompt / PowerShell):</p>
                <code className="block bg-slate-950 p-2 rounded text-slate-300 font-mono text-[11px] select-all break-all border border-slate-800">
                  chrome.exe --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\ScraperProfile"
                </code>
                <p className="text-[11px] text-slate-400">Atau double klik skrip <code className="text-slate-300">scripts/start-chrome-windows.bat</code></p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <p className="font-medium text-indigo-400">Langkah Login:</p>
                <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                  <li>Buka browser Chrome yang muncul dari perintah di atas.</li>
                  <li>Login ke akun Facebook Anda secara manual.</li>
                  <li>Buka halaman Facebook Marketplace sekali.</li>
                  <li>Kembali ke web ini dan tekan tombol "Cek Ulang" di pojok kanan atas.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
