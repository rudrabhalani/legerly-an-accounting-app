import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale } from './themeHelpers';

export function renderLandscapeTheme({
  invoice,
  settings,
  business,
  party,
  account,
  qrDataUrl,
}: InvoiceThemeProps): string {
  const font = getFontScale(settings.fontSize);
  const accent = settings.accentColor || '#1e293b';
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
      color: #0f172a;
      background: #ffffff;
      line-height: 1.35;
      padding: 16px;
    }
    .landscape-wrap {
      max-width: 1040px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 18px;
      border-radius: 10px;
    }
    .top-bar {
      display: table;
      width: 100%;
      border-bottom: 2px solid ${accent};
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .top-bar-left { display: table-cell; width: 45%; vertical-align: top; }
    .top-bar-mid { display: table-cell; width: 25%; vertical-align: top; font-size: 11px; }
    .top-bar-right { display: table-cell; width: 30%; vertical-align: top; text-align: right; }

    .wide-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .wide-table th {
      background: #f1f5f9;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: bold;
      text-align: left;
    }
    .wide-table td {
      border-bottom: 1px solid #f1f5f9;
      padding: 6px 8px;
      font-size: 11.5px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .bottom-bar {
      display: table;
      width: 100%;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    .bottom-bar-left { display: table-cell; width: 60%; vertical-align: top; }
    .bottom-bar-right { display: table-cell; width: 40%; vertical-align: top; }

    .totals-inline {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
    }
    .totals-inline td { padding: 4px 8px; font-size: 11.5px; border-bottom: 1px solid #f1f5f9; }
    .totals-inline tr:last-child td { border-bottom: none; }
    @media print {
      body { padding: 0; background: none; }
      .landscape-wrap { border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="landscape-wrap">
    <div class="top-bar">
      <div class="top-bar-left">
        <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">${escapeHtml(settings.shopName || business.name || 'Store')}</div>
        <div style="font-size: 11px; color: #475569;">${escapeHtml(business.address || '')} • Tel: +91 ${escapeHtml(business.phone || '')}</div>
        ${business.gstin ? `<div style="font-size: 11px; font-weight: bold;">GSTIN: ${escapeHtml(business.gstin)}</div>` : ''}
      </div>

      <div class="top-bar-mid">
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Customer / Billed To:</div>
        ${hasCustomerInfo ? `
          ${showCustName && customerName ? `<div style="font-weight: bold;">${escapeHtml(customerName)}</div>` : ''}
          ${showCustPhone && customerPhone ? `<div>Ph: +91 ${escapeHtml(customerPhone)}</div>` : ''}
          ${showCustAddress && customerAddress ? `<div>${escapeHtml(customerAddress)}</div>` : ''}
        ` : `
          <div style="font-style: italic; color: #94a3b8;">Cash Customer</div>
        `}
      </div>

      <div class="top-bar-right">
        <div style="font-size: 18px; font-weight: 800; color: ${accent};">${escapeHtml(settings.headerText || 'INVOICE')}</div>
        <div style="font-size: 11px; margin-top: 2px;">
          Invoice No: <strong>${escapeHtml(invoice.number)}</strong><br>
          Date: ${escapeHtml(invoice.date)} | Mode: ${escapeHtml(invoice.paymentMode || invoice.paymentType || 'CASH')}
        </div>
      </div>
    </div>

    <!-- Wide Table -->
    <table class="wide-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 35%;">Item Description</th>
          ${showHsn ? '<th style="width: 12%; text-align: center;">HSN</th>' : ''}
          <th style="width: 10%; text-align: center;">Quantity</th>
          <th style="width: 12%; text-align: right;">Unit Rate</th>
          ${showDiscount ? '<th style="width: 8%; text-align: center;">Disc</th>' : ''}
          ${showTax ? '<th style="width: 8%; text-align: center;">GST %</th>' : ''}
          <th style="width: 15%; text-align: right;">Net Amount</th>
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
            ${showTax ? `<td class="text-center">${l.taxPercent}%</td>` : ''}
            <td class="text-right"><strong>${formatINRPlain(l.amount)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Bottom Bar -->
    <div class="bottom-bar">
      <div class="bottom-bar-left">
        ${showBank && (business.bankAccountNo || business.upiId) ? `
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            <strong>Bank A/C:</strong> ${escapeHtml(business.bankAccountNo || '')} | IFSC: ${escapeHtml(business.bankIfsc || '')} | UPI: ${escapeHtml(business.upiId || '')}
          </div>
        ` : ''}
        ${showQr && qrDataUrl ? `
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <img src="${qrDataUrl}" width="50" height="50" alt="QR">
            <span style="font-size: 9.5px; color: #64748b;">UPI Instant Payment</span>
          </div>
        ` : ''}
        ${settings.footerText ? `<div style="font-size: 9.5px; color: #94a3b8; font-style: italic; margin-top: 4px;">${escapeHtml(settings.footerText)}</div>` : ''}
      </div>

      <div class="bottom-bar-right">
        <table class="totals-inline">
          <tr><td>Subtotal:</td><td class="text-right">${formatINR(invoice.subtotal)}</td></tr>
          ${invoice.discountTotal > 0 ? `<tr><td>Discount:</td><td class="text-right" style="color: #dc2626;">-${formatINR(invoice.discountTotal)}</td></tr>` : ''}
          ${showTax && invoice.taxTotal > 0 ? `<tr><td>GST Tax:</td><td class="text-right">+${formatINR(invoice.taxTotal)}</td></tr>` : ''}
          <tr style="font-weight: bold; background: #f8fafc; font-size: 13px;">
            <td>Total Amount:</td><td class="text-right">${formatINR(invoice.total)}</td>
          </tr>
          <tr><td>Paid:</td><td class="text-right">${formatINR(invoice.paidAmount)}</td></tr>
          ${showBal ? `<tr style="font-weight: bold;"><td>Balance Due:</td><td class="text-right">${formatINR(due)}</td></tr>` : ''}
        </table>

        ${showSig ? `
          <div style="text-align: right; margin-top: 14px; font-size: 10px;">
            For <strong>${escapeHtml(business.name || 'Store')}</strong> (Authorized Signatory)
          </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
