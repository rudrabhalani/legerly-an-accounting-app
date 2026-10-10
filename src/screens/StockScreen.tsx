import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { calculateCurrentStock, calculateTotalStockValue } from '../utils/accounting';
import { formatINR } from '../utils/formatters';
import { exportStockToExcel } from '../services/excelService';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  Check,
  PlayCircle,
  HelpCircle,
  ExternalLink,
  Barcode,
  Tag,
  Filter,
} from 'lucide-react';
import { Item } from '../types';

export const StockScreen: React.FC = () => {
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const openItemModal = useLedgerlyStore((state) => state.openItemModal);
  const adjustStock = useLedgerlyStore((state) => state.adjustStock);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState<Item | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustDirection, setAdjustDirection] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('Correction / Damage');

  const { totalValue, lowStockItems } = calculateTotalStockValue(items, stockMovements);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category && !item.isDeleted) set.add(item.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const activeItems = useMemo(() => {
    return items
      .filter((i) => !i.isDeleted)
      .filter((i) => {
        if (selectedCategory !== 'ALL' && i.category !== selectedCategory) return false;
        const q = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.hsn && i.hsn.includes(q))
        );
      })
      .filter((i) => {
        if (!filterLowStockOnly) return true;
        const current = calculateCurrentStock(i, stockMovements);
        return current <= i.minStock;
      });
  }, [items, search, selectedCategory, filterLowStockOnly, stockMovements]);

  const handleExecuteAdjustment = () => {
    if (!selectedItemForAdjustment) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid adjustment quantity.');
      return;
    }

    adjustStock(selectedItemForAdjustment.id, qty, adjustDirection, adjustReason);
    setSelectedItemForAdjustment(null);
    setAdjustQty('');
  };

  const isCompletelyEmpty = items.filter((i) => !i.isDeleted).length === 0;

  return (
    <div className="space-y-3.5 pb-28 pt-2 max-w-xl lg:max-w-4xl mx-auto">
      {/* CASE 1: EMPTY STATE — EXACT VYAPAR SCREENSHOT 4 */}
      {isCompletelyEmpty ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          {/* 3D Isometric Cardboard Box Illustration */}
          <div className="relative mb-6">
            <div className="w-36 h-36 bg-gradient-to-tr from-amber-100 to-amber-50 rounded-full flex items-center justify-center shadow-inner">
              <svg
                width="84"
                height="84"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform -rotate-6"
              >
                {/* 3D Box Back Flap */}
                <path d="M50 18 L78 32 L50 46 L22 32 Z" fill="#E6A15C" />
                {/* Top Flap Left */}
                <path d="M22 32 L10 22 L38 12 L50 18 Z" fill="#F4B877" opacity="0.8" />
                {/* Top Flap Right */}
                <path d="M78 32 L90 22 L62 12 L50 18 Z" fill="#D98E45" opacity="0.8" />
                {/* Left Side */}
                <path d="M22 32 L50 46 L50 82 L22 68 Z" fill="#D98E45" />
                {/* Right Side */}
                <path d="M50 46 L78 32 L78 68 L50 82 Z" fill="#B8732E" />
                {/* Tape seal */}
                <path d="M47 38 L53 35 L53 80 L47 81 Z" fill="#FCE79C" opacity="0.9" />
              </svg>
            </div>

            {/* Sparkles / Confetti */}
            <div className="absolute top-1 right-2 text-amber-400 text-lg animate-pulse">✨</div>
            <div className="absolute bottom-2 left-2 text-amber-500 text-sm">✦</div>
          </div>

          {/* Heading */}
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
            Hey! You have not added any items yet.
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 max-w-xs mt-1.5 font-medium">
            Add your first item now to manage stock, quick billing and profit reports.
          </p>

          {/* Red Pill Button: + Add New Item (Exact Screenshot 4) */}
          <div className="mt-6">
            <button
              type="button"
              onClick={openItemModal}
              className="px-6 py-3 rounded-full bg-[#E31E38] hover:bg-[#C91830] text-white font-extrabold text-sm flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              <Package size={18} />
              <span>Add New Item</span>
            </button>
          </div>

          {/* Bottom Tutorial Video Banner (Exact Screenshot 4) */}
          <div className="mt-12 w-full max-w-sm rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-3.5 flex items-center gap-3 text-left shadow-xs">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <PlayCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-gray-900 leading-tight">
                How to use Items in Vyapar?
              </h4>
              <p className="text-[11px] text-gray-600 truncate mt-0.5">
                Watch 2 min video guide to get started
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
          </div>
        </div>
      ) : (
        /* CASE 2: ITEMS LIST PRESENT */
        <>
          {/* 1. Header Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white shadow-sm">
            <div className="flex items-center justify-between opacity-90 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Total Stock Valuation
              </span>
              <Layers size={18} className="text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums mt-1 text-white">
              {formatINR(totalValue)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-700/60">
              <span>{items.filter((i) => !i.isDeleted).length} Total Items</span>
              <span className={lowStockItems.length > 0 ? 'text-amber-400 font-bold' : ''}>
                {lowStockItems.length} Low Stock Alert
              </span>
            </div>
          </div>

          {/* 2. Search, Export & Category Bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items by name, category, HSN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#1A73E8] shadow-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => exportStockToExcel(items)}
                className="p-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-emerald-700 shadow-xs active:scale-95 transition-all"
                title="Export Inventory to Excel"
              >
                <FileSpreadsheet size={18} />
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat === 'ALL' ? 'All Items' : cat}
                </button>
              ))}

              {lowStockItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 border transition-all ${
                    filterLowStockOnly
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-gray-200 text-amber-700 hover:border-amber-300'
                  }`}
                >
                  <AlertTriangle size={12} />
                  <span>Low Stock ({lowStockItems.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Items List */}
          {activeItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <Package size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">No matching items found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {activeItems.map((item) => {
                const currentStock = calculateCurrentStock(item, stockMovements);
                const isLow = currentStock <= item.minStock;
                const itemStockValue = currentStock * item.purchasePrice;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A73E8] font-bold text-xs flex-shrink-0">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-gray-900 leading-tight">
                            {item.name}
                          </h4>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Low
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 block">
                          Sale: {formatINR(item.salePrice)} • Cost: {formatINR(item.purchasePrice)} • {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-sm font-black tabular-nums ${
                            isLow ? 'text-amber-600' : 'text-gray-900'
                          }`}
                        >
                          {currentStock} {item.unit}
                        </span>
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          Val: {formatINR(itemStockValue)}
                        </span>
                      </div>

                      {/* Stock Adjustment Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemForAdjustment(item);
                          setAdjustQty('1');
                          setAdjustDirection('IN');
                        }}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                        title="Adjust Stock"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Red Pill Button: + Add New Item (Exact Screenshot 4) */}
          <div className="fixed bottom-20 right-4 sm:right-8 z-30">
            <button
              type="button"
              onClick={openItemModal}
              className="h-12 px-5 rounded-full bg-[#E31E38] hover:bg-[#C91830] text-white font-extrabold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              <Package size={18} />
              <span>Add New Item</span>
            </button>
          </div>
        </>
      )}

      {/* Stock Adjustment Modal */}
      {selectedItemForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">Adjust Stock</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedItemForAdjustment.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForAdjustment(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustDirection('IN')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustDirection === 'IN'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Stock IN (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDirection('OUT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustDirection === 'OUT'
                      ? 'bg-rose-50 border-rose-500 text-rose-700'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <TrendingDown size={14} />
                  <span>Stock OUT (-)</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Quantity ({selectedItemForAdjustment.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:border-[#1A73E8]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Correction, Damage, Found, etc."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#1A73E8]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedItemForAdjustment(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAdjustment}
                className="flex-1 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm"
              >
                Confirm Adjust
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
