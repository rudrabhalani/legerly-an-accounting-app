/**
 * Ledgerly PDF Generation Service
 * Generates beautiful, compliant Indian Tax Invoices (with & without GST),
 * Party Ledger Statements, Registers, and Financial Reports using jsPDF and autoTable.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Business, Party, LedgerEntry, Account, Item } from '../types';
import { formatINR, formatFullDate, paiseToRupees } from '../utils/formatters';
import { numberToIndianWords } from '../utils/gstCalc';

export function generateInvoicePdf(
  invoice: Invoice,
  business: Business,
  party?: Party,
  defaultAccount?: Account
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
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
  doc.text(invoice.partyName, 14, 61);

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

  const finalY = (doc as any).lastAutoTable?.finalY || 140;

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
    }
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
  if (invoice.discountTotal > 0) {
    addSummaryRow('Total Discount', `−${formatINR(invoice.discountTotal)}`);
  }
  if (withGst) {
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
  if (due > 0) {
    addSummaryRow('Balance Due', formatINR(due), true);
  }

  // Footer & Authorized Signatory
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text(`For ${business.name}`, 196, 262, { align: 'right' });
  doc.text('Authorized Signatory', 196, 276, { align: 'right' });

  doc.setFontSize(7.5);
  doc.text('Generated via Ledgerly – Simple Accounting for Everyone', 105, 286, { align: 'center' });

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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(business.name, 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Mobile: +91 ${business.phone}`, 14, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PARTY STATEMENT', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Generated: ${formatFullDate(new Date().toISOString())}`, 196, 26, { align: 'right' });

  // Party Banner Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, 182, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Party: ${party.name}`, 18, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contact: +91 ${party.phone}  |  Type: ${party.type}`, 18, 48);

  const finalEntry = entries[entries.length - 1];
  const netBal = finalEntry ? finalEntry.runningBalance : 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  if (netBal >= 0) {
    doc.setTextColor(22, 163, 74);
    doc.text(`Net: You'll get ${formatINR(netBal)}`, 190, 44, { align: 'right' });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`Net: You'll give ${formatINR(Math.abs(netBal))}`, 190, 44, { align: 'right' });
  }

  const tableData = entries.map((e) => [
    e.date,
    e.description,
    e.debit > 0 ? `₹${paiseToRupees(e.debit).toFixed(2)}` : '—',
    e.credit > 0 ? `₹${paiseToRupees(e.credit).toFixed(2)}` : '—',
    `₹${paiseToRupees(Math.abs(e.runningBalance)).toFixed(2)} ${e.runningBalance >= 0 ? 'Dr' : 'Cr'}`,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Description', 'Debit (You Give)', 'Credit (You Get)', 'Running Balance']],
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
