import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale } from './themeHelpers';

export function renderMinimalTheme({
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
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      font-size: ${font.base};
      color: #334155;
      background: #ffffff;
      line-height: 1.5;
      padding: 32px;
    }
    .minimal-wrap {
      max-width: 800px;
      margin: 0 auto;
    }
    .top-row {
      display: table;
      width: 100%;
      margin-bottom: 32px;
    }
    .top-left { display: table-cell; width: 60%; vertical-align: top; }
    .top-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }
    .brand-heading { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
    .inv-heading { font-size: 28px; font-weight: 300; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; }
    
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 28px;
    }
    .info-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
    .party-title { font-size: 14px; font-weight: 700; color: #0f172a; }

    /* Minimal Table */
    .clean-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .clean-table th {
      border-bottom: 1.5px solid #0f172a;
      padding: 10px 8px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      text-align: left;
    }
    .clean-table td {
      border-bottom: 1px solid #f1f5f9;
      padding: 12px 8px;
      font-size: 12px;
      color: #334155;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .bottom-layout { display: table; width: 100%; margin-top: 16px; }
    .bottom-left { display: table-cell; width: 55%; vertical-align: top; padding-right: 24px; }
    .bottom-right { display: table-cell; width: 45%; vertical-align: top; }

    .totals-list {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-list td {
      padding: 6px 0;
      font-size: 12px;
      color: #64748b;
    }
    .total-highlight {
      border-top: 1.5px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .total-highlight td { padding: 10px 0; color: #0f172a; }

    @media print {
      body { padding: 0; background: none; }
      .minimal-wrap { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="minimal-wrap">
    <div class="top-row">
      <div class="top-left">
        <div class="brand-heading">${escapeHtml(settings.shopName || business.name || 'Store')}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          ${escapeHtml(business.address || '')}<br>
          +91 ${escapeHtml(business.phone || '')} ${business.gstin ? `• GSTIN: ${escapeHtml(business.gstin)}` : ''}
        </div>
      </div>
      <div class="top-right">
        <div class="inv-heading">${escapeHtml(settings.headerText || 'INVOICE')}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          #<strong>${escapeHtml(invoice.number)}</strong> • ${escapeHtml(invoice.date)}
        </div>
      </div>
    </div>

    <!-- Parties Grid -->
    <div class="info-grid">
      <div class="info-col">
        <div class="section-label">Billed To</div>
        ${hasCustomerInfo ? `
          ${showCustName && customerName ? `<div class="party-title">${escapeHtml(customerName)}</div>` : ''}
          ${showCustPhone && customerPhone ? `<div style="font-size: 11px; color: #64748b;">+91 ${escapeHtml(customerPhone)}</div>` : ''}
          ${showCustAddress && customerAddress ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(customerAddress)}</div>` : ''}
          ${party?.gstin ? `<div style="font-size: 11px; color: #64748b;">GSTIN: ${escapeHtml(party.gstin)}</div>` : ''}
        ` : `
          <div style="font-size: 12px; font-style: italic; color: #94a3b8;">Cash Sale / Walk-in Customer</div>
        `}
      </div>

      <div class="info-col" style="text-align: right;">
        <div class="section-label">Payment Status</div>
        <div style="font-size: 13px; font-weight: 700; color: ${due === 0 ? '#10b981' : '#f59e0b'};">
          ${due === 0 ? 'Full Payment Settled' : (invoice.paidAmount > 0 ? 'Partially Paid' : 'Payment Outstanding')}
        </div>
        <div style="font-size: 11px; color: #64748b;">Method: ${escapeHtml(invoice.paymentMode || invoice.paymentType || 'CASH')}</div>
      </div>
    </div>

    <!-- Clean Items Table -->
    <table class="clean-table">
      <thead>
        <tr>
          <th style="width: 50%;">Item</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Price</th>
          ${showDiscount ? '<th style="width: 10%; text-align: center;">Disc</th>' : ''}
          <th style="width: 20%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines.map((l) => `
          <tr>
            <td>
              <strong style="color: #0f172a;">${escapeHtml(l.itemName)}</strong>
              ${l.hsn ? `<span style="font-size: 10px; color: #94a3b8; display: block;">HSN: ${escapeHtml(l.hsn)}</span>` : ''}
            </td>
            <td class="text-center">${l.qty} ${escapeHtml(l.unit || '')}</td>
            <td class="text-right">${formatINRPlain(l.rate)}</td>
            ${showDiscount ? `<td class="text-center">${l.discountPercent > 0 ? `${l.discountPercent}%` : '-'}</td>` : ''}
            <td class="text-right" style="font-weight: 600; color: #0f172a;">${formatINRPlain(l.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Bottom Layout -->
    <div class="bottom-layout">
      <div class="bottom-left">
        ${showBank && (business.bankAccountNo || business.upiId) ? `
          <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
            <div class="section-label">Bank Details</div>
            ${business.bankName ? `Bank: ${escapeHtml(business.bankName)}<br>` : ''}
            ${business.bankAccountNo ? `A/C No: ${escapeHtml(business.bankAccountNo)}<br>` : ''}
            ${business.bankIfsc ? `IFSC: ${escapeHtml(business.bankIfsc)}<br>` : ''}
            ${business.upiId ? `UPI ID: ${escapeHtml(business.upiId)}` : ''}
          </div>
        ` : ''}

        ${showQr && qrDataUrl ? `
          <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 8px;">
            <img src="${qrDataUrl}" width="60" height="60" alt="UPI QR">
            <span style="font-size: 10px; color: #94a3b8;">Scan with any UPI app to pay</span>
          </div>
        ` : ''}

        ${settings.footerText ? `
          <div style="font-size: 10px; color: #94a3b8; margin-top: 18px;">
            ${escapeHtml(settings.footerText)}
          </div>
        ` : ''}
      </div>

      <div class="bottom-right">
        <table class="totals-list">
          <tr>
            <td>Subtotal</td>
            <td class="text-right" style="color: #0f172a;">${formatINR(invoice.subtotal)}</td>
          </tr>
          ${invoice.discountTotal > 0 ? `
            <tr style="color: #dc2626;">
              <td>Discount</td>
              <td class="text-right">-${formatINR(invoice.discountTotal)}</td>
            </tr>
          ` : ''}
          ${showTax && invoice.taxTotal > 0 ? `
            <tr>
              <td>GST Tax</td>
              <td class="text-right">+${formatINR(invoice.taxTotal)}</td>
            </tr>
          ` : ''}
          <tr class="total-highlight">
            <td>Total</td>
            <td class="text-right">${formatINR(invoice.total)}</td>
          </tr>
          <tr>
            <td>Received</td>
            <td class="text-right">${formatINR(invoice.paidAmount)}</td>
          </tr>
          ${showBal ? `
            <tr style="font-weight: 700; color: #0f172a;">
              <td>Balance Due</td>
              <td class="text-right">${formatINR(due)}</td>
            </tr>
          ` : ''}
        </table>

        ${showSig ? `
          <div style="text-align: right; margin-top: 28px; font-size: 10.5px; color: #64748b;">
            Authorized Signature
          </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
