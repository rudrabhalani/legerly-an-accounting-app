import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { UnitType } from '../../types';
import { rupeesToPaise } from '../../utils/formatters';
import { PackagePlus, X, Check, ScanBarcode } from 'lucide-react';

export const ItemModal: React.FC = () => {
  const isItemModalOpen = useLedgerlyStore((state) => state.isItemModalOpen);
  const closeItemModal = useLedgerlyStore((state) => state.closeItemModal);
  const addItem = useLedgerlyStore((state) => state.addItem);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState<UnitType>('pcs');
  const [salePriceStr, setSalePriceStr] = useState('');
  const [purchasePriceStr, setPurchasePriceStr] = useState('');
  const [openingStockStr, setOpeningStockStr] = useState('');
  const [minStockStr, setMinStockStr] = useState('5');
  const [taxPercent, setTaxPercent] = useState('5');
  const [hsn, setHsn] = useState('');
  const [barcode, setBarcode] = useState('');

  if (!isItemModalOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter item name.');
      return;
    }

    const salePaise = salePriceStr ? rupeesToPaise(parseFloat(salePriceStr) || 0) : 0;
    const purchasePaise = purchasePriceStr ? rupeesToPaise(parseFloat(purchasePriceStr) || 0) : 0;
    const openingStock = parseInt(openingStockStr) || 0;
    const minStock = parseInt(minStockStr) || 0;

    addItem({
      name: name.trim(),
      category: category.trim() || 'General',
      unit,
      salePrice: salePaise,
      purchasePrice: purchasePaise,
      openingStock,
      minStock,
      taxPercent: parseFloat(taxPercent) || 0,
      hsn: hsn.trim() || undefined,
      barcode: barcode.trim() || undefined,
    });

    closeItemModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <PackagePlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Add Inventory Item</h3>
              <p className="text-xs text-slate-secondary">Track stock levels and prices</p>
            </div>
          </div>
          <button type="button" onClick={closeItemModal} className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3.5 py-4 max-h-[70vh] overflow-y-auto">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Fortune Sunflower Oil 1L"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-semibold text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Groceries"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs font-medium text-slate-primary focus:outline-none focus:border-primary"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="litre">Litre (L)</option>
                <option value="box">Box</option>
                <option value="packet">Packet</option>
                <option value="dozen">Dozen</option>
                <option value="meter">Meter</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Sale Price (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={salePriceStr}
                onChange={(e) => setSalePriceStr(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-bold text-moneyIn focus:outline-none focus:border-primary tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={purchasePriceStr}
                onChange={(e) => setPurchasePriceStr(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-bold text-slate-primary focus:outline-none focus:border-primary tabular-nums"
              />
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Opening Stock
              </label>
              <input
                type="number"
                placeholder="0"
                value={openingStockStr}
                onChange={(e) => setOpeningStockStr(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs font-medium text-slate-primary focus:outline-none focus:border-primary tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Min Stock Alert Level
              </label>
              <input
                type="number"
                placeholder="5"
                value={minStockStr}
                onChange={(e) => setMinStockStr(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs font-medium text-warning-hover focus:outline-none focus:border-primary tabular-nums"
              />
            </div>
          </div>

          {/* Tax % and HSN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Tax / GST %
              </label>
              <select
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs font-medium text-slate-primary focus:outline-none focus:border-primary"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                HSN Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 1006"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Barcode / SKU
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Scan or enter item barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setBarcode(`890${Math.floor(100000000 + Math.random() * 900000000)}`)}
                title="Simulate barcode camera scan"
                className="absolute right-2 text-slate-secondary hover:text-primary p-1"
              >
                <ScanBarcode size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={closeItemModal}
            className="flex-1 h-12 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check size={16} /> Save Item
          </button>
        </div>
      </div>
    </div>
  );
};
