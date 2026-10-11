import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale } from './themeHelpers';

export function renderClassicTheme({
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
  const showTax = settings.showTax !== false;
  const showDiscount = settings.showDiscount !== false;
  const showHsn = settings.showHsn !== false;
  const showQr = settings.showQr !== false;
  const showSig = settings.showSignature !== false;
  const showBal = settings.showBalanceDue !== false;
  const showBank = settings.showBankDetails !== false;

  const due = Math.max(0, invoice.total - invoice.paidAmount);
  const customerName = invoice.partyName || party?.name || '';
  const customerPhone = invoice.customerPhone || party?.phone || '';
  const customerAddress = party?.address || '';

  const hasCustomerInfo = (showCustName && customerName) || (showCustPhone && customerPhone) || (showCustAddress && customerAddress);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(settings.headerText || 'TAX INVOICE')} - ${escapeHtml(invoice.number)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: ${font.base};
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      padding: 24px;
    }
    .invoice-card {
      border: 2px solid #0f172a;
      padding: 20px;
      background: #ffffff;
      max-width: 820px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .header-table td { vertical-align: top; }
    .company-name { font-size: 20px; font-weight: 800; text-transform: uppercase; color: #0f172a; }
    .invoice-title { font-size: 18px; font-weight: 800; text-align: right; letter-spacing: 1px; color: #0f172a; }
    .meta-table { margin-top: 6px; font-size: 11px; float: right; border-collapse: collapse; }
    .meta-table td { padding: 2px 4px; }
    .meta-table td:first-child { font-weight: bold; text-align: right; }
    
    .parties-grid {
      display: table;
      width: 100%;
      border: 1px solid #0f172a;
      margin-bottom: 14px;
    }
    .party-col {
      display: table-cell;
      width: 50%;
      padding: 10px;
      vertical-align: top;
    }
    .party-col:first-child { border-right: 1px solid #0f172a; }
    .party-badge {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 4px;
      display: block;
    }
    .party-name { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
    
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #0f172a;
      margin-bottom: 14px;
    }
    .items-table th {
      background: #f1f5f9;
      border: 1px solid #0f172a;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: left;
    }
    .items-table td {
      border: 1px solid #0f172a;
      padding: 6px 8px;
      font-size: 11px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Totals Box */
    .bottom-section { display: table; width: 100%; margin-top: 10px; }
    .left-bottom { display: table-cell; width: 55%; vertical-align: top; padding-right: 12px; }
    .right-bottom { display: table-cell; width: 45%; vertical-align: top; }

    .totals-box {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #0f172a;
    }
    .totals-box td {
      padding: 5px 8px;
      font-size: 11px;
      border-bottom: 1px solid #cbd5e1;
    }
    .totals-box tr:last-child td { border-bottom: none; }
    .totals-box .highlight-row {
      background: #f8fafc;
      font-size: 13px;
      font-weight: 800;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    .totals-box .due-row {
      background: #f1f5f9;
      font-weight: 800;
      color: #0f172a;
    }

    .bank-box {
      border: 1px solid #0f172a;
      padding: 8px 10px;
      font-size: 11px;
      margin-bottom: 10px;
    }
    .qr-box {
      display: inline-block;
      text-align: center;
      margin-right: 12px;
      vertical-align: top;
    }
    .sig-box {
      margin-top: 28px;
      text-align: right;
      font-size: 11px;
    }
    .sig-line {
      display: inline-block;
      width: 160px;
      border-top: 1px solid #0f172a;
      margin-top: 40px;
      text-align: center;
      padding-top: 4px;
      font-weight: bold;
    }
    @media print {
      body { padding: 0; background: none; }
      .invoice-card { border: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Top Header -->
    <table class="header-table">
      <tr>
        <td style="width: 60%;">
          <div class="company-name">${escapeHtml(settings.shopName || business.name || 'Ledgerly Shop')}</div>
          ${business.address ? `<div style="font-size: 11px; color: #475569; margin-top: 3px;">${escapeHtml(business.address)}</div>` : ''}
          <div style="font-size: 11px; color: #475569;">Mobile: +91 ${escapeHtml(business.phone || '')}</div>
          ${business.gstin ? `<div style="font-size: 11px; font-weight: bold; margin-top: 2px;">GSTIN: ${escapeHtml(business.gstin)}</div>` : ''}
        </td>
        <td style="width: 40%; text-align: right;">
          <div class="invoice-title">${escapeHtml(settings.headerText || 'TAX INVOICE')}</div>
          <table class="meta-table">
            <tr><td>Invoice No:</td><td><strong>${escapeHtml(invoice.number)}</strong></td></tr>
            <tr><td>Date:</td><td>${escapeHtml(invoice.date)}</td></tr>
            ${invoice.dueDate ? `<tr><td>Due Date:</td><td>${escapeHtml(invoice.dueDate)}</td></tr>` : ''}
            ${invoice.stateOfSupply ? `<tr><td>State of Supply:</td><td>${escapeHtml(invoice.stateOfSupply)}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>

    <!-- Party Details -->
    <div class="parties-grid">
      <div class="party-col">
        <span class="party-badge">Billed By</span>
        <div class="party-name">${escapeHtml(business.name || 'Store')}</div>
        <div style="font-size: 11px; color: #475569;">${escapeHtml(business.address || '')}</div>
        <div style="font-size: 11px;">Ph: +91 ${escapeHtml(business.phone || '')}</div>
      </div>
      <div class="party-col">
        <span class="party-badge">Billed To</span>
        ${hasCustomerInfo ? `
          ${showCustName && customerName ? `<div class="party-name">${escapeHtml(customerName)}</div>` : ''}
          ${showCustPhone && customerPhone ? `<div style="font-size: 11px;">Ph: +91 ${escapeHtml(customerPhone)}</div>` : ''}
          ${showCustAddress && customerAddress ? `<div style="font-size: 11px; color: #475569;">${escapeHtml(customerAddress)}</div>` : ''}
          ${party?.gstin ? `<div style="font-size: 11px; font-weight: bold;">GSTIN: ${escapeHtml(party.gstin)}</div>` : ''}
        ` : `
          <div style="font-size: 12px; font-style: italic; color: #64748b; margin-top: 4px;">Cash Sale / Counter Customer</div>
        `}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 38%;">Item Description</th>
          ${showHsn ? '<th style="width: 12%; text-align: center;">HSN</th>' : ''}
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 14%; text-align: right;">Rate (₹)</th>
          ${showDiscount ? '<th style="width: 10%; text-align: center;">Disc</th>' : ''}
          ${showTax ? '<th style="width: 10%; text-align: center;">GST %</th>' : ''}
          <th style="width: 19%; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines.map((l, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td><strong>${escapeHtml(l.itemName)}</strong></td>
            ${showHsn ? `<td class="text-center">${escapeHtml(l.hsn || '-')}</td>` : ''}
            <td class="text-center">${l.qty} ${escapeHtml(l.unit || 'pcs')}</td>
            <td class="text-right">${formatINRPlain(l.rate)}</td>
            ${showDiscount ? `<td class="text-center">${l.discountPercent > 0 ? `${l.discountPercent}%` : '-'}</td>` : ''}
            ${showTax ? `<td class="text-center">${l.taxPercent}%</td>` : ''}
            <td class="text-right"><strong>${formatINRPlain(l.amount)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="left-bottom">
        ${showBank && (business.bankAccountNo || business.upiId) ? `
          <div class="bank-box">
            <strong>Bank / Payment Details:</strong><br>
            ${business.bankName ? `Bank: ${escapeHtml(business.bankName)}<br>` : ''}
            ${business.bankAccountNo ? `A/C No: ${escapeHtml(business.bankAccountNo)}<br>` : ''}
            ${business.bankIfsc ? `IFSC: ${escapeHtml(business.bankIfsc)}<br>` : ''}
            ${business.upiId ? `UPI ID: ${escapeHtml(business.upiId)}` : ''}
          </div>
        ` : ''}

        <div style="display: flex; align-items: flex-start;">
          ${showQr && qrDataUrl ? `
            <div class="qr-box">
              <img src="${qrDataUrl}" width="80" height="80" style="border: 1px solid #cbd5e1; display: block;" alt="UPI QR">
              <div style="font-size: 9px; font-weight: bold; margin-top: 2px;">Scan & Pay UPI</div>
            </div>
          ` : ''}
          <div>
            ${settings.footerText ? `<div style="font-size: 10px; color: #475569; font-style: italic;">${escapeHtml(settings.footerText)}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="right-bottom">
        <table class="totals-box">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">${formatINR(invoice.subtotal)}</td>
          </tr>
          ${invoice.discountTotal > 0 ? `
            <tr>
              <td>Discount:</td>
              <td class="text-right" style="color: #dc2626;">-${formatINR(invoice.discountTotal)}</td>
            </tr>
          ` : ''}
          ${showTax && invoice.taxTotal > 0 ? `
            <tr>
              <td>Total Tax (GST):</td>
              <td class="text-right">+${formatINR(invoice.taxTotal)}</td>
            </tr>
          ` : ''}
          ${invoice.roundOff ? `
            <tr>
              <td>Round Off:</td>
              <td class="text-right">${invoice.roundOff > 0 ? `+${formatINR(invoice.roundOff)}` : `-${formatINR(Math.abs(invoice.roundOff))}`}</td>
            </tr>
          ` : ''}
          <tr class="highlight-row">
            <td>Grand Total:</td>
            <td class="text-right">${formatINR(invoice.total)}</td>
          </tr>
          <tr>
            <td>Paid Amount:</td>
            <td class="text-right">${formatINR(invoice.paidAmount)}</td>
          </tr>
          ${showBal ? `
            <tr class="due-row">
              <td>Balance Due:</td>
              <td class="text-right">${formatINR(due)}</td>
            </tr>
          ` : ''}
        </table>

        ${showSig ? `
          <div class="sig-box">
            For <strong>${escapeHtml(business.name || 'Store')}</strong><br>
            <div class="sig-line">Authorized Signatory</div>
          </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
