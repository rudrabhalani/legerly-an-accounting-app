/**
 * Indian GST Tax Calculation & Math Engine
 * All calculations use integer paise to avoid any floating-point arithmetic errors.
 */

import { DiscountType, InvoiceLine, Invoice, Party } from '../types';

export interface LineCalcInput {
  qty: number;
  ratePaise: number;
  discountType?: DiscountType;
  discountPercent?: number;
  discountAmountPaise?: number;
  taxPercent: number; // 0, 0.25, 3, 5, 12, 18, 28
  taxIncluded?: boolean; // Rate includes GST vs Rate excludes GST
  withGst?: boolean;
  isInterState?: boolean;
}

export interface LineCalcResult {
  grossPaise: number;
  discountPaise: number;
  afterDiscountPaise: number;
  taxableAmountPaise: number;
  taxPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  rowTotalPaise: number;
}

export function calculateLineGST(input: LineCalcInput): LineCalcResult {
  const {
    qty = 1,
    ratePaise = 0,
    discountType = 'PERCENT',
    discountPercent = 0,
    discountAmountPaise = 0,
    taxPercent = 0,
    taxIncluded = false,
    withGst = true,
    isInterState = false,
  } = input;

  const grossPaise = Math.round(qty * ratePaise);

  let discountPaise = 0;
  if (discountType === 'FLAT') {
    discountPaise = Math.min(grossPaise, Math.round(discountAmountPaise));
  } else {
    discountPaise = Math.round(grossPaise * ((discountPercent || 0) / 100));
  }

  const afterDiscountPaise = Math.max(0, grossPaise - discountPaise);

  if (!withGst || taxPercent <= 0) {
    return {
      grossPaise,
      discountPaise,
      afterDiscountPaise,
      taxableAmountPaise: afterDiscountPaise,
      taxPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      rowTotalPaise: afterDiscountPaise,
    };
  }

  let taxableAmountPaise = 0;
  let taxPaise = 0;
  let rowTotalPaise = 0;

  if (taxIncluded) {
    // Rate includes GST:
    // rowTotal = afterDiscount
    // taxable = rowTotal / (1 + taxPercent / 100)
    // tax = rowTotal - taxable
    rowTotalPaise = afterDiscountPaise;
    taxableAmountPaise = Math.round(rowTotalPaise / (1 + taxPercent / 100));
    taxPaise = rowTotalPaise - taxableAmountPaise;
  } else {
    // Rate excludes GST:
    // taxable = afterDiscount
    // tax = taxable * (taxPercent / 100)
    // rowTotal = taxable + tax
    taxableAmountPaise = afterDiscountPaise;
    taxPaise = Math.round(taxableAmountPaise * (taxPercent / 100));
    rowTotalPaise = taxableAmountPaise + taxPaise;
  }

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isInterState) {
    igstPaise = taxPaise;
  } else {
    cgstPaise = Math.round(taxPaise / 2);
    sgstPaise = taxPaise - cgstPaise;
  }

  return {
    grossPaise,
    discountPaise,
    afterDiscountPaise,
    taxableAmountPaise,
    taxPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    rowTotalPaise,
  };
}

export interface InvoiceTotalsResult {
  subtotalPaise: number;
  discountTotalPaise: number;
  taxableAmountPaise: number;
  cgstTotalPaise: number;
  sgstTotalPaise: number;
  igstTotalPaise: number;
  taxTotalPaise: number;
  extraChargesPaise: number;
  unroundedTotalPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
}

export function calculateInvoiceTotals(
  lines: InvoiceLine[],
  extraChargesPaise: number = 0,
  withGst: boolean = true,
  isInterState: boolean = false
): InvoiceTotalsResult {
  let subtotalPaise = 0;
  let discountTotalPaise = 0;
  let taxableAmountPaise = 0;
  let cgstTotalPaise = 0;
  let sgstTotalPaise = 0;
  let igstTotalPaise = 0;
  let taxTotalPaise = 0;

  for (const line of lines) {
    const calc = calculateLineGST({
      qty: line.qty,
      ratePaise: line.rate,
      discountType: line.discountType,
      discountPercent: line.discountPercent,
      discountAmountPaise: line.discountAmount,
      taxPercent: line.taxPercent,
      taxIncluded: line.taxIncluded,
      withGst,
      isInterState,
    });

    subtotalPaise += calc.grossPaise;
    discountTotalPaise += calc.discountPaise;
    taxableAmountPaise += calc.taxableAmountPaise;
    cgstTotalPaise += calc.cgstPaise;
    sgstTotalPaise += calc.sgstPaise;
    igstTotalPaise += calc.igstPaise;
    taxTotalPaise += calc.taxPaise;
  }

  const unroundedTotalPaise = taxableAmountPaise + taxTotalPaise + extraChargesPaise;

  // Round off to nearest Rupee (100 paise)
  const remainderPaise = unroundedTotalPaise % 100;
  let roundOffPaise = 0;
  if (remainderPaise > 0) {
    if (remainderPaise >= 50) {
      roundOffPaise = 100 - remainderPaise; // + paise
    } else {
      roundOffPaise = -remainderPaise; // - paise
    }
  }

  const grandTotalPaise = Math.max(0, unroundedTotalPaise + roundOffPaise);

  return {
    subtotalPaise,
    discountTotalPaise,
    taxableAmountPaise,
    cgstTotalPaise,
    sgstTotalPaise,
    igstTotalPaise,
    taxTotalPaise,
    extraChargesPaise,
    unroundedTotalPaise,
    roundOffPaise,
    grandTotalPaise,
  };
}

/**
 * Converts Indian Rupee number into words (English)
 * e.g. 125000 -> "Rupees One Lakh Twenty-Five Thousand Only"
 */
export function numberToIndianWords(rupees: number): string {
  const abs = Math.floor(Math.abs(rupees));
  if (abs === 0) return 'Rupees Zero Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const t = tens[Math.floor(n / 10)];
    const u = units[n % 10];
    return u ? `${t}-${u}` : t;
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += `${units[h]} Hundred`;
    }
    if (rem > 0) {
      if (res) res += ' and ';
      res += convertTwoDigits(rem);
    }
    return res;
  }

  let crore = Math.floor(abs / 10000000);
  let lakh = Math.floor((abs % 10000000) / 100000);
  let thousand = Math.floor((abs % 100000) / 1000);
  let remainder = abs % 1000;

  let words = '';
  if (crore > 0) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (remainder > 0) {
    words += `${convertThreeDigits(remainder)} `;
  }

  return `Rupees ${words.trim()} Only`;
}

// ─────────────────────────────────────────────────────────────
// GSTR-1 & GSTR-3B REPORT ENGINES
// ─────────────────────────────────────────────────────────────

export interface Gstr1B2bRow {
  gstin: string;
  partyName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValuePaise: number;
  placeOfSupply: string;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  cessPaise: number;
}

export interface Gstr1B2cRow {
  placeOfSupply: string;
  rate: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  cessPaise: number;
}

export interface Gstr1HsnRow {
  hsn: string;
  description: string;
  unit: string;
  totalQty: number;
  totalValuePaise: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  cessPaise: number;
}

export interface Gstr1Summary {
  b2bRows: Gstr1B2bRow[];
  b2cRows: Gstr1B2cRow[];
  hsnRows: Gstr1HsnRow[];
  totalTaxablePaise: number;
  totalCgstPaise: number;
  totalSgstPaise: number;
  totalIgstPaise: number;
  totalCessPaise: number;
  totalTaxPaise: number;
  totalInvoiceValuePaise: number;
}

export interface Gstr3bSummary {
  outwardTaxableSupplies: {
    taxableValuePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    cessPaise: number;
  };
  eligibleItc: {
    taxableValuePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    cessPaise: number;
  };
  netTaxPayable: {
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    cessPaise: number;
    totalPaise: number;
  };
}

/**
 * Computes GSTR-1 summary for outward sales
 */
export function calculateGstr1(invoices: Invoice[], parties: Party[]): Gstr1Summary {
  const partyMap = new Map<string, Party>();
  for (const p of parties) {
    partyMap.set(p.id, p);
  }

  const salesInvoices = invoices.filter(
    (inv) => !inv.isDeleted && inv.type === 'SALE' && (inv.withGst ?? true)
  );

  const b2bRows: Gstr1B2bRow[] = [];
  const b2cMap = new Map<string, Gstr1B2cRow>();
  const hsnMap = new Map<string, Gstr1HsnRow>();

  let totalTaxablePaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalCessPaise = 0;
  let totalInvoiceValuePaise = 0;

  for (const inv of salesInvoices) {
    const party = partyMap.get(inv.partyId);
    const hasGstin = party?.gstin && party.gstin.trim().length === 15;
    const pos = inv.placeOfSupply || inv.stateOfSupply || party?.state || 'Local';

    totalTaxablePaise += inv.taxableAmount || (inv.total - inv.taxTotal);
    totalCgstPaise += inv.cgstTotal || 0;
    totalSgstPaise += inv.sgstTotal || 0;
    totalIgstPaise += inv.igstTotal || 0;
    totalCessPaise += inv.cessTotal || 0;
    totalInvoiceValuePaise += inv.total;

    if (hasGstin) {
      // B2B supply
      b2bRows.push({
        gstin: party!.gstin!.toUpperCase(),
        partyName: inv.partyName,
        invoiceNumber: inv.number,
        invoiceDate: inv.date,
        invoiceValuePaise: inv.total,
        placeOfSupply: pos,
        taxableValuePaise: inv.taxableAmount || (inv.total - inv.taxTotal),
        cgstPaise: inv.cgstTotal || 0,
        sgstPaise: inv.sgstTotal || 0,
        igstPaise: inv.igstTotal || 0,
        cessPaise: inv.cessTotal || 0,
      });
    } else {
      // B2C supply (grouped by POS + tax rate)
      const key = `${pos}_mixed`;
      const existing = b2cMap.get(key);
      const taxable = inv.taxableAmount || (inv.total - inv.taxTotal);
      if (existing) {
        existing.taxableValuePaise += taxable;
        existing.cgstPaise += inv.cgstTotal || 0;
        existing.sgstPaise += inv.sgstTotal || 0;
        existing.igstPaise += inv.igstTotal || 0;
        existing.cessPaise += inv.cessTotal || 0;
      } else {
        b2cMap.set(key, {
          placeOfSupply: pos,
          rate: 18, // generic mixed
          taxableValuePaise: taxable,
          cgstPaise: inv.cgstTotal || 0,
          sgstPaise: inv.sgstTotal || 0,
          igstPaise: inv.igstTotal || 0,
          cessPaise: inv.cessTotal || 0,
        });
      }
    }

    // Line items HSN summary
    for (const line of inv.lines) {
      const code = line.hsn || '999999';
      const existing = hsnMap.get(code);
      if (existing) {
        existing.totalQty += line.qty;
        existing.totalValuePaise += line.amount;
        existing.taxableValuePaise += line.taxableAmount || line.amount;
        existing.cgstPaise += line.cgst || 0;
        existing.sgstPaise += line.sgst || 0;
        existing.igstPaise += line.igst || 0;
        existing.cessPaise += line.cess || 0;
      } else {
        hsnMap.set(code, {
          hsn: code,
          description: line.itemName,
          unit: line.unit || 'pcs',
          totalQty: line.qty,
          totalValuePaise: line.amount,
          taxableValuePaise: line.taxableAmount || line.amount,
          cgstPaise: line.cgst || 0,
          sgstPaise: line.sgst || 0,
          igstPaise: line.igst || 0,
          cessPaise: line.cess || 0,
        });
      }
    }
  }

  const totalTaxPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise + totalCessPaise;

  return {
    b2bRows,
    b2cRows: Array.from(b2cMap.values()),
    hsnRows: Array.from(hsnMap.values()),
    totalTaxablePaise,
    totalCgstPaise,
    totalSgstPaise,
    totalIgstPaise,
    totalCessPaise,
    totalTaxPaise,
    totalInvoiceValuePaise,
  };
}

/**
 * Computes GSTR-3B summary (Outward Tax Liability vs Inward Input Tax Credit)
 */
export function calculateGstr3b(invoices: Invoice[]): Gstr3bSummary {
  const activeInvoices = invoices.filter((i) => !i.isDeleted && (i.withGst ?? true));

  let outTaxable = 0;
  let outCgst = 0;
  let outSgst = 0;
  let outIgst = 0;
  let outCess = 0;

  let inTaxable = 0;
  let inCgst = 0;
  let inSgst = 0;
  let inIgst = 0;
  let inCess = 0;

  for (const inv of activeInvoices) {
    if (inv.type === 'SALE') {
      outTaxable += inv.taxableAmount || (inv.total - inv.taxTotal);
      outCgst += inv.cgstTotal || 0;
      outSgst += inv.sgstTotal || 0;
      outIgst += inv.igstTotal || 0;
      outCess += inv.cessTotal || 0;
    } else if (inv.type === 'SALE_RETURN') {
      outTaxable -= inv.taxableAmount || (inv.total - inv.taxTotal);
      outCgst -= inv.cgstTotal || 0;
      outSgst -= inv.sgstTotal || 0;
      outIgst -= inv.igstTotal || 0;
      outCess -= inv.cessTotal || 0;
    } else if (inv.type === 'PURCHASE') {
      inTaxable += inv.taxableAmount || (inv.total - inv.taxTotal);
      inCgst += inv.cgstTotal || 0;
      inSgst += inv.sgstTotal || 0;
      inIgst += inv.igstTotal || 0;
      inCess += inv.cessTotal || 0;
    } else if (inv.type === 'PURCHASE_RETURN') {
      inTaxable -= inv.taxableAmount || (inv.total - inv.taxTotal);
      inCgst -= inv.cgstTotal || 0;
      inSgst -= inv.sgstTotal || 0;
      inIgst -= inv.igstTotal || 0;
      inCess -= inv.cessTotal || 0;
    }
  }

  const netCgst = Math.max(0, outCgst - inCgst);
  const netSgst = Math.max(0, outSgst - inSgst);
  const netIgst = Math.max(0, outIgst - inIgst);
  const netCess = Math.max(0, outCess - inCess);

  return {
    outwardTaxableSupplies: {
      taxableValuePaise: Math.max(0, outTaxable),
      cgstPaise: Math.max(0, outCgst),
      sgstPaise: Math.max(0, outSgst),
      igstPaise: Math.max(0, outIgst),
      cessPaise: Math.max(0, outCess),
    },
    eligibleItc: {
      taxableValuePaise: Math.max(0, inTaxable),
      cgstPaise: Math.max(0, inCgst),
      sgstPaise: Math.max(0, inSgst),
      igstPaise: Math.max(0, inIgst),
      cessPaise: Math.max(0, inCess),
    },
    netTaxPayable: {
      cgstPaise: netCgst,
      sgstPaise: netSgst,
      igstPaise: netIgst,
      cessPaise: netCess,
      totalPaise: netCgst + netSgst + netIgst + netCess,
    },
  };
}

