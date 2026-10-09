/**
 * Indian GST Tax Calculation & Math Engine
 * All calculations use integer paise to avoid any floating-point arithmetic errors.
 */

import { DiscountType, InvoiceLine } from '../types';

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
