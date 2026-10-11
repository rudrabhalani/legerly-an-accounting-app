import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale } from './themeHelpers';

export function renderElegantTheme({
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
  <title>${escapeHtml(settings.headerText || 'INVOICE')} - ${escapeHtml(invoice.number)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: ${font.base};
      color: #1e1b4b;
      background: #ffffff;
      line-height: 1.45;
      padding: 24px;
    }
    .elegant-card {
      border: 3px double #b45309;
      padding: 24px;
      max-width: 820px;
      margin: 0 auto;
      background: #fffdfa;
    }
    .header-table { width: 100%; border-bottom: 1px solid #d97706; padding-bottom: 14px; margin-bottom: 16px; }
    .header-table td { vertical-align: top; }
    .brand-title { font-size: 24px; font-weight: normal; letter-spacing: 1px; color: #1e1b4b; text-transform: uppercase; }
    .brand-sub { font-size: 11px; color: #78350f; font-family: sans-serif; margin-top: 3px; }
    .doc-title { font-size: 20px; text-align: right; color: #b45309; font-weight: normal; letter-spacing: 2px; }

    .parties-grid {
      display: table;
      width: 100%;
      margin-bottom: 20px;
      font-family: sans-serif;
    }
    .party-col { display: table-cell; width: 50%; vertical-align: top; }
    .party-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #b45309; margin-bottom: 4px; letter-spacing: 1px; }
    .party-name { font-size: 14px; font-weight: bold; color: #1e1b4b; }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: sans-serif;
    }
    .items-table th {
      border-top: 1px solid #b45309;
      border-bottom: 1px solid #b45309;
      padding: 8px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      color: #78350f;
      text-align: left;
    }
    .items-table td {
      border-bottom: 1px solid #fef3c7;
      padding: 8px;
      font-size: 11.5px;
      color: #1e1b4b;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .bottom-layout { display: table; width: 100%; }
    .bottom-left { display: table-cell; width: 55%; vertical-align: top; padding-right: 18px; font-family: sans-serif; }
    .bottom-right { display: table-cell; width: 45%; vertical-align: top; font-family: sans-serif; }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #b45309;
    }
    .totals-table td {
      padding: 6px 10px;
      font-size: 11.5px;
      border-bottom: 1px solid #fde68a;
    }
    .total-row {
      background: #fef3c7;
      font-weight: bold;
      font-size: 13.5px;
      color: #78350f;
      border-top: 1px solid #b45309;
      border-bottom: 1px solid #b45309;
    }
    @media print {
      body { padding: 0; background: none; }
      .elegant-card { border: 1px solid #b45309; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="elegant-card">
    <table class="header-table">
      <tr>
        <td style="width: 60%;">
          <div class="brand-title">${escapeHtml(settings.shopName || business.name || 'Store')}</div>
          <div class="brand-sub">
            ${escapeHtml(business.address || '')}<br>
            Ph: +91 ${escapeHtml(business.phone || '')} ${business.gstin ? `• GSTIN: ${escapeHtml(business.gstin)}` : ''}
          </div>
        </td>
        <td style="width: 40%; text-align: right;">
          <div class="doc-title">${escapeHtml(settings.headerText || 'INVOICE')}</div>
          <div style="font-family: sans-serif; font-size: 11px; margin-top: 6px; color: #78350f;">
            No: <strong>${escapeHtml(invoice.number)}</strong><br>
            Date: ${escapeHtml(invoice.date)}
          </div>
        </td>
      </tr>
    </table>

    <div class="parties-grid">
      <div class="party-col">
        <div class="party-label">Billed By</div>
        <div class="party-name">${escapeHtml(business.name || 'Store')}</div>
        <div style="font-size: 11px; color: #475569;">${escapeHtml(business.address || '')}</div>
      </div>
      <div class="party-col">
        <div class="party-label">Billed To</div>
        ${hasCustomerInfo ? `
          ${showCustName && customerName ? `<div class="party-name">${escapeHtml(customerName)}</div>` : ''}
          ${showCustPhone && customerPhone ? `<div style="font-size: 11px; color: #475569;">Ph: +91 ${escapeHtml(customerPhone)}</div>` : ''}
          ${showCustAddress && customerAddress ? `<div style="font-size: 11px; color: #475569;">${escapeHtml(customerAddress)}</div>` : ''}
        ` : `
          <div style="font-size: 11px; font-style: italic; color: #94a3b8;">Valued Customer</div>
        `}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 45%;">Item Description</th>
          ${showHsn ? '<th style="width: 12%; text-align: center;">HSN</th>' : ''}
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Rate</th>
          ${showDiscount ? '<th style="width: 8%; text-align: center;">Disc</th>' : ''}
          <th style="width: 20%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines.map((l) => `
          <tr>
            <td><strong>${escapeHtml(l.itemName)}</strong></td>
            ${showHsn ? `<td class="text-center">${escapeHtml(l.hsn || '-')}</td>` : ''}
            <td class="text-center">${l.qty} ${escapeHtml(l.unit || '')}</td>
            <td class="text-right">${formatINRPlain(l.rate)}</td>
            ${showDiscount ? `<td class="text-center">${l.discountPercent > 0 ? `${l.discountPercent}%` : '-'}</td>` : ''}
            <td class="text-right"><strong>${formatINRPlain(l.amount)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="bottom-layout">
      <div class="bottom-left">
        ${showBank && (business.bankAccountNo || business.upiId) ? `
          <div style="font-size: 11px; color: #78350f; line-height: 1.5; margin-bottom: 10px;">
            <strong>Bank Particulars:</strong><br>
            ${business.bankName ? `${escapeHtml(business.bankName)} | ` : ''}
            A/C: ${escapeHtml(business.bankAccountNo || '')} | IFSC: ${escapeHtml(business.bankIfsc || '')}<br>
            ${business.upiId ? `UPI: ${escapeHtml(business.upiId)}` : ''}
          </div>
        ` : ''}

        ${showQr && qrDataUrl ? `
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <img src="${qrDataUrl}" width="65" height="65" style="border: 1px solid #d97706;" alt="UPI QR">
            <span style="font-size: 10px; color: #78350f;">Scan to Pay via UPI</span>
          </div>
        ` : ''}

        ${settings.footerText ? `
          <div style="font-size: 10px; color: #78350f; font-style: italic; margin-top: 12px;">
            ${escapeHtml(settings.footerText)}
          </div>
        ` : ''}
      </div>

      <div class="bottom-right">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">${formatINR(invoice.subtotal)}</td>
          </tr>
          ${invoice.discountTotal > 0 ? `
            <tr style="color: #b91c1c;">
              <td>Discount:</td>
              <td class="text-right">-${formatINR(invoice.discountTotal)}</td>
            </tr>
          ` : ''}
          ${showTax && invoice.taxTotal > 0 ? `
            <tr>
              <td>GST Tax:</td>
              <td class="text-right">+${formatINR(invoice.taxTotal)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td>Grand Total:</td>
            <td class="text-right">${formatINR(invoice.total)}</td>
          </tr>
          <tr>
            <td>Paid Amount:</td>
            <td class="text-right">${formatINR(invoice.paidAmount)}</td>
          </tr>
          ${showBal ? `
            <tr style="font-weight: bold; background: #fffbeb;">
              <td>Balance Due:</td>
              <td class="text-right">${formatINR(due)}</td>
            </tr>
          ` : ''}
        </table>

        ${showSig ? `
          <div style="text-align: right; margin-top: 24px; font-size: 10.5px;">
            For <strong>${escapeHtml(business.name || 'Store')}</strong><br>
            <div style="margin-top: 36px; border-top: 1px solid #b45309; display: inline-block; width: 140px; text-align: center; padding-top: 3px;">
              Authorized Signatory
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
