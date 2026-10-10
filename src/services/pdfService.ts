/**
 * Ledgerly PDF Generation Service
 * Generates beautiful, compliant Indian Tax Invoices (with & without GST),
 * Party Ledger Statements, Registers, and Financial Reports using jsPDF and autoTable.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import {
  Invoice,
  Business,
  Party,
  LedgerEntry,
  Account,
  PrintSettings,
  DayBookEntry,
  BalanceSheetData,
  BillWisePnlRow,
  ShareFormat,
} from '../types';
import { formatINR, formatFullDate, paiseToRupees } from '../utils/formatters';
import { numberToIndianWords } from '../utils/gstCalc';

// In-memory cache for generated PDF and Image files per invoice version
const pdfCache = new Map<string, { file: File; blob: Blob; doc: jsPDF }>();
const imageCache = new Map<string, File>();

export function getCachedInvoicePdf(invoiceId: string, updatedAt?: string) {
  return pdfCache.get(`${invoiceId}_${updatedAt || ''}`);
}

export function setCachedInvoicePdf(invoiceId: string, updatedAt: string | undefined, data: { file: File; blob: Blob; doc: jsPDF }) {
  pdfCache.set(`${invoiceId}_${updatedAt || ''}`, data);
}

export function invalidateInvoiceCache(invoiceId: string) {
  for (const k of Array.from(pdfCache.keys())) {
    if (k.startsWith(invoiceId)) pdfCache.delete(k);
  }
  for (const k of Array.from(imageCache.keys())) {
    if (k.startsWith(invoiceId)) imageCache.delete(k);
  }
}

/**
 * Helper to generate UPI Payment QR code as a base64 Data URL
 */
export async function generateUpiQrDataUrl(
  upiIdOrPhone: string,
  payeeName: string,
  amountPaise: number,
  billNumber: string
): Promise<string | null> {
  try {
    const vpa = upiIdOrPhone.includes('@') ? upiIdOrPhone : `${upiIdOrPhone.replace(/\D/g, '')}@upi`;
    const amountRupees = (amountPaise / 100).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(billNumber)}`;
    return await QRCode.toDataURL(upiUri, { width: 140, margin: 1 });
  } catch (err) {
    console.warn('QR Code generation failed:', err);
    return null;
  }
}

export function formatInvoiceMessageTemplate(
  template: string,
  invoice: Invoice,
  business: Business,
  party?: Party,
  viewLink?: string
): string {
  const customerName = party?.name || invoice.partyName || 'Customer';
  const billNo = invoice.number || 'BILL';
  const total = (invoice.total / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: invoice.total % 100 !== 0 ? 2 : 0,
  });
  const due = Math.max(0, invoice.total - invoice.paidAmount);
  const balance = (due / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: due % 100 !== 0 ? 2 : 0,
  });
  const shopName = business.name || 'Shree Sweet';
  const date = invoice.date;

  let text = template
    .replace(/\{customer_name\}/g, customerName)
    .replace(/\{bill_no\}/g, billNo)
    .replace(/\{total\}/g, total)
    .replace(/\{shop_name\}/g, shopName)
    .replace(/\{balance\}/g, balance)
    .replace(/\{date\}/g, date);

  if (viewLink) {
    if (text.includes('{link}')) {
      text = text.replace(/\{link\}/g, viewLink);
    } else {
      text += `\n\nView invoice: ${viewLink}`;
    }
  } else {
    text = text.replace(/\{link\}/g, '').trim();
  }

  return text;
}

export function generateInvoicePdf(
  invoice: Invoice,
  business: Business,
  party?: Party,
  defaultAccount?: Account,
  printSettings?: PrintSettings,
  qrDataUrl?: string | null
): jsPDF {
  // 1. Handle Thermal Receipts (58mm / 80mm)
  if (printSettings?.paperSize === '58mm' || printSettings?.paperSize === '80mm') {
    const is58 = printSettings.paperSize === '58mm';
    const width = is58 ? 58 : 80;
    const height = Math.max(160, 100 + invoice.lines.length * 8 + (qrDataUrl ? 35 : 0));
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [width, height],
    });

    const shopName = printSettings.shopName || business.name || 'Shree Sweet';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is58 ? 12 : 14);
    doc.text(shopName, width / 2, 9, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(is58 ? 7 : 8);
    let y = 14;
    if (business.address) {
      doc.text(business.address, width / 2, y, { align: 'center', maxWidth: width - 8 });
      y += 4;
    }
    doc.text(`Tel: +91 ${business.phone}`, width / 2, y, { align: 'center' });
    y += 4;
    if (business.gstin) {
      doc.text(`GSTIN: ${business.gstin}`, width / 2, y, { align: 'center' });
      y += 4;
    }

    doc.text('------------------------------------------------', width / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`${printSettings.headerText || 'TAX INVOICE'} #${invoice.number}`, width / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${invoice.date}  |  ${invoice.partyName}`, width / 2, y, { align: 'center', maxWidth: width - 6 });
    y += 5;
    doc.text('------------------------------------------------', width / 2, y, { align: 'center' });
    y += 4;

    const itemsHead = is58 ? [['Item', 'Qty', 'Amt']] : [['#', 'Item', 'Qty', 'Rate', 'Amt']];
    const itemsBody = invoice.lines.map((l, idx) =>
      is58
        ? [l.itemName, `${l.qty} ${l.unit}`, `Rs.${paiseToRupees(l.amount).toFixed(2)}`]
        : [(idx + 1).toString(), l.itemName, `${l.qty} ${l.unit}`, `Rs.${paiseToRupees(l.rate).toFixed(2)}`, `Rs.${paiseToRupees(l.amount).toFixed(2)}`]
    );

    autoTable(doc, {
      startY: y,
      head: itemsHead,
      body: itemsBody,
      theme: 'plain',
      headStyles: { fontStyle: 'bold', fontSize: is58 ? 7 : 8, cellPadding: 1 },
      styles: { fontSize: is58 ? 6.5 : 7.5, cellPadding: 1 },
      margin: { left: 3, right: 3 },
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 30) + 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(is58 ? 7.5 : 8.5);
    doc.text(`Total: Rs.${paiseToRupees(invoice.total).toFixed(2)}`, width - 5, y, { align: 'right' });
    y += 4;
    doc.text(`Paid: Rs.${paiseToRupees(invoice.paidAmount).toFixed(2)}`, width - 5, y, { align: 'right' });
    y += 4;
    const due = Math.max(0, invoice.total - invoice.paidAmount);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Due: Rs.${paiseToRupees(due).toFixed(2)}`, width - 5, y, { align: 'right' });
    y += 6;

    if (qrDataUrl && printSettings.showQr !== false) {
      doc.addImage(qrDataUrl, 'PNG', (width - 24) / 2, y, 24, 24);
      y += 26;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Scan to Pay via UPI', width / 2, y, { align: 'center' });
      y += 4;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.text(printSettings.footerText || 'Thank you! Visit again.', width / 2, y, { align: 'center', maxWidth: width - 6 });

    return doc;
  }

  // 2. Standard A4 / A5 Layout
  const paperFormat = printSettings?.paperSize === 'A5' ? 'a5' : 'a4';
  const orientation = printSettings?.orientation || 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperFormat,
  });

  const withGst = invoice.withGst ?? true;

  // Primary colors
  const primaryColor = [79, 70, 229]; // #4F46E5 Indigo
  const slateColor = [15, 23, 42];    // #0F172A Slate
  const greyColor = [100, 116, 139];  // #64748B Grey

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // Business Info (Left Header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(business.name, 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  if (business.address) {
    doc.text(business.address, 14, 28, { maxWidth: 95 });
  }
  doc.text(`Mobile: +91 ${business.phone}`, 14, 35);
  if (withGst && business.gstin) {
    doc.text(`GSTIN: ${business.gstin}`, 14, 40);
  }

  // Document Title & Meta (Right Header)
  const isSale = invoice.type === 'SALE';
  const isReturn = invoice.type === 'SALE_RETURN' || invoice.type === 'PURCHASE_RETURN';
  const docTitle = !withGst
    ? (isSale ? 'BILL OF SUPPLY / INVOICE' : 'PURCHASE BILL')
    : isReturn
    ? (invoice.type === 'SALE_RETURN' ? 'CREDIT NOTE (SALE RETURN)' : 'DEBIT NOTE (PURCHASE RETURN)')
    : isSale
    ? 'TAX INVOICE'
    : 'PURCHASE BILL';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(docTitle, 196, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(`Invoice No: ${invoice.number}`, 196, 30, { align: 'right' });
  doc.text(`Date: ${formatFullDate(invoice.date)}`, 196, 35, { align: 'right' });
  doc.text(`Due Date: ${formatFullDate(invoice.dueDate)}`, 196, 40, { align: 'right' });
  if (invoice.stateOfSupply) {
    doc.text(`State of Supply: ${invoice.stateOfSupply}`, 196, 45, { align: 'right' });
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 49, 196, 49);

  // Bill To / Party Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(isSale ? 'BILLED TO (CUSTOMER):' : 'SUPPLIER DETAILS:', 14, 55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(invoice.partyName, 14, 61, { maxWidth: 95 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  if (party?.phone) {
    doc.text(`Phone: +91 ${party.phone}`, 14, 66);
  }
  if (party?.address) {
    doc.text(`Address: ${party.address}`, 14, 71, { maxWidth: 95 });
  }
  if (withGst && party?.gstin) {
    doc.text(`GSTIN: ${party.gstin}`, 14, 76);
  }

  // Items Table
  let headers: string[];
  let tableData: string[][];
  let colStyles: Record<number, any>;

  if (withGst) {
    headers = ['#', 'Item Description', 'HSN', 'Qty', 'Rate', 'Disc', 'GST %', 'Amount'];
    tableData = invoice.lines.map((line, idx) => [
      (idx + 1).toString(),
      line.itemName,
      line.hsn || '—',
      `${line.qty} ${line.unit}`,
      `₹${paiseToRupees(line.rate).toFixed(2)}`,
      line.discountPercent > 0 ? `${line.discountPercent}%` : '—',
      `${line.taxPercent}%`,
      `₹${paiseToRupees(line.amount).toFixed(2)}`,
    ]);
    colStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 29, halign: 'right' },
    };
  } else {
    headers = ['#', 'Item Description', 'Qty', 'Unit Price', 'Disc', 'Total Amount'];
    tableData = invoice.lines.map((line, idx) => [
      (idx + 1).toString(),
      line.itemName,
      `${line.qty} ${line.unit}`,
      `₹${paiseToRupees(line.rate).toFixed(2)}`,
      line.discountPercent > 0 ? `${line.discountPercent}%` : '—',
      `₹${paiseToRupees(line.amount).toFixed(2)}`,
    ]);
    colStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 85 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 27, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 20, halign: 'right' },
    };
  }

  autoTable(doc, {
    startY: 81,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
    },
    columnStyles: colStyles,
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 140;
  if (finalY + 65 > 280) {
    doc.addPage();
    finalY = 20;
  }

  // Left column: Bank info, Amount in words, Terms
  const leftX = 14;
  let leftY = finalY + 8;

  // Amount in Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text('Amount in Words:', leftX, leftY);
  leftY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text(numberToIndianWords(paiseToRupees(invoice.total)), leftX, leftY, { maxWidth: 100 });
  leftY += 9;

  // Bank Details for payment (if available)
  if (defaultAccount && defaultAccount.type === 'BANK') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Bank Details for Payment:', leftX, leftY);
    leftY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
    doc.text(`Bank: ${defaultAccount.bankName || defaultAccount.nickname}`, leftX, leftY);
    leftY += 4.5;
    if (defaultAccount.accountNumberMasked) {
      doc.text(`Account No: ${defaultAccount.accountNumberMasked}`, leftX, leftY);
      leftY += 4.5;
    }
    if (defaultAccount.ifsc) {
      doc.text(`IFSC Code: ${defaultAccount.ifsc}`, leftX, leftY);
      leftY += 4.5;
    }
    leftY += 3;
  }

  // Terms and Notes
  if (invoice.notes || invoice.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Terms & Notes:', leftX, leftY);
    leftY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
    if (invoice.notes) {
      doc.text(invoice.notes, leftX, leftY, { maxWidth: 95 });
      leftY += 4.5;
    }
    if (invoice.terms) {
      doc.text(invoice.terms, leftX, leftY, { maxWidth: 95 });
      leftY += 4.5;
    }
  }

  // UPI QR Code on Invoice
  if (qrDataUrl && printSettings?.showQr !== false) {
    doc.addImage(qrDataUrl, 'PNG', leftX, leftY + 1, 22, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Scan to Pay via UPI', leftX + 26, leftY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
    doc.text('(GPay / PhonePe / Paytm / BHIM)', leftX + 26, leftY + 15);
    leftY += 26;
  }

  // Right column: Totals summary card
  const summaryX = 125;
  const summaryWidth = 71;
  let currentY = finalY + 8;

  const addSummaryRow = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.setTextColor(
      isAccent ? primaryColor[0] : slateColor[0],
      isAccent ? primaryColor[1] : slateColor[1],
      isAccent ? primaryColor[2] : slateColor[2]
    );
    doc.text(label, summaryX, currentY);
    doc.text(value, summaryX + summaryWidth, currentY, { align: 'right' });
    currentY += 5.5;
  };

  addSummaryRow('Subtotal', formatINR(invoice.subtotal));
  if (invoice.discountTotal > 0 && printSettings?.showDiscount !== false) {
    addSummaryRow('Total Discount', `−${formatINR(invoice.discountTotal)}`);
  }
  if (withGst && printSettings?.showTax !== false) {
    if (invoice.taxableAmount) {
      addSummaryRow('Taxable Amount', formatINR(invoice.taxableAmount));
    }
    if (invoice.cgstTotal && invoice.cgstTotal > 0) {
      addSummaryRow('CGST', `+${formatINR(invoice.cgstTotal)}`);
    }
    if (invoice.sgstTotal && invoice.sgstTotal > 0) {
      addSummaryRow('SGST', `+${formatINR(invoice.sgstTotal)}`);
    }
    if (invoice.igstTotal && invoice.igstTotal > 0) {
      addSummaryRow('IGST', `+${formatINR(invoice.igstTotal)}`);
    }
  }
  if (invoice.extraCharges && invoice.extraCharges > 0) {
    addSummaryRow('Extra Charges', `+${formatINR(invoice.extraCharges)}`);
  }
  if (invoice.roundOff !== 0) {
    addSummaryRow(
      'Round Off',
      `${invoice.roundOff > 0 ? '+' : '−'}${formatINR(Math.abs(invoice.roundOff))}`
    );
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX, currentY - 1.5, summaryX + summaryWidth, currentY - 1.5);
  currentY += 1;

  addSummaryRow('Grand Total', formatINR(invoice.total), true, true);
  addSummaryRow('Paid / Received', formatINR(invoice.paidAmount));

  const due = Math.max(0, invoice.total - invoice.paidAmount);
  if (printSettings?.showBalanceDue !== false) {
    addSummaryRow('Balance Due', formatINR(due), true, due > 0);
  }

  // Footer & Authorized Signatory
  const shopName = printSettings?.shopName || business.name || 'Shree Sweet';
  if (printSettings?.showSignature !== false) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
    doc.text(`For ${shopName}`, 196, 262, { align: 'right' });
    doc.text('Authorized Signatory', 196, 276, { align: 'right' });
  }

  doc.setFontSize(7.5);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text(printSettings?.footerText || 'Generated via Ledgerly – Simple Accounting for Everyone', 105, 286, { align: 'center' });

  return doc;
}

export function generatePartyStatementPdf(
  party: Party,
  entries: LedgerEntry[],
  business: Business
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [79, 70, 229];
  const slateColor = [15, 23, 42];

  // Top Header Banner: WRITE ONLY APP NAME "Ledgerly" as requested
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Ledgerly', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Statement Date: ${formatFullDate(new Date().toISOString())}`, 196, 22, { align: 'right' });

  // Party Banner Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 30, 182, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Party: ${party.name}`, 18, 39, { maxWidth: 90 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contact: +91 ${party.phone || 'N/A'}  |  Type: ${party.type}`, 18, 46);

  const finalEntry = entries[entries.length - 1];
  const netBal = finalEntry ? finalEntry.runningBalance : 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  if (netBal >= 0) {
    doc.setTextColor(22, 163, 74);
    doc.text(`Net: You'll get ${formatINR(netBal)}`, 190, 42, { align: 'right' });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`Net: You'll give ${formatINR(Math.abs(netBal))}`, 190, 42, { align: 'right' });
  }

  const tableData = entries.map((e) => [
    e.date,
    e.description,
    e.debit > 0 ? `₹${paiseToRupees(e.debit).toFixed(2)}` : '—',
    e.credit > 0 ? `₹${paiseToRupees(e.credit).toFixed(2)}` : '—',
    `₹${paiseToRupees(Math.abs(e.runningBalance)).toFixed(2)} ${e.runningBalance >= 0 ? 'Dr' : 'Cr'}`,
  ]);

  autoTable(doc, {
    startY: 57,
    head: [['Date', 'Description / Details', 'Debit (You Give)', 'Credit (You Get)', 'Running Balance']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 7.8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 78, overflow: 'linebreak' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
  });

  return doc;
}

export function generateRegisterPdf(
  title: string,
  invoices: Invoice[],
  business: Business
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [79, 70, 229];

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(business.name, 14, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(title.toUpperCase(), 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${formatFullDate(new Date().toISOString())}`, 196, 26, { align: 'right' });

  let totalPaise = 0;
  const tableData = invoices.map((inv, idx) => {
    totalPaise += inv.total;
    return [
      (idx + 1).toString(),
      inv.date,
      inv.number,
      inv.partyName,
      `₹${paiseToRupees(inv.taxTotal).toFixed(2)}`,
      `₹${paiseToRupees(inv.total).toFixed(2)}`,
      inv.paidAmount >= inv.total ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid',
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Date', 'Invoice No', 'Party Name', 'Tax (₹)', 'Grand Total (₹)', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 27, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Amount: ${formatINR(totalPaise)}`, 196, finalY + 10, { align: 'right' });

  return doc;
}

export interface ShareBillPdfOptions {
  invoice: Invoice;
  business: Business;
  party?: Party;
  account?: Account;
  format?: ShareFormat; // 'PDF' | 'IMAGE' | 'LINK'
  messageTemplate?: string;
  printSettings?: PrintSettings;
  viewLink?: string;
}

/**
 * Generate Day Book PDF
 */
export function generateDayBookPdf(
  date: string,
  entries: DayBookEntry[],
  business: Business,
  totals: { totalIn: number; totalOut: number; net: number }
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryColor = [79, 70, 229];

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(business.name || 'Shree Sweet', 14, 22);

  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DAY BOOK REPORT', 196, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${formatFullDate(date)}`, 14, 29);
  doc.text(`Total In: ${formatINR(totals.totalIn)} | Total Out: ${formatINR(totals.totalOut)} | Net: ${formatINR(totals.net)}`, 196, 29, { align: 'right' });

  const tableData = entries.map((e, idx) => [
    (idx + 1).toString(),
    e.time || '—',
    e.type.replace('_', ' '),
    e.partyName || '—',
    e.refNumber || '—',
    e.mode,
    e.inflow > 0 ? `+${formatINR(e.inflow)}` : '—',
    e.outflow > 0 ? `−${formatINR(e.outflow)}` : '—',
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Time', 'Type', 'Party / Description', 'Ref #', 'Mode', 'Money In (₹)', 'Money Out (₹)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16 },
      2: { cellWidth: 26 },
      3: { cellWidth: 54 },
      4: { cellWidth: 24 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Net Day Position: ${formatINR(totals.net)}`, 196, finalY + 10, { align: 'right' });

  return doc;
}

/**
 * Generate Balance Sheet PDF
 */
export function generateBalanceSheetPdf(
  asOnDate: string,
  data: BalanceSheetData,
  business: Business
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryColor = [79, 70, 229];

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(business.name || 'Shree Sweet', 14, 22);

  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BALANCE SHEET', 196, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`As on: ${formatFullDate(asOnDate)}`, 14, 29);
  doc.text(`Status: ${data.isBalanced ? 'Balanced' : 'Unbalanced'}`, 196, 29, { align: 'right' });

  const rows = [
    ['LIABILITIES & OWNER EQUITY', 'AMOUNT (₹)', 'ASSETS', 'AMOUNT (₹)'],
    ['Sundry Creditors (Payables)', formatINR(data.liabilities.sundryCreditors), 'Cash in Hand', formatINR(data.assets.cashInHand)],
    ['Capital & Opening Reserves', formatINR(data.liabilities.capitalAndReserves), 'Bank Accounts', formatINR(data.assets.totalBank)],
    ['Net Profit / Loss Carried In', formatINR(data.liabilities.netProfitCarriedIn), 'Sundry Debtors (Receivables)', formatINR(data.assets.sundryDebtors)],
    ['', '', 'Closing Stock Valuation', formatINR(data.assets.closingStockValue)],
    ['TOTAL LIABILITIES', formatINR(data.liabilities.totalLiabilities), 'TOTAL ASSETS', formatINR(data.assets.totalAssets)],
  ];

  autoTable(doc, {
    startY: 34,
    head: [rows[0]],
    body: rows.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 55 },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  return doc;
}

/**
 * Generate Bill-wise Profit and Loss PDF
 */
export function generateBillWisePnlPdf(
  rows: BillWisePnlRow[],
  business: Business,
  dateRange?: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryColor = [79, 70, 229];

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(business.name || 'Shree Sweet', 14, 22);

  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILL-WISE PROFIT & LOSS', 196, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${dateRange || 'All Time'}`, 14, 29);

  let totalSale = 0;
  let totalCost = 0;
  let totalProfit = 0;

  const tableData = rows.map((r, idx) => {
    totalSale += r.saleAmount;
    totalCost += r.costAmount;
    totalProfit += r.profitAmount;
    return [
      (idx + 1).toString(),
      r.billNumber,
      r.date,
      r.customerName,
      `₹${(r.saleAmount / 100).toFixed(2)}`,
      `₹${(r.costAmount / 100).toFixed(2)}`,
      `₹${(r.profitAmount / 100).toFixed(2)}`,
      `${r.marginPercent.toFixed(1)}%`,
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Bill No', 'Date', 'Customer', 'Sale (₹)', 'Cost (₹)', 'P/L (₹)', 'Margin']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 52 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 16, halign: 'center' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const avgMargin = totalSale > 0 ? ((totalProfit / totalSale) * 100).toFixed(1) : '0';
  doc.text(`Total Sale: ${formatINR(totalSale)} | Total Cost: ${formatINR(totalCost)} | Net Profit: ${formatINR(totalProfit)} (${avgMargin}%)`, 196, finalY + 9, { align: 'right' });

  return doc;
}

/**
 * Generate high-resolution JPG image file of the invoice for direct WhatsApp photo sharing
 */
export async function generateInvoiceImageFile(
  invoice: Invoice,
  business: Business,
  party?: Party,
  printSettings?: PrintSettings
): Promise<File> {
  const cleanInvNo = (invoice.number || 'BILL')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cleanCustomer = (party?.name || invoice.partyName || 'Customer')
    .trim()
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const fileName = `Invoice-${cleanInvNo}-${cleanCustomer}.jpg`;

  const cached = imageCache.get(`${invoice.id}_${invoice.updatedAt || ''}`);
  if (cached) return cached;

  if (typeof document !== 'undefined') {
    const shopName = printSettings?.shopName || business.name || 'Shree Sweet';
    const partyName = party?.name || invoice.partyName || 'Customer';
    const dueAmount = Math.max(0, invoice.total - invoice.paidAmount);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '794px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    container.style.padding = '36px';
    container.style.boxSizing = 'border-box';

    const linesHtml = invoice.lines.map((l, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 10px 8px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px 8px; font-weight: 600;">${l.itemName}</td>
        <td style="padding: 10px 8px; text-align: center;">${l.qty} ${l.unit}</td>
        <td style="padding: 10px 8px; text-align: right;">₹${(l.rate / 100).toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700;">₹${(l.amount / 100).toFixed(2)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="border-bottom: 4px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1e1b4b;">${shopName}</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">${business.address || ''} | Mob: +91 ${business.phone || ''}</p>
          ${business.gstin ? `<p style="margin: 2px 0 0; font-size: 12px; color: #4338ca; font-weight: bold;">GSTIN: ${business.gstin}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <span style="font-size: 20px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">TAX INVOICE</span>
          <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600;">#${invoice.number}</p>
          <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">Date: ${formatFullDate(invoice.date)}</p>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px;">BILLED TO</span>
        <h3 style="margin: 4px 0 0; font-size: 17px; font-weight: 700; color: #0f172a;">${partyName}</h3>
        <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Phone: +91 ${party?.phone || 'N/A'}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #4f46e5; color: #ffffff; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 10px 8px; width: 40px; text-align: center;">#</th>
            <th style="padding: 10px 8px; text-align: left;">Item Description</th>
            <th style="padding: 10px 8px; width: 100px; text-align: center;">Qty</th>
            <th style="padding: 10px 8px; width: 100px; text-align: right;">Rate</th>
            <th style="padding: 10px 8px; width: 120px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
        <div style="width: 280px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
            <span>Subtotal:</span>
            <span>₹${(invoice.subtotal / 100).toFixed(2)}</span>
          </div>
          ${invoice.taxTotal > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #4338ca;">
            <span>GST / Tax:</span>
            <span>₹${(invoice.taxTotal / 100).toFixed(2)}</span>
          </div>` : ''}
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 6px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0f172a;">
            <span>Grand Total:</span>
            <span style="color: #4f46e5;">₹${(invoice.total / 100).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 6px; color: #16a34a; font-weight: 600;">
            <span>Paid Amount:</span>
            <span>₹${(invoice.paidAmount / 100).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px; font-weight: 700; color: ${dueAmount > 0 ? '#dc2626' : '#16a34a'};">
            <span>Balance Due:</span>
            <span>₹${(dueAmount / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; color: #64748b; font-size: 12px;">
        <div>
          <p style="margin: 0; font-weight: 600; color: #475569;">${printSettings?.footerText || 'Thank you for your business!'}</p>
          <p style="margin: 2px 0 0;">Generated via Ledgerly</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: 600; color: #0f172a;">For ${shopName}</p>
          <div style="height: 35px;"></div>
          <p style="margin: 0; border-top: 1px dashed #cbd5e1; padding-top: 4px;">Authorized Signatory</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.95);
      });
      const file = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
      imageCache.set(`${invoice.id}_${invoice.updatedAt || ''}`, file);
      return file;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  return new File([new Blob()], fileName, { type: 'image/jpeg' });
}

/**
 * Enhanced Invoice Sharing function supporting:
 * 1. Format Choice: PDF (default), Image (JPG), or View-only Link
 * 2. Editable message template with placeholders
 * 3. In-memory caching and offline resilience
 */
export async function shareBillPdfFile({
  invoice,
  business,
  party,
  account,
  format = 'PDF',
  messageTemplate,
  printSettings,
  viewLink,
}: ShareBillPdfOptions): Promise<{ success: boolean; message: string; fileName: string; sharedViaNativeSheet: boolean }> {
  // Format clean file name: Invoice-[InvoiceNo]-[CustomerName].pdf
  const cleanInvNo = (invoice.number || 'BILL')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cleanCustomer = (party?.name || invoice.partyName || 'Customer')
    .trim()
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const templateToUse = messageTemplate || printSettings?.messageTemplate || 
    'Dear {customer_name}, here is your Bill #{bill_no} of ₹{total} from {shop_name}. Balance due: ₹{balance}. Thank you!';

  // Generate QR code if needed
  let qrDataUrl: string | null = null;
  if (printSettings?.showQr !== false) {
    qrDataUrl = await generateUpiQrDataUrl(
      business.phone || '9876543210',
      printSettings?.shopName || business.name || 'Shree Sweet',
      invoice.total,
      invoice.number
    );
  }

  // Handle LINK format
  if (format === 'LINK') {
    const resolvedLink = viewLink || (typeof window !== 'undefined' ? `${window.location.origin}/?view_invoice=${invoice.id}` : `https://legerly-an-accounting-app.vercel.app/?view_invoice=${invoice.id}`);
    const caption = formatInvoiceMessageTemplate(templateToUse, invoice, business, party, resolvedLink);
    const phone = party?.phone ? party.phone.replace(/\D/g, '') : '';
    const waUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(caption)}`
      : `https://wa.me/?text=${encodeURIComponent(caption)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    return {
      success: true,
      message: `Invoice view link created and opened in WhatsApp.`,
      fileName: `${cleanInvNo}-link`,
      sharedViaNativeSheet: false,
    };
  }

  // Handle IMAGE format
  if (format === 'IMAGE') {
    const imgFile = await generateInvoiceImageFile(invoice, business, party, printSettings);
    const caption = formatInvoiceMessageTemplate(templateToUse, invoice, business, party);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [imgFile] });
      if (canShare) {
        try {
          await navigator.share({
            files: [imgFile],
            title: imgFile.name,
            text: caption,
          });
          return {
            success: true,
            message: `Invoice image (${imgFile.name}) attached and shared directly.`,
            fileName: imgFile.name,
            sharedViaNativeSheet: true,
          };
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            return {
              success: true,
              message: `Share dialog dismissed.`,
              fileName: imgFile.name,
              sharedViaNativeSheet: true,
            };
          }
        }
      }
    }

    // Fallback: Download JPG and open WhatsApp
    const phone = party?.phone ? party.phone.replace(/\D/g, '') : '';
    const waUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(caption + `\n\n(Note: "${imgFile.name}" downloaded to your device; please attach it here).`)}`
      : `https://wa.me/?text=${encodeURIComponent(caption + `\n\n(Note: "${imgFile.name}" downloaded to your device; please attach it here).`)}`;
    
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
      alert(`Image saved (${imgFile.name}). Please attach it in WhatsApp.`);
    }

    return {
      success: true,
      message: `Image saved. Please attach in WhatsApp.`,
      fileName: imgFile.name,
      sharedViaNativeSheet: false,
    };
  }

  // Default: Handle PDF format
  const fileName = `Invoice-${cleanInvNo}-${cleanCustomer}.pdf`;
  let pdfFile: File;
  let doc: jsPDF;

  const cached = getCachedInvoicePdf(invoice.id, invoice.updatedAt);
  if (cached) {
    pdfFile = cached.file;
    doc = cached.doc;
  } else {
    doc = generateInvoicePdf(invoice, business, party, account, printSettings, qrDataUrl);
    const pdfBlob = doc.output('blob');
    pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf', lastModified: Date.now() });
    setCachedInvoicePdf(invoice.id, invoice.updatedAt, { file: pdfFile, blob: pdfBlob, doc });
  }

  const caption = formatInvoiceMessageTemplate(templateToUse, invoice, business, party);

  // 1. Native Web Share API with actual PDF File attached directly
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [pdfFile] });
    if (canShareFiles) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: fileName,
          text: caption,
        });
        return {
          success: true,
          message: `Invoice PDF (${fileName}) attached and shared directly.`,
          fileName,
          sharedViaNativeSheet: true,
        };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return {
            success: true,
            message: `Share dialog dismissed.`,
            fileName,
            sharedViaNativeSheet: true,
          };
        }
        console.warn('Native file share failed:', err);
      }
    }
  }

  // 2. Fallback: If direct file sharing is not supported, download the file and open WhatsApp link
  try {
    doc.save(fileName);
  } catch (err) {
    console.warn('Fallback save error:', err);
  }

  const phone = party?.phone ? party.phone.replace(/\D/g, '') : '';
  const fallbackText = encodeURIComponent(
    `${caption}\n\n(📄 Note: "${fileName}" has been downloaded to your device; please attach it here).`
  );
  const waUrl = phone
    ? `https://wa.me/91${phone}?text=${fallbackText}`
    : `https://wa.me/?text=${fallbackText}`;

  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank');
  }

  const fallbackMsg = `File saved (${fileName}). Direct file sharing is not supported by this browser; opening WhatsApp with message. Please attach the downloaded PDF.`;
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(fallbackMsg);
  }

  return {
    success: true,
    message: fallbackMsg,
    fileName,
    sharedViaNativeSheet: false,
  };
}

