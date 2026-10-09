/**
 * Ledgerly PDF Generation Service
 * Generates beautiful, compliant Indian Tax Invoices and Party Ledger Statements
 * using jsPDF and autoTable.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Business, Party, LedgerEntry } from '../types';
import { formatINR, formatFullDate, paiseToRupees } from '../utils/formatters';

export function generateInvoicePdf(
  invoice: Invoice,
  business: Business,
  party?: Party
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Primary colors
  const primaryColor = [79, 70, 229]; // #4F46E5
  const slateColor = [15, 23, 42];    // #0F172A
  const greyColor = [100, 116, 139];  // #64748B

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 10, 'F');

  // Business Info (Left Header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(business.name, 14, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  if (business.address) {
    doc.text(business.address, 14, 30, { maxWidth: 100 });
  }
  doc.text(`Phone: +91 ${business.phone}`, 14, 38);
  if (business.gstin) {
    doc.text(`GSTIN: ${business.gstin}`, 14, 43);
  }

  // Invoice Title & Meta (Right Header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(invoice.type === 'SALE' ? 'TAX INVOICE' : 'PURCHASE BILL', 196, 24, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(`Invoice No: ${invoice.number}`, 196, 32, { align: 'right' });
  doc.text(`Date: ${formatFullDate(invoice.date)}`, 196, 37, { align: 'right' });
  doc.text(`Due Date: ${formatFullDate(invoice.dueDate)}`, 196, 42, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 48, 196, 48);

  // Bill To / Party Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILL TO:', 14, 55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(invoice.partyName, 14, 61);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  if (party?.phone) {
    doc.text(`Phone: +91 ${party.phone}`, 14, 66);
  }
  if (party?.address) {
    doc.text(`Address: ${party.address}`, 14, 71, { maxWidth: 100 });
  }
  if (party?.gstin) {
    doc.text(`GSTIN: ${party.gstin}`, 14, 76);
  }

  // Items Table
  const tableData = invoice.lines.map((line, idx) => [
    (idx + 1).toString(),
    line.itemName,
    `${line.qty} ${line.unit}`,
    `₹${paiseToRupees(line.rate).toFixed(2)}`,
    line.discountPercent > 0 ? `${line.discountPercent}%` : '—',
    line.taxPercent > 0 ? `${line.taxPercent}%` : '0%',
    `₹${paiseToRupees(line.amount).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['#', 'Item Description', 'Qty', 'Rate', 'Disc', 'GST', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 27, halign: 'right' },
    },
  });

  // Calculate final Y position after table
  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  // Summary Card / Totals on the right
  const summaryX = 125;
  const summaryWidth = 71;
  let currentY = finalY + 8;

  const addSummaryRow = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 10 : 9);
    doc.setTextColor(isAccent ? primaryColor[0] : slateColor[0], isAccent ? primaryColor[1] : slateColor[1], isAccent ? primaryColor[2] : slateColor[2]);
    doc.text(label, summaryX, currentY);
    doc.text(value, summaryX + summaryWidth, currentY, { align: 'right' });
    currentY += 6;
  };

  addSummaryRow('Subtotal', formatINR(invoice.subtotal));
  if (invoice.discountTotal > 0) {
    addSummaryRow('Total Discount', `−${formatINR(invoice.discountTotal)}`);
  }
  if (invoice.taxTotal > 0) {
    addSummaryRow('Total Tax (GST)', `+${formatINR(invoice.taxTotal)}`);
  }
  if (invoice.roundOff !== 0) {
    addSummaryRow('Round Off', `${invoice.roundOff > 0 ? '+' : '−'}${formatINR(Math.abs(invoice.roundOff))}`);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX, currentY - 2, summaryX + summaryWidth, currentY - 2);

  addSummaryRow('Grand Total', formatINR(invoice.total), true, true);
  addSummaryRow('Amount Received', formatINR(invoice.paidAmount));
  const due = Math.max(0, invoice.total - invoice.paidAmount);
  addSummaryRow('Balance Due', formatINR(due), true);

  // Notes & Signatures
  const notesY = finalY + 8;
  if (invoice.notes || invoice.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Terms & Notes:', 14, notesY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
    let tY = notesY + 5;
    if (invoice.notes) {
      doc.text(invoice.notes, 14, tY, { maxWidth: 100 });
      tY += 6;
    }
    if (invoice.terms) {
      doc.text(invoice.terms, 14, tY, { maxWidth: 100 });
    }
  }

  // Footer & Authorized Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text(`For ${business.name}`, 196, 260, { align: 'right' });
  doc.text('Authorized Signatory', 196, 275, { align: 'right' });

  doc.setFontSize(8);
  doc.text('Generated via Ledgerly – Simple Accounting for Everyone', 105, 285, { align: 'center' });

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

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(business.name, 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Phone: ${business.phone}`, 14, 26);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ACCOUNT STATEMENT', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Generated: ${formatFullDate(new Date().toISOString())}`, 196, 26, { align: 'right' });

  // Party Banner Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, 182, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Party: ${party.name}`, 18, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contact: +91 ${party.phone}  |  Type: ${party.type}`, 18, 48);

  const finalEntry = entries[entries.length - 1];
  const netBal = finalEntry ? finalEntry.runningBalance : 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (netBal >= 0) {
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`Net Balance: You'll get ${formatINR(netBal)}`, 190, 44, { align: 'right' });
  } else {
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Net Balance: You'll give ${formatINR(Math.abs(netBal))}`, 190, 44, { align: 'right' });
  }

  // Table Data
  const tableData = entries.map((e) => [
    e.date,
    e.description,
    e.debit > 0 ? `₹${paiseToRupees(e.debit).toFixed(2)}` : '—',
    e.credit > 0 ? `₹${paiseToRupees(e.credit).toFixed(2)}` : '—',
    `₹${paiseToRupees(Math.abs(e.runningBalance)).toFixed(2)} ${e.runningBalance >= 0 ? 'Dr' : 'Cr'}`,
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['Date', 'Description', 'Debit (Paid)', 'Credit (Received)', 'Running Balance']],
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
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 72 },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 29, halign: 'right' },
    },
  });

  return doc;
}
