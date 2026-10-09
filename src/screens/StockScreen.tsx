import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import { calculateCurrentStock, calculateTotalStockValue } from '../utils/accounting';
import { formatINR } from '../utils/formatters';
import { exportStockToExcel } from '../services/excelService';
import { EmptyState } from '../components/common/EmptyState';
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
} from 'lucide-react';
import { Item } from '../types';

export const StockScreen: React.FC = () => {
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const openItemModal = useLedgerlyStore((state) => state.openItemModal);
  const adjustStock = useLedgerlyStore((state) => state.adjustStock);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState<Item | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustDirection, setAdjustDirection] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('Correction / Damage');

  const { totalValue, lowStockItems } = calculateTotalStockValue(items, stockMovements);

  const activeItems = items
    .filter((i) => !i.isDeleted)
    .filter((i) => {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    })
    .filter((i) => {
      if (!filterLowStockOnly) return true;
      const current = calculateCurrentStock(i, stockMovements);
      return current <= i.minStock;
    });

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

  return (
    <div className="space-y-3 pb-24 pt-2">
      {/* 1. Header Summary Card */}
      <div className="p-4 rounded-card bg-gradient-to-br from-indigo-700 to-indigo-900 text-white shadow-elevated">
        <div className="flex items-center justify-between opacity-90 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Stock Inventory</span>
          <Layers size={18} />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tabular-nums mt-1">
          {formatINR(totalValue)}
        </div>
        <div className="flex items-center justify-between text-xs opacity-80 mt-2 pt-2 border-t border-indigo-600/60">
          <span>{items.filter((i) => !i.isDeleted).length} Total Items</span>
          <span className={lowStockItems.length > 0 ? 'text-amber-300 font-bold' : ''}>
            {lowStockItems.length} Low Stock Alert
          </span>
        </div>
      </div>

      {/* 2. Search, Filter & Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-secondary" />
          <input
            type="text"
            placeholder="Search items by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-border text-sm text-slate-primary focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => exportStockToExcel(items)}
          className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-border text-emerald-700 shadow-xs active:scale-95 transition-all"
          title="Export Inventory to Excel"
        >
          <FileSpreadsheet size={18} />
        </button>

        <button
          type="button"
          onClick={openItemModal}
          className="h-10 px-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
        >
          <Plus size={16} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Low stock filter toggle chip */}
      {lowStockItems.length > 0 && (
        <button
          type="button"
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
            filterLowStockOnly
              ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
              : 'bg-white border-border text-slate-secondary hover:text-slate-primary'
          }`}
        >
          <AlertTriangle size={14} className="text-amber-600" />
          <span>Show Low Stock Only ({lowStockItems.length})</span>
        </button>
      )}

      {/* Items List */}
      {activeItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t.noStockYet}
          description="Track quantities, purchase costs, and profit margins automatically."
          actionLabel="Add First Item"
          onAction={openItemModal}
        />
      ) : (
        <div className="bg-white rounded-card border border-border shadow-card divide-y divide-border overflow-hidden">
          {activeItems.map((item) => {
            const currentStock = calculateCurrentStock(item, stockMovements);
            const isLow = currentStock <= item.minStock;
            const itemStockValue = currentStock * item.purchasePrice;

            return (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-primary leading-tight">
                        {item.name}
                      </h4>
                      {isLow && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Low
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-secondary mt-0.5 block">
                      Sale: {formatINR(item.salePrice)} • Cost: {formatINR(item.purchasePrice)} • {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        isLow ? 'text-amber-600' : 'text-slate-primary'
                      }`}
                    >
                      {currentStock} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-secondary tabular-nums">
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
                    className="p-1.5 rounded-xl bg-surface-subtle hover:bg-slate-200/60 text-slate-secondary hover:text-slate-primary border border-border"
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

      {/* Manual Stock Adjustment Dialog Modal */}
      {selectedItemForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-floating border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h4 className="text-sm font-bold text-slate-primary">Stock Adjustment</h4>
                <span className="text-xs text-slate-secondary">{selectedItemForAdjustment.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForAdjustment(null)}
                className="p-1 rounded-full text-slate-secondary"
              >
                <X size={18} />
              </button>
            </div>

            {/* In / Out Mode */}
            <div className="grid grid-cols-2 p-1 bg-surface-subtle rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setAdjustDirection('IN')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                  adjustDirection === 'IN'
                    ? 'bg-moneyIn text-white shadow-xs'
                    : 'text-slate-secondary'
                }`}
              >
                <TrendingUp size={14} /> Add Stock (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustDirection('OUT')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                  adjustDirection === 'OUT'
                    ? 'bg-moneyOut text-white shadow-xs'
                    : 'text-slate-secondary'
                }`}
              >
                <TrendingDown size={14} /> Reduce Stock (−)
              </button>
            </div>

            {/* Qty */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Quantity to Adjust ({selectedItemForAdjustment.unit})
              </label>
              <input
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-bold text-slate-primary focus:outline-none focus:border-primary tabular-nums"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Reason
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              >
                <option value="Damage / Breakage">Damage / Breakage</option>
                <option value="Physical Count Correction">Physical Count Correction</option>
                <option value="Gift / Sample">Gift / Sample</option>
                <option value="Customer Return">Customer Return</option>
                <option value="Supplier Return">Supplier Return</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForAdjustment(null)}
                className="flex-1 h-10 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAdjustment}
                className="flex-1 h-10 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1"
              >
                <Check size={16} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
