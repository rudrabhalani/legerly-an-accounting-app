import { InvoiceThemeProps } from './types';
import { escapeHtml, formatINR, formatINRPlain, getFontScale } from './themeHelpers';

export function renderModernTheme({
  invoice,
  settings,
  business,
  party,
  account,
  qrDataUrl,
}: InvoiceThemeProps): string {
  const font = getFontScale(settings.fontSize);
  const accent = settings.accentColor || '#4F46E5';
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${font.base};
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      padding: 24px;
    }
    .invoice-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      max-width: 820px;
      margin: 0 auto;
    }
    .header-band {
      background: ${accent};
      color: #ffffff;
      padding: 24px 28px;
      display: table;
      width: 100%;
    }
    .header-col-left { display: table-cell; width: 60%; vertical-align: middle; }
    .header-col-right { display: table-cell; width: 40%; vertical-align: middle; text-align: right; }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; opacity: 0.9; margin-top: 2px; }
    .doc-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .body-section { padding: 24px 28px; }
    
    .meta-cards {
      display: table;
      width: 100%;
      margin-bottom: 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .meta-col { display: table-cell; width: 25%; vertical-align: top; }
    .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .meta-value { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }

    .parties-row {
      display: table;
      width: 100%;
      margin-bottom: 24px;
    }
    .party-card {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding: 16px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    .party-card:first-child { margin-right: 12px; }
    .party-card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${accent};
      margin-bottom: 6px;
    }
    .party-main-name { font-size: 15px; font-weight: 800; color: #0f172a; }

    /* Modern Table */
    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      background: #f8fafc;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table td {
      padding: 10px 14px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .items-table tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Summary & Totals */
    .bottom-grid { display: table; width: 100%; }
    .bottom-left { display: table-cell; width: 55%; vertical-align: top; padding-right: 20px; }
    .bottom-right { display: table-cell; width: 45%; vertical-align: top; }

    .totals-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .grand-total-row {
      background: ${accent};
      color: #ffffff;
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15px;
      font-weight: 800;
    }
    .due-badge-row {
      background: #eff6ff;
      color: #1e40af;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      font-size: 12px;
    }

    .qr-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 12px;
      margin-top: 10px;
    }
    @media print {
      body { padding: 0; background: none; }
      .invoice-card { border: none; box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header Band -->
    <div class="header-band">
      <div class="header-col-left">
        <div class="brand-title">${escapeHtml(settings.shopName || business.name || 'Store')}</div>
        <div class="brand-sub">${escapeHtml(business.address || '')} • Tel: +91 ${escapeHtml(business.phone || '')}</div>
        ${business.gstin ? `<div class="brand-sub" style="font-weight: bold;">GSTIN: ${escapeHtml(business.gstin)}</div>` : ''}
      </div>
      <div class="header-col-right">
        <div class="doc-badge">${escapeHtml(settings.headerText || 'TAX INVOICE')}</div>
        <div style="font-size: 13px; font-weight: 800; margin-top: 6px;">#${escapeHtml(invoice.number)}</div>
      </div>
    </div>

    <div class="body-section">
      <!-- Metadata Row -->
      <div class="meta-cards">
        <div class="meta-col">
          <div class="meta-label">Invoice Date</div>
          <div class="meta-value">${escapeHtml(invoice.date)}</div>
        </div>
        <div class="meta-col">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${escapeHtml(invoice.dueDate || invoice.date)}</div>
        </div>
        <div class="meta-col">
          <div class="meta-label">Payment Mode</div>
          <div class="meta-value">${escapeHtml(invoice.paymentMode || invoice.paymentType || 'CASH')}</div>
        </div>
        <div class="meta-col">
          <div class="meta-label">Status</div>
          <div class="meta-value" style="color: ${due === 0 ? '#10b981' : '#f59e0b'};">
            ${due === 0 ? 'PAID' : (invoice.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')}
          </div>
        </div>
      </div>

      <!-- Parties Row -->
      <div class="parties-row">
        <div class="party-card" style="margin-right: 8px;">
          <div class="party-card-title">Sold By</div>
          <div class="party-main-name">${escapeHtml(business.name || 'Store')}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(business.address || '')}</div>
          <div style="font-size: 11px; color: #64748b;">Phone: +91 ${escapeHtml(business.phone || '')}</div>
          ${business.gstin ? `<div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">GSTIN: ${escapeHtml(business.gstin)}</div>` : ''}
        </div>

        <div class="party-card" style="margin-left: 8px;">
          <div class="party-card-title">Billed To</div>
          ${hasCustomerInfo ? `
            ${showCustName && customerName ? `<div class="party-main-name">${escapeHtml(customerName)}</div>` : ''}
            ${showCustPhone && customerPhone ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Mobile: +91 ${escapeHtml(customerPhone)}</div>` : ''}
            ${showCustAddress && customerAddress ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(customerAddress)}</div>` : ''}
            ${party?.gstin ? `<div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">GSTIN: ${escapeHtml(party.gstin)}</div>` : ''}
          ` : `
            <div style="font-size: 12px; font-style: italic; color: #94a3b8; margin-top: 6px;">Cash Sale / Counter Customer</div>
          `}
        </div>
      </div>

      <!-- Items Table -->
      <div class="table-container">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">#</th>
              <th style="width: 40%;">Item</th>
              ${showHsn ? '<th style="width: 12%; text-align: center;">HSN</th>' : ''}
              <th style="width: 12%; text-align: center;">Qty</th>
              <th style="width: 14%; text-align: right;">Rate</th>
              ${showDiscount ? '<th style="width: 10%; text-align: center;">Disc</th>' : ''}
              ${showTax ? '<th style="width: 10%; text-align: center;">GST</th>' : ''}
              <th style="width: 18%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lines.map((l, i) => `
              <tr>
                <td class="text-center" style="color: #64748b;">${i + 1}</td>
                <td>
                  <strong style="color: #0f172a;">${escapeHtml(l.itemName)}</strong>
                </td>
                ${showHsn ? `<td class="text-center" style="color: #64748b;">${escapeHtml(l.hsn || '-')}</td>` : ''}
                <td class="text-center">${l.qty} <span style="font-size: 10px; color: #64748b;">${escapeHtml(l.unit || '')}</span></td>
                <td class="text-right">${formatINRPlain(l.rate)}</td>
                ${showDiscount ? `<td class="text-center">${l.discountPercent > 0 ? `${l.discountPercent}%` : '-'}</td>` : ''}
                ${showTax ? `<td class="text-center">${l.taxPercent}%</td>` : ''}
                <td class="text-right" style="font-weight: 700;">${formatINRPlain(l.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Bottom Layout -->
      <div class="bottom-grid">
        <div class="bottom-left">
          ${showBank && (business.bankAccountNo || business.upiId) ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 11px; margin-bottom: 12px;">
              <strong style="color: #0f172a;">Bank & Payment Info:</strong><br>
              ${business.bankName ? `Bank: ${escapeHtml(business.bankName)}<br>` : ''}
              ${business.bankAccountNo ? `A/C: ${escapeHtml(business.bankAccountNo)}<br>` : ''}
              ${business.bankIfsc ? `IFSC: ${escapeHtml(business.bankIfsc)}<br>` : ''}
              ${business.upiId ? `UPI VPA: <strong>${escapeHtml(business.upiId)}</strong>` : ''}
            </div>
          ` : ''}

          ${showQr && qrDataUrl ? `
            <div class="qr-badge">
              <img src="${qrDataUrl}" width="65" height="65" style="border-radius: 6px;" alt="QR">
              <div>
                <strong style="font-size: 11px; color: #0f172a;">Instant UPI Payment</strong>
                <div style="font-size: 10px; color: #64748b;">GPay • PhonePe • Paytm</div>
              </div>
            </div>
          ` : ''}

          ${settings.footerText ? `
            <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 14px;">
              ${escapeHtml(settings.footerText)}
            </div>
          ` : ''}
        </div>

        <div class="bottom-right">
          <div class="totals-card">
            <div class="totals-row">
              <span style="color: #64748b;">Subtotal</span>
              <strong>${formatINR(invoice.subtotal)}</strong>
            </div>
            ${invoice.discountTotal > 0 ? `
              <div class="totals-row" style="color: #dc2626;">
                <span>Discount</span>
                <strong>-${formatINR(invoice.discountTotal)}</strong>
              </div>
            ` : ''}
            ${showTax && invoice.taxTotal > 0 ? `
              <div class="totals-row">
                <span style="color: #64748b;">GST Tax Total</span>
                <strong>+${formatINR(invoice.taxTotal)}</strong>
              </div>
            ` : ''}
            ${invoice.roundOff ? `
              <div class="totals-row">
                <span style="color: #64748b;">Round Off</span>
                <strong>${invoice.roundOff > 0 ? `+${formatINR(invoice.roundOff)}` : `-${formatINR(Math.abs(invoice.roundOff))}`}</strong>
              </div>
            ` : ''}
            <div class="grand-total-row">
              <span>Grand Total</span>
              <span>${formatINR(invoice.total)}</span>
            </div>
            <div class="totals-row">
              <span style="color: #64748b;">Paid Amount</span>
              <strong>${formatINR(invoice.paidAmount)}</strong>
            </div>
            ${showBal ? `
              <div class="due-badge-row">
                <span>Balance Due</span>
                <span>${formatINR(due)}</span>
              </div>
            ` : ''}
          </div>

          ${showSig ? `
            <div style="text-align: right; margin-top: 24px; font-size: 11px;">
              <div style="color: #64748b;">For <strong>${escapeHtml(business.name || 'Store')}</strong></div>
              <div style="margin-top: 36px; border-top: 1px solid #cbd5e1; display: inline-block; width: 150px; text-align: center; padding-top: 4px; font-weight: 700;">
                Authorized Signatory
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
