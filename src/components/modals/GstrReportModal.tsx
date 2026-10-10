import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { calculateGstr1, calculateGstr3b } from '../../utils/gstCalc';
import { formatINR, paiseToRupees } from '../../utils/formatters';
import { exportGstSummaryToExcel } from '../../services/excelService';
import { generateRegisterPdf } from '../../services/pdfService';
import {
  X,
  FileSpreadsheet,
  Download,
  Building2,
  FileText,
  Boxes,
  HelpCircle,
  Percent,
} from 'lucide-react';

export const GstrReportModal: React.FC = () => {
  const isGstrReportModalOpen = useLedgerlyStore((state) => state.isGstrReportModalOpen);
  const closeGstrReportModal = useLedgerlyStore((state) => state.closeGstrReportModal);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const parties = useLedgerlyStore((state) => state.parties);
  const business = useLedgerlyStore((state) => state.business);

  const [activeTab, setActiveTab] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');
  const [gstr1SubTab, setGstr1SubTab] = useState<'B2B' | 'B2C' | 'HSN'>('B2B');

  const gstr1 = useMemo(() => calculateGstr1(invoices, parties), [invoices, parties]);
  const gstr3b = useMemo(() => calculateGstr3b(invoices), [invoices]);

  if (!isGstrReportModalOpen) return null;

  const handleExportExcel = () => {
    const sales = invoices.filter((i) => !i.isDeleted && (i.type === 'SALE' || i.type === 'SALE_RETURN'));
    const purchases = invoices.filter((i) => !i.isDeleted && (i.type === 'PURCHASE' || i.type === 'PURCHASE_RETURN'));
    exportGstSummaryToExcel(sales, purchases);
  };

  const handleExportPdf = () => {
    const doc = generateRegisterPdf('GST Summary Register', invoices, business);
    doc.save('GST-Summary.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                GST Returns Report
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                  GST Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                GSTR-1 Outward Supplies & GSTR-3B Tax Summary for Indian MSMEs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel Export
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-600" />
              PDF
            </button>
            <button
              onClick={closeGstrReportModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Return Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-6 gap-6">
          <button
            onClick={() => setActiveTab('GSTR1')}
            className={`py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'GSTR1'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            GSTR-1 (Outward Supplies / Sales)
          </button>
          <button
            onClick={() => setActiveTab('GSTR3B')}
            className={`py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'GSTR3B'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            GSTR-3B (Tax Liability & ITC)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'GSTR1' ? (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Total Turnover</div>
                  <div className="text-lg font-bold text-slate-800 mt-1">
                    {formatINR(gstr1.totalInvoiceValuePaise)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200/80">
                  <div className="text-xs text-indigo-600 font-medium">Taxable Value</div>
                  <div className="text-lg font-bold text-indigo-900 mt-1">
                    {formatINR(gstr1.totalTaxablePaise)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                  <div className="text-xs text-emerald-600 font-medium">CGST + SGST</div>
                  <div className="text-lg font-bold text-emerald-900 mt-1">
                    {formatINR(gstr1.totalCgstPaise + gstr1.totalSgstPaise)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <div className="text-xs text-amber-700 font-medium">IGST Total</div>
                  <div className="text-lg font-bold text-amber-900 mt-1">
                    {formatINR(gstr1.totalIgstPaise)}
                  </div>
                </div>
              </div>

              {/* GSTR-1 Sub-tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setGstr1SubTab('B2B')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    gstr1SubTab === 'B2B'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  B2B Registered ({gstr1.b2bRows.length})
                </button>
                <button
                  onClick={() => setGstr1SubTab('B2C')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    gstr1SubTab === 'B2C'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  B2C Small ({gstr1.b2cRows.length})
                </button>
                <button
                  onClick={() => setGstr1SubTab('HSN')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    gstr1SubTab === 'HSN'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  HSN Summary ({gstr1.hsnRows.length})
                </button>
              </div>

              {/* Sub-tab Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {gstr1SubTab === 'B2B' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">GSTIN / UIN</th>
                          <th className="py-3 px-4">Party Name</th>
                          <th className="py-3 px-4">Bill No</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Invoice Value</th>
                          <th className="py-3 px-4 text-right">Taxable</th>
                          <th className="py-3 px-4 text-right">CGST</th>
                          <th className="py-3 px-4 text-right">SGST</th>
                          <th className="py-3 px-4 text-right">IGST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gstr1.b2bRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400">
                              No B2B sales registered with customer GSTIN yet.
                            </td>
                          </tr>
                        ) : (
                          gstr1.b2bRows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                                {r.gstin}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-800">{r.partyName}</td>
                              <td className="py-3 px-4 text-slate-600">{r.invoiceNumber}</td>
                              <td className="py-3 px-4 text-slate-500">{r.invoiceDate}</td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                {formatINR(r.invoiceValuePaise)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                                {formatINR(r.taxableValuePaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.cgstPaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.sgstPaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.igstPaise)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {gstr1SubTab === 'B2C' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Place of Supply (State)</th>
                          <th className="py-3 px-4 text-right">Taxable Value</th>
                          <th className="py-3 px-4 text-right">CGST</th>
                          <th className="py-3 px-4 text-right">SGST</th>
                          <th className="py-3 px-4 text-right">IGST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gstr1.b2cRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No B2C unregistered sales found.
                            </td>
                          </tr>
                        ) : (
                          gstr1.b2cRows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                {r.placeOfSupply}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                {formatINR(r.taxableValuePaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.cgstPaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.sgstPaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.igstPaise)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {gstr1SubTab === 'HSN' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">HSN/SAC</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Unit</th>
                          <th className="py-3 px-4 text-right">Total Qty</th>
                          <th className="py-3 px-4 text-right">Total Value</th>
                          <th className="py-3 px-4 text-right">Taxable Value</th>
                          <th className="py-3 px-4 text-right">Central Tax</th>
                          <th className="py-3 px-4 text-right">State Tax</th>
                          <th className="py-3 px-4 text-right">Integrated Tax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gstr1.hsnRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400">
                              No HSN item data recorded.
                            </td>
                          </tr>
                        ) : (
                          gstr1.hsnRows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.hsn}</td>
                              <td className="py-3 px-4 text-slate-700">{r.description}</td>
                              <td className="py-3 px-4 text-slate-500 uppercase">{r.unit}</td>
                              <td className="py-3 px-4 text-right font-medium text-slate-700">
                                {r.totalQty}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                {formatINR(r.totalValuePaise)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                                {formatINR(r.taxableValuePaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.cgstPaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.sgstPaise)}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatINR(r.igstPaise)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* GSTR-3B View */
            <div className="space-y-6">
              {/* Table 3.1: Outward Supplies */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                      3.1
                    </span>
                    Details of Outward Supplies and inward supplies liable to reverse charge
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">Taxable Value</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.outwardTaxableSupplies.taxableValuePaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">IGST</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.outwardTaxableSupplies.igstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">CGST</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.outwardTaxableSupplies.cgstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">SGST</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.outwardTaxableSupplies.sgstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">Cess</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.outwardTaxableSupplies.cessPaise)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table 4: Eligible ITC */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                      4
                    </span>
                    Eligible Input Tax Credit (ITC) from Purchases
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">Purchases Taxable</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.eligibleItc.taxableValuePaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">ITC IGST</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.eligibleItc.igstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">ITC CGST</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.eligibleItc.cgstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">ITC SGST</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.eligibleItc.sgstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[11px] text-slate-500">ITC Cess</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {formatINR(gstr3b.eligibleItc.cessPaise)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table 5.1: Net GST Payable */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                      5.1
                    </span>
                    Net GST Payable (Output Tax Liability minus Eligible ITC)
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <div className="text-[11px] text-slate-500">Net IGST Payable</div>
                    <div className="font-bold text-slate-900 text-sm mt-1">
                      {formatINR(gstr3b.netTaxPayable.igstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <div className="text-[11px] text-slate-500">Net CGST Payable</div>
                    <div className="font-bold text-slate-900 text-sm mt-1">
                      {formatINR(gstr3b.netTaxPayable.cgstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <div className="text-[11px] text-slate-500">Net SGST Payable</div>
                    <div className="font-bold text-slate-900 text-sm mt-1">
                      {formatINR(gstr3b.netTaxPayable.sgstPaise)}
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-600 text-white rounded-xl">
                    <div className="text-[11px] text-indigo-100 font-medium">Total Net Tax Due</div>
                    <div className="font-bold text-lg mt-1">
                      {formatINR(gstr3b.netTaxPayable.totalPaise)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
