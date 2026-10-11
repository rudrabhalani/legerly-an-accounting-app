import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale } from './themeHelpers';

export function renderColorfulTheme({
  invoice,
  settings,
  business,
  party,
  account,
  qrDataUrl,
}: InvoiceThemeProps): string {
  const font = getFontScale(settings.fontSize);
  const accent = settings.accentColor || '#059669'; // Emerald default for colorful
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
  <title>${escapeHtml(settings.headerText || 'INVOICE')} - ${escapeHtml(invoice.number)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${font.base};
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      padding: 24px;
    }
    .card-wrap {
      border: 2px solid ${accent};
      border-radius: 18px;
      overflow: hidden;
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
    }
    .top-header {
      background: linear-gradient(135deg, ${accent}, #0284c7);
      color: #ffffff;
      padding: 20px 24px;
      display: table;
      width: 100%;
    }
    .top-left { display: table-cell; width: 65%; vertical-align: middle; }
    .top-right { display: table-cell; width: 35%; vertical-align: middle; text-align: right; }
    .store-name { font-size: 24px; font-weight: 900; }
    .pill-badge {
      display: inline-block;
      background: #ffffff;
      color: #0f172a;
      font-weight: 800;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .inner-body { padding: 20px 24px; }
    .parties-grid { display: table; width: 100%; margin-bottom: 20px; }
    .party-card {
      display: table-cell;
      width: 50%;
      padding: 14px;
      border-radius: 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      vertical-align: top;
    }
    .party-card:last-child {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
    }

    .colorful-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .colorful-table th {
      background: ${accent};
      color: #ffffff;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: left;
    }
    .colorful-table td {
      padding: 9px 12px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .colorful-table tr:nth-child(even) td { background: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .bottom-layout { display: table; width: 100%; }
    .bottom-left { display: table-cell; width: 55%; vertical-align: top; padding-right: 18px; }
    .bottom-right { display: table-cell; width: 45%; vertical-align: top; }

    .totals-box {
      border: 2px solid ${accent};
      border-radius: 14px;
      overflow: hidden;
      width: 100%;
      border-collapse: collapse;
    }
    .totals-box td {
      padding: 7px 12px;
      font-size: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .grand-row {
      background: ${accent};
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
    }
    @media print {
      body { padding: 0; background: none; }
      .card-wrap { border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="card-wrap">
    <div class="top-header">
      <div class="top-left">
        <div class="store-name">${escapeHtml(settings.shopName || business.name || 'Store')}</div>
        <div style="font-size: 11px; opacity: 0.95; margin-top: 2px;">
          ${escapeHtml(business.address || '')} • +91 ${escapeHtml(business.phone || '')}
        </div>
      </div>
      <div class="top-right">
        <div class="pill-badge">${escapeHtml(settings.headerText || 'TAX INVOICE')}</div>
        <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">#${escapeHtml(invoice.number)}</div>
      </div>
    </div>

    <div class="inner-body">
      <div class="parties-grid">
        <div class="party-card" style="margin-right: 6px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #166534;">Seller / Supplier</div>
          <div style="font-size: 14px; font-weight: 800; color: #14532d;">${escapeHtml(business.name || 'Store')}</div>
          <div style="font-size: 11px; color: #166534;">+91 ${escapeHtml(business.phone || '')}</div>
          ${business.gstin ? `<div style="font-size: 11px; font-weight: bold;">GSTIN: ${escapeHtml(business.gstin)}</div>` : ''}
        </div>

        <div class="party-card" style="margin-left: 6px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #075985;">Customer / Buyer</div>
          ${hasCustomerInfo ? `
            ${showCustName && customerName ? `<div style="font-size: 14px; font-weight: 800; color: #0c4a6e;">${escapeHtml(customerName)}</div>` : ''}
            ${showCustPhone && customerPhone ? `<div style="font-size: 11px; color: #0369a1;">+91 ${escapeHtml(customerPhone)}</div>` : ''}
            ${showCustAddress && customerAddress ? `<div style="font-size: 11px; color: #0369a1;">${escapeHtml(customerAddress)}</div>` : ''}
          ` : `
            <div style="font-size: 12px; font-style: italic; color: #0369a1;">Walk-in Customer</div>
          `}
        </div>
      </div>

      <table class="colorful-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 42%;">Item Description</th>
            ${showHsn ? '<th style="width: 12%; text-align: center;">HSN</th>' : ''}
            <th style="width: 12%; text-align: center;">Qty</th>
            <th style="width: 13%; text-align: right;">Rate</th>
            ${showDiscount ? '<th style="width: 8%; text-align: center;">Disc</th>' : ''}
            <th style="width: 18%; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lines.map((l, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td><strong>${escapeHtml(l.itemName)}</strong></td>
              ${showHsn ? `<td class="text-center">${escapeHtml(l.hsn || '-')}</td>` : ''}
              <td class="text-center">${l.qty} ${escapeHtml(l.unit || '')}</td>
              <td class="text-right">${formatINRPlain(l.rate)}</td>
              ${showDiscount ? `<td class="text-center">${l.discountPercent > 0 ? `${l.discountPercent}%` : '-'}</td>` : ''}
              <td class="text-right" style="font-weight: bold;">${formatINRPlain(l.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="bottom-layout">
        <div class="bottom-left">
          ${showBank && (business.bankAccountNo || business.upiId) ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; font-size: 11px; margin-bottom: 10px;">
              <strong>Bank Transfer:</strong><br>
              ${business.bankName ? `Bank: ${escapeHtml(business.bankName)}<br>` : ''}
              A/C: ${escapeHtml(business.bankAccountNo || '')} | IFSC: ${escapeHtml(business.bankIfsc || '')}<br>
              ${business.upiId ? `UPI ID: <strong>${escapeHtml(business.upiId)}</strong>` : ''}
            </div>
          ` : ''}

          ${showQr && qrDataUrl ? `
            <div style="display: inline-flex; align-items: center; gap: 10px;">
              <img src="${qrDataUrl}" width="65" height="65" style="border-radius: 8px;" alt="UPI QR">
              <span style="font-size: 10px; color: #64748b;">Fast UPI Scan & Pay</span>
            </div>
          ` : ''}
        </div>

        <div class="bottom-right">
          <table class="totals-box">
            <tr><td>Subtotal</td><td class="text-right">${formatINR(invoice.subtotal)}</td></tr>
            ${invoice.discountTotal > 0 ? `<tr><td>Discount</td><td class="text-right" style="color: #dc2626;">-${formatINR(invoice.discountTotal)}</td></tr>` : ''}
            ${showTax && invoice.taxTotal > 0 ? `<tr><td>Tax (GST)</td><td class="text-right">+${formatINR(invoice.taxTotal)}</td></tr>` : ''}
            <tr class="grand-row"><td>Grand Total</td><td class="text-right">${formatINR(invoice.total)}</td></tr>
            <tr><td>Paid</td><td class="text-right">${formatINR(invoice.paidAmount)}</td></tr>
            ${showBal ? `<tr style="font-weight: 800; background: #fef2f2; color: #991b1b;"><td>Balance Due</td><td class="text-right">${formatINR(due)}</td></tr>` : ''}
          </table>

          ${showSig ? `
            <div style="text-align: right; margin-top: 24px; font-size: 10.5px;">
              For <strong>${escapeHtml(business.name || 'Store')}</strong><br>
              <div style="margin-top: 32px; border-top: 1px solid #cbd5e1; display: inline-block; width: 130px; text-align: center; padding-top: 3px;">
                Authorized Signature
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
