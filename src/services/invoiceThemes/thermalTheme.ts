import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain } from './themeHelpers';

export function renderThermalTheme({
  invoice,
  settings,
  business,
  party,
  account,
  qrDataUrl,
}: InvoiceThemeProps): string {
  const is58 = settings.paperSize === '58mm';
  const widthMm = is58 ? '54mm' : '76mm';
  const fontSize = is58 ? '10px' : '11.5px';
  const showCustName = settings.showCustomerName !== false;
  const showCustPhone = settings.showCustomerPhone !== false;
  const showQr = settings.showQr !== false;
  const showBal = settings.showBalanceDue !== false;

  const due = Math.max(0, invoice.total - invoice.paidAmount);
  const customerName = invoice.partyName || party?.name || '';
  const customerPhone = invoice.customerPhone || party?.phone || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RECEIPT - ${escapeHtml(invoice.number)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: ${fontSize};
      color: #000000;
      background: #ffffff;
      line-height: 1.3;
      padding: 6px;
    }
    .receipt {
      width: ${widthMm};
      margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider {
      border-top: 1px dashed #000000;
      margin: 5px 0;
    }
    .solid-divider {
      border-top: 1px solid #000000;
      margin: 5px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize};
    }
    .items-table th {
      border-bottom: 1px dashed #000000;
      padding: 3px 0;
      text-align: left;
    }
    .items-table td {
      padding: 3px 0;
      vertical-align: top;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize};
    }
    .totals-table td {
      padding: 2px 0;
    }
    @media print {
      body { padding: 0; background: none; }
      .receipt { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="text-center">
      <div style="font-size: 15px; font-weight: bold;">${escapeHtml(settings.shopName || business.name || 'Store')}</div>
      ${business.address ? `<div>${escapeHtml(business.address)}</div>` : ''}
      <div>Tel: +91 ${escapeHtml(business.phone || '')}</div>
      ${business.gstin ? `<div>GSTIN: ${escapeHtml(business.gstin)}</div>` : ''}
    </div>

    <div class="divider"></div>

    <div style="display: flex; justify-content: space-between;">
      <span><strong>${escapeHtml(settings.headerText || 'BILL')} #${escapeHtml(invoice.number)}</strong></span>
      <span>${escapeHtml(invoice.date)}</span>
    </div>

    <!-- Customer Line (Only if Show Customer Name is ON) -->
    ${showCustName && customerName ? `
      <div>Customer: <strong>${escapeHtml(customerName)}</strong></div>
      ${showCustPhone && customerPhone ? `<div>Phone: +91 ${escapeHtml(customerPhone)}</div>` : ''}
    ` : ''}

    <div class="divider"></div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amt</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.lines.map((l) => `
          <tr>
            <td>
              <div class="bold">${escapeHtml(l.itemName)}</div>
            </td>
            <td class="text-center">${l.qty}</td>
            <td class="text-right">${formatINRPlain(l.rate)}</td>
            <td class="text-right bold">${formatINRPlain(l.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="divider"></div>

    <!-- Totals Table -->
    <table class="totals-table">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${formatINR(invoice.subtotal)}</td>
      </tr>
      ${invoice.discountTotal > 0 ? `
        <tr>
          <td>Discount:</td>
          <td class="text-right">-${formatINR(invoice.discountTotal)}</td>
        </tr>
      ` : ''}
      ${invoice.taxTotal > 0 ? `
        <tr>
          <td>Tax (GST):</td>
          <td class="text-right">+${formatINR(invoice.taxTotal)}</td>
        </tr>
      ` : ''}
      <tr style="font-size: 14px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000;">
        <td style="padding: 4px 0;">TOTAL:</td>
        <td class="text-right" style="padding: 4px 0;">${formatINR(invoice.total)}</td>
      </tr>
      <tr>
        <td>Paid (${escapeHtml(invoice.paymentMode || invoice.paymentType || 'CASH')}):</td>
        <td class="text-right">${formatINR(invoice.paidAmount)}</td>
      </tr>
      ${showBal ? `
        <tr class="bold">
          <td>Balance Due:</td>
          <td class="text-right">${formatINR(due)}</td>
        </tr>
      ` : ''}
    </table>

    <!-- UPI QR Code -->
    ${showQr && qrDataUrl ? `
      <div class="text-center" style="margin-top: 8px;">
        <img src="${qrDataUrl}" width="80" height="80" alt="UPI QR">
        <div style="font-size: 9px; font-weight: bold; margin-top: 2px;">SCAN TO PAY VIA UPI</div>
      </div>
    ` : ''}

    <div class="divider"></div>

    <div class="text-center" style="font-size: 9.5px;">
      ${settings.footerText ? `<div>${escapeHtml(settings.footerText)}</div>` : '<div>Thank you! Visit again.</div>'}
      <div>Software by Ledgerly</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
