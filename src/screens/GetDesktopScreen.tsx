import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import {
  Monitor,
  Printer,
  Barcode,
  Keyboard,
  RefreshCw,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Laptop,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const GetDesktopScreen: React.FC = () => {
  const business = useLedgerlyStore((state) => state.business);
  const [copied, setCopied] = useState(false);

  const desktopUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(desktopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Open ${business.name || 'Ledgerly / Vyapar'} on your Desktop or Laptop browser:\n${desktopUrl}\n\nFast billing, barcode scanning, thermal printing and multi-device sync!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-28 pt-2 max-w-xl lg:max-w-4xl mx-auto">
      {/* 1. HERO BANNER: Windows 4-Color Logo & Desktop PC */}
      <div className="rounded-2xl bg-gradient-to-br from-[#161F30] via-[#1E293B] to-[#0F172A] text-white p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold backdrop-blur-xs">
              {/* Windows 4-Color Tile Logo Icon */}
              <div className="w-[16px] h-[16px] grid grid-cols-2 gap-[2px] items-center justify-center">
                <div className="w-[7px] h-[7px] bg-[#F25022] rounded-[1px]"></div>
                <div className="w-[7px] h-[7px] bg-[#7FBA00] rounded-[1px]"></div>
                <div className="w-[7px] h-[7px] bg-[#00A4EF] rounded-[1px]"></div>
                <div className="w-[7px] h-[7px] bg-[#FFB900] rounded-[1px]"></div>
              </div>
              <span>Vyapar for Windows & Desktop</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Manage Your Business 10x Faster on Desktop
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md font-medium">
              Seamlessly sync between your Android mobile app and Windows PC. Print bills with thermal printers, scan barcodes & use keyboard shortcuts.
            </p>
          </div>

          {/* Desktop Monitor Graphic */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Monitor size={54} className="text-[#00A4EF]" />
          </div>
        </div>
      </div>

      {/* 2. QR CODE & DESKTOP SYNC CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
        <h3 className="text-sm font-extrabold text-gray-900 mb-1">
          Open on your PC / Laptop Browser
        </h3>
        <p className="text-xs text-gray-500 mb-4 font-medium">
          Open this web link on your computer to log in and sync your data instantly.
        </p>

        {/* Desktop Web URL Pill */}
        <div className="flex items-center gap-2 max-w-md mx-auto p-1.5 rounded-xl bg-gray-50 border border-gray-200 mb-3">
          <input
            type="text"
            readOnly
            value={desktopUrl}
            className="flex-1 bg-transparent px-3 text-xs sm:text-sm font-bold text-gray-800 outline-none select-all truncate"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 flex-shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Share2 size={14} />
            <span>Send to WhatsApp</span>
          </button>

          <a
            href={desktopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <ExternalLink size={14} />
            <span>Open in New Tab</span>
          </a>
        </div>
      </div>

      {/* 3. KEY DESKTOP ADVANTAGES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-[#E31E38] flex items-center justify-center flex-shrink-0">
            <Printer size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Thermal & A4 Fast Printing</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Print invoices in 1-click on 2-inch, 3-inch thermal POS roll printers or standard A4 laser printers.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center flex-shrink-0">
            <Barcode size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">USB Barcode Scanner Support</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Plug in any standard USB barcode gun to scan items directly into the bill without touching your keyboard.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Keyboard size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Lightning Keyboard Shortcuts</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Use `Alt+S` for New Sale, `Alt+P` for Purchase, `Ctrl+F` to search, and `Alt+Enter` to save bill instantly.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Real-Time Cloud & Local Sync</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              All transactions, items, and parties automatically sync across all your devices with offline resilience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
