import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale, numberToWords } from './themeHelpers';

export function renderGstTaxTheme({
  invoice,
  settings,
  business,
  party,
  account,
  qrDataUrl,
}: InvoiceThemeProps): string {
  const font = getFontScale(settings.fontSize);
  const showCustName = settings.showCustomerName !== false;
  const showCustPhone = settings.showCustomerPhone !== false;
  const showCustAddress = settings.showCustomerAddress !== false;
  const showDiscount = settings.showDiscount !== false;
  const showQr = settings.showQr !== false;
  const showSig = settings.showSignature !== false;
  const showBal = settings.showBalanceDue !== false;
  const showBank = settings.showBankDetails !== false;

  const due = Math.max(0, invoice.total - invoice.paidAmount);
  const customerName = invoice.partyName || party?.name || '';
  const customerPhone = invoice.customerPhone || party?.phone || '';
  const customerAddress = party?.address || '';

  const hasCustomerInfo = (showCustName && customerName) || (showCustPhone && customerPhone) || (showCustAddress && customerAddress);

  // Group GST by rate for GST Tax Breakup Table
  const gstBreakup: {
    [key: number]: {
      hsn: string;
      taxable: number;
      cgstRate: number;
      cgstAmt: number;
      sgstRate: number;
      sgstAmt: number;
      igstRate: number;
      igstAmt: number;
      totalTax: number;
    };
  } = {};

  const isInterState = invoice.stateOfSupply && business.state && invoice.stateOfSupply !== business.state;

  invoice.lines.forEach((l) => {
    const rate = l.taxPercent || 0;
    if (!gstBreakup[rate]) {
      const halfRate = rate / 2;
      gstBreakup[rate] = {
        hsn: l.hsn || '2106',
        taxable: 0,
        cgstRate: isInterState ? 0 : halfRate,
        cgstAmt: 0,
        sgstRate: isInterState ? 0 : halfRate,
        sgstAmt: 0,
        igstRate: isInterState ? rate : 0,
        igstAmt: 0,
        totalTax: 0,
      };
    }
    const taxable = l.taxableAmount || Math.round(l.amount / (1 + rate / 100));
    const taxAmt = l.amount - taxable;
    gstBreakup[rate].taxable += taxable;
    if (isInterState) {
      gstBreakup[rate].igstAmt += taxAmt;
    } else {
      gstBreakup[rate].cgstAmt += Math.round(taxAmt / 2);
      gstBreakup[rate].sgstAmt += taxAmt - Math.round(taxAmt / 2);
    }
    gstBreakup[rate].totalTax += taxAmt;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GST TAX INVOICE - ${escapeHtml(invoice.number)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${font.base};
      color: #000000;
      background: #ffffff;
      line-height: 1.35;
      padding: 20px;
    }
    .gst-container {
      border: 1.5px solid #000000;
      max-width: 840px;
      margin: 0 auto;
      background: #ffffff;
    }
    .top-banner {
      border-bottom: 1.5px solid #000000;
      text-align: center;
      padding: 6px;
      font-weight: 800;
      font-size: 14px;
      text-transform: uppercase;
      background: #f8fafc;
      letter-spacing: 1px;
    }
    .header-grid {
      display: table;
      width: 100%;
      border-bottom: 1px solid #000000;
    }
    .header-left {
      display: table-cell;
      width: 60%;
      padding: 10px 12px;
      border-right: 1px solid #000000;
      vertical-align: top;
    }
    .header-right {
      display: table-cell;
      width: 40%;
      padding: 8px 12px;
      vertical-align: top;
      font-size: 11px;
    }
    .biz-name { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
    
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #000000;
    }
    .parties-table td {
      width: 50%;
      padding: 8px 12px;
      vertical-align: top;
      font-size: 11px;
    }
    .parties-table td:first-child { border-right: 1px solid #000000; }
    .box-title { font-weight: 800; font-size: 10px; text-transform: uppercase; color: #334155; margin-bottom: 4px; }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #000000;
    }
    .data-table th {
      border: 1px solid #000000;
      padding: 5px 6px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      background: #f1f5f9;
      text-align: left;
    }
    .data-table td {
      border: 1px solid #000000;
      padding: 5px 6px;
      font-size: 11px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    /* GST Breakup */
    .gst-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #000000;
    }
    .gst-table th {
      border: 1px solid #000000;
      padding: 4px 6px;
      font-size: 9.5px;
      background: #f8fafc;
      font-weight: bold;
    }
    .gst-table td {
      border: 1px solid #000000;
      padding: 4px 6px;
      font-size: 10px;
    }

    .words-box {
      padding: 6px 10px;
      border-bottom: 1px solid #000000;
      font-size: 11px;
      background: #fcfcfc;
    }

    .footer-grid {
      display: table;
      width: 100%;
    }
    .footer-left {
      display: table-cell;
      width: 55%;
      padding: 10px 12px;
      border-right: 1px solid #000000;
      vertical-align: top;
      font-size: 10.5px;
    }
    .footer-right {
      display: table-cell;
      width: 45%;
      vertical-align: top;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 5px 8px;
      font-size: 11px;
      border-bottom: 1px solid #cbd5e1;
    }
    .summary-table tr:last-child td { border-bottom: none; }
    .bold-row { font-weight: 800; font-size: 12.5px; background: #f1f5f9; border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; }

    @media print {
      body { padding: 0; background: none; }
      .gst-container { border: 1.5px solid #000000; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="gst-container">
    <div class="top-banner">${escapeHtml(settings.headerText || 'TAX INVOICE')}</div>

    <!-- Header Grid -->
    <div class="header-grid">
      <div class="header-left">
        <div class="biz-name">${escapeHtml(business.name || 'Store')}</div>
        <div>${escapeHtml(business.address || '')}</div>
        <div>Mobile: +91 ${escapeHtml(business.phone || '')}</div>
        <div><strong>GSTIN:</strong> ${escapeHtml(business.gstin || 'UNREGISTERED')}</div>
        ${business.state ? `<div>State: ${escapeHtml(business.state)}</div>` : ''}
      </div>
      <div class="header-right">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 2px 0;"><strong>Invoice No:</strong></td><td style="text-align: right; font-weight: bold;">${escapeHtml(invoice.number)}</td></tr>
          <tr><td style="padding: 2px 0;"><strong>Dated:</strong></td><td style="text-align: right;">${escapeHtml(invoice.date)}</td></tr>
          <tr><td style="padding: 2px 0;"><strong>Place of Supply:</strong></td><td style="text-align: right;">${escapeHtml(invoice.placeOfSupply || invoice.stateOfSupply || '24 - Gujarat')}</td></tr>
          <tr><td style="padding: 2px 0;"><strong>Reverse Charge:</strong></td><td style="text-align: right;">${invoice.isReverseCharge ? 'YES' : 'NO'}</td></tr>
        </table>
      </div>
    </div>

    <!-- Parties Grid -->
    <table class="parties-table">
      <tr>
        <td>
          <div class="box-title">Details of Receiver (Billed To):</div>
          ${hasCustomerInfo ? `
            ${showCustName && customerName ? `<div style="font-size: 13px; font-weight: bold;">${escapeHtml(customerName)}</div>` : ''}
            ${showCustAddress && customerAddress ? `<div>${escapeHtml(customerAddress)}</div>` : ''}
            ${showCustPhone && customerPhone ? `<div>Mobile: +91 ${escapeHtml(customerPhone)}</div>` : ''}
            <div><strong>GSTIN / UIN:</strong> ${party?.gstin ? escapeHtml(party.gstin) : 'Unregistered Consumer'}</div>
          ` : `
            <div style="font-size: 12px; font-style: italic; color: #475569; margin-top: 4px;">Unregistered Consumer / Cash Sale</div>
          `}
        </td>
        <td>
          <div class="box-title">Details of Consignee (Shipped To):</div>
          ${hasCustomerInfo ? `
            ${showCustName && customerName ? `<div style="font-size: 13px; font-weight: bold;">${escapeHtml(customerName)}</div>` : ''}
            ${showCustAddress && customerAddress ? `<div>${escapeHtml(customerAddress)}</div>` : ''}
            ${showCustPhone && customerPhone ? `<div>Mobile: +91 ${escapeHtml(customerPhone)}</div>` : ''}
          ` : `
            <div style="font-size: 12px; font-style: italic; color: #475569; margin-top: 4px;">Same as Billed To</div>
          `}
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 38%;">Description of Goods / Services</th>
          <th style="width: 12%; text-align: center;">HSN/SAC</th>
          <th style="width: 11%; text-align: center;">Qty</th>
          <th style="width: 12%; text-align: right;">Rate (₹)</th>
          ${showDiscount ? '<th style="width: 8%; text-align: center;">Disc</th>' : ''}
          <th style="width: 14%; text-align: right;">Taxable (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines.map((l, idx) => {
          const taxable = l.taxableAmount || Math.round(l.amount / (1 + (l.taxPercent || 0) / 100));
          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${escapeHtml(l.itemName)}</strong></td>
              <td class="text-center">${escapeHtml(l.hsn || '-')}</td>
              <td class="text-center">${l.qty} ${escapeHtml(l.unit || 'pcs')}</td>
              <td class="text-right">${formatINRPlain(l.rate)}</td>
              ${showDiscount ? `<td class="text-center">${l.discountPercent > 0 ? `${l.discountPercent}%` : '-'}</td>` : ''}
              <td class="text-right">${formatINRPlain(taxable)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- GST Tax Breakup Table -->
    <div style="padding: 4px 6px; font-weight: 800; font-size: 10px; background: #f8fafc; border-bottom: 1px solid #000000;">
      GST TAX BREAKUP SUMMARY
    </div>
    <table class="gst-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 15%; text-align: center;">HSN/SAC</th>
          <th rowspan="2" style="width: 20%; text-align: right;">Taxable Value</th>
          <th colspan="2" style="text-align: center;">Central Tax (CGST)</th>
          <th colspan="2" style="text-align: center;">State Tax (SGST)</th>
          <th rowspan="2" style="width: 17%; text-align: right;">Total Tax</th>
        </tr>
        <tr>
          <th style="width: 8%; text-align: center;">Rate</th>
          <th style="width: 15%; text-align: right;">Amount</th>
          <th style="width: 8%; text-align: center;">Rate</th>
          <th style="width: 15%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(gstBreakup).map((rateStr) => {
          const r = Number(rateStr);
          const b = gstBreakup[r];
          return `
            <tr>
              <td class="text-center">${escapeHtml(b.hsn)}</td>
              <td class="text-right">${formatINRPlain(b.taxable)}</td>
              <td class="text-center">${b.cgstRate}%</td>
              <td class="text-right">${formatINRPlain(b.cgstAmt)}</td>
              <td class="text-center">${b.sgstRate}%</td>
              <td class="text-right">${formatINRPlain(b.sgstAmt)}</td>
              <td class="text-right"><strong>${formatINRPlain(b.totalTax)}</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Amount in Words -->
    <div class="words-box">
      <strong>Total Invoice Amount in Words:</strong> ${numberToWords(invoice.total)}
    </div>

    <!-- Footer Grid -->
    <div class="footer-grid">
      <div class="footer-left">
        ${showBank && (business.bankAccountNo || business.upiId) ? `
          <div style="margin-bottom: 8px;">
            <strong>Bank Details:</strong><br>
            Bank Name: ${escapeHtml(business.bankName || 'State Bank of India')}<br>
            Account No: <strong>${escapeHtml(business.bankAccountNo || '')}</strong><br>
            IFSC Code: ${escapeHtml(business.bankIfsc || '')}<br>
            ${business.upiId ? `UPI ID: <strong>${escapeHtml(business.upiId)}</strong>` : ''}
          </div>
        ` : ''}

        <div style="display: flex; gap: 10px; align-items: center;">
          ${showQr && qrDataUrl ? `
            <img src="${qrDataUrl}" width="70" height="70" style="border: 1px solid #94a3b8;" alt="UPI QR">
          ` : ''}
          <div>
            <strong>Declaration:</strong><br>
            We declare that this invoice shows the actual price of goods and that all particulars are true and correct.
          </div>
        </div>
      </div>

      <div class="footer-right">
        <table class="summary-table">
          <tr>
            <td>Total Taxable Value:</td>
            <td class="text-right">${formatINR(invoice.taxableAmount || invoice.subtotal)}</td>
          </tr>
          <tr>
            <td>Total Tax (GST):</td>
            <td class="text-right">${formatINR(invoice.taxTotal)}</td>
          </tr>
          ${invoice.roundOff ? `
            <tr>
              <td>Round Off:</td>
              <td class="text-right">${invoice.roundOff > 0 ? `+${formatINR(invoice.roundOff)}` : `-${formatINR(Math.abs(invoice.roundOff))}`}</td>
            </tr>
          ` : ''}
          <tr class="bold-row">
            <td>Invoice Total (₹):</td>
            <td class="text-right">${formatINR(invoice.total)}</td>
          </tr>
          <tr>
            <td>Paid Amount:</td>
            <td class="text-right">${formatINR(invoice.paidAmount)}</td>
          </tr>
          ${showBal ? `
            <tr style="font-weight: bold;">
              <td>Balance Due:</td>
              <td class="text-right">${formatINR(due)}</td>
            </tr>
          ` : ''}
        </table>

        ${showSig ? `
          <div style="text-align: right; padding: 10px 12px; font-size: 10.5px;">
            For <strong>${escapeHtml(business.name || 'Store')}</strong>
            <div style="margin-top: 36px; font-weight: bold;">Authorized Signatory</div>
          </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
