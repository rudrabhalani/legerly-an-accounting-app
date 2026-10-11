import React, { useState, useMemo } from 'react';
import { Item, UnitType } from '../../types';
import { paiseToRupees } from '../../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  Sparkles,
  PackagePlus,
  X,
} from 'lucide-react';

export interface StagedItem {
  item: Item;
  qty: number;
  ratePaise: number; // in paise
}

interface FastItemSelectorProps {
  items: Item[];
  type?: 'SALE' | 'PURCHASE' | string;
  onAddSelectedItems: (stagedItems: StagedItem[]) => void;
  onOpenQuickAddItem: () => void;
}

export const FastItemSelector: React.FC<FastItemSelectorProps> = ({
  items,
  type = 'SALE',
  onAddSelectedItems,
  onOpenQuickAddItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  // Map of itemId -> StagedItem
  const [stagedMap, setStagedMap] = useState<Record<string, StagedItem>>({});

  // Active items (not deleted)
  const activeItems = useMemo(() => items.filter((i) => !i.isDeleted), [items]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeItems.forEach((i) => {
      if (i.category && i.category.trim()) cats.add(i.category.trim());
    });
    return ['ALL', ...Array.from(cats)];
  }, [activeItems]);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activeItems.filter((i) => {
      const matchesCat = selectedCategory === 'ALL' || i.category === selectedCategory;
      const matchesSearch = !q || i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [activeItems, selectedCategory, searchTerm]);

  // Toggle or increment staged item
  const handleToggleOrIncrement = (item: Item, delta = 1) => {
    setStagedMap((prev) => {
      const current = prev[item.id];
      const defaultRate = type === 'SALE' ? item.salePrice : item.purchasePrice;

      if (!current) {
        // First selection: default quantity 1
        return {
          ...prev,
          [item.id]: {
            item,
            qty: 1,
            ratePaise: defaultRate,
          },
        };
      }

      const nextQty = Math.round((current.qty + delta) * 1000) / 1000;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }

      return {
        ...prev,
        [item.id]: {
          ...current,
          qty: nextQty,
        },
      };
    });
  };

  // Set explicit quantity (e.g. 0.25, 0.5, 1.5)
  const handleSetQuantity = (item: Item, qty: number) => {
    setStagedMap((prev) => {
      const defaultRate = type === 'SALE' ? item.salePrice : item.purchasePrice;
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          item,
          qty,
          ratePaise: defaultRate,
        },
      };
    });
  };

  const stagedList = useMemo(() => Object.values(stagedMap), [stagedMap]);
  const stagedCount = stagedList.length;

  // Calculate staged total amount
  const stagedTotalPaise = useMemo(() => {
    return stagedList.reduce((acc, curr) => acc + Math.round(curr.qty * curr.ratePaise), 0);
  }, [stagedList]);

  const handleAddAll = () => {
    if (stagedList.length === 0) return;
    onAddSelectedItems(stagedList);
    setStagedMap({});
  };

  const handleClearStaged = () => {
    setStagedMap({});
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5 space-y-2.5 transition-all">
      {/* Top Header: Title, Search, and + New Item */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShoppingBag size={15} className="text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
            Fast Item Selection (Tap to Select)
          </h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {activeItems.length} Products
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenQuickAddItem}
          className="px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
        >
          <PackagePlus size={13} />
          <span>+ Add Product Master</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items (e.g. Kaju, Barfi, Laddu)..."
            className="w-full h-8 pl-8 pr-7 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Pills (horizontal scrollable) */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compact Products Grid (Max-h-52 with independent scroll) */}
      <div className="max-h-48 sm:max-h-56 overflow-y-auto overscroll-contain pr-1 divide-y-0">
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No products found matching "{searchTerm}". Click "+ Add Product Master" above to save it.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredItems.map((item) => {
              const staged = stagedMap[item.id];
              const isSelected = !!staged;
              const pricePaise = type === 'SALE' ? item.salePrice : item.purchasePrice;
              const displayPrice = paiseToRupees(pricePaise);
              const isWeightItem = item.unit === 'kg' || item.unit === 'g';

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-2 flex flex-col justify-between transition-all select-none border ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Top: Name & Price */}
                  <div
                    onClick={() => handleToggleOrIncrement(item, 1)}
                    className="cursor-pointer space-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-extrabold text-xs text-emerald-700">
                        ₹{displayPrice.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        /{item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Stepper / Fractional Controls when selected vs Quick Add when unselected */}
                  {isSelected ? (
                    <div className="mt-2 pt-1.5 border-t border-emerald-200/70 space-y-1">
                      {/* Stepper with - / Qty input / + */}
                      <div className="flex items-center justify-between gap-1 bg-white rounded-lg border border-emerald-300 p-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleOrIncrement(item, - (isWeightItem && staged.qty <= 1 ? 0.25 : 1));
                          }}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-extrabold text-xs active:scale-95"
                          title="Decrease"
                        >
                          <Minus size={11} />
                        </button>

                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={staged.qty}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleSetQuantity(item, isNaN(val) ? 0 : val);
                          }}
                          className="w-12 text-center text-xs font-extrabold text-slate-900 focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleOrIncrement(item, isWeightItem && staged.qty < 1 ? 0.25 : 1);
                          }}
                          className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-extrabold text-xs active:scale-95"
                          title="Increase"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Weight Presets for sweets/kg: 0.25, 0.5, 1 */}
                      {isWeightItem && (
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[0.25, 0.5, 1, 2].map((frac) => (
                            <button
                              key={frac}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetQuantity(item, frac);
                              }}
                              className={`flex-1 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                                staged.qty === frac
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-800'
                              }`}
                            >
                              {frac}k
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleOrIncrement(item, 1)}
                      className="mt-2 w-full py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Plus size={11} />
                      <span>Select</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prominent Sticky Action Bar: "Add Selected Items" */}
      {stagedCount > 0 && (
        <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold">
              {stagedCount}
            </span>
            <div>
              <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                {stagedCount} Item{stagedCount > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">
                Subtotal: ₹{paiseToRupees(stagedTotalPaise).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearStaged}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleAddAll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <Check size={14} />
              <span>Add Selected Items ({stagedCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
