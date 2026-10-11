import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseEntry, Business, Party } from '../types';
import { formatPdfINR, formatFullDate } from '../utils/formatters';
import { sharePdfDocument, sharePdfToWhatsAppDirect } from './documentShareService';

export function generatePurchaseVoucherPdf(
  entry: PurchaseEntry,
  business: Business,
  party?: Party
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isReturn = entry.type === 'PURCHASE_OUT';
  const isDebitNote = entry.type === 'DEBIT_NOTE';
  const title = isDebitNote
    ? 'DEBIT NOTE VOUCHER'
    : isReturn
    ? 'PURCHASE RETURN VOUCHER'
    : 'PURCHASE IN VOUCHER';

  // Primary Theme Colors
  const headerColor = isDebitNote ? [109, 40, 217] : isReturn ? [180, 83, 9] : [37, 99, 235];
  const darkColor = [15, 23, 42];
  const greyColor = [100, 116, 139];

  // Top Color Banner
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // Business Header (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(business.name || 'Store', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  if (business.address) {
    doc.text(business.address, 14, 28, { maxWidth: 95 });
  }
  doc.text(`Mobile: +91 ${business.phone || ''}`, 14, 34);
  if (business.gstin) {
    doc.text(`GSTIN: ${business.gstin}`, 14, 39);
  }

  // Document Title & Meta (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text(title, 196, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Voucher No: ${entry.voucherNumber}`, 196, 29, { align: 'right' });
  doc.text(`Date: ${formatFullDate(entry.date)}`, 196, 34, { align: 'right' });
  doc.text(`Payment: ${entry.paymentMode}`, 196, 39, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);

  // Supplier Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text('SUPPLIER / PARTY DETAILS:', 14, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const supName = entry.supplierName || entry.partyName || party?.name || 'Supplier';
  doc.text(supName, 14, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  const supPhone = entry.supplierPhone || entry.partyPhone || party?.phone;
  if (supPhone) {
    doc.text(`Mobile: +91 ${supPhone}`, 14, 63);
  }
  if (party?.address) {
    doc.text(`Address: ${party.address}`, 14, 68);
  }
  if (party?.gstin) {
    doc.text(`GSTIN: ${party.gstin}`, 14, 73);
  }

  let startY = 80;

  // Items table if items present
  if (entry.items && entry.items.length > 0) {
    const tableData = entry.items.map((it, idx) => [
      (idx + 1).toString(),
      it.itemName,
      `${it.qty} ${it.unit || ''}`,
      formatPdfINR(it.rate),
      formatPdfINR(it.amount),
    ]);

    autoTable(doc, {
      startY,
      head: [['#', 'Item Description', 'Qty', 'Unit Rate (Rs.)', 'Amount (Rs.)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: headerColor as [number, number, number],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' },
      },
    });

    startY = ((doc as any).lastAutoTable?.finalY || 120) + 10;
  }

  // Summary Card
  const boxX = 120;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(boxX, startY, 76, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text('Payment Mode:', boxX + 4, startY + 8);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(entry.paymentMode, boxX + 72, startY + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text('Voucher Total:', boxX + 4, startY + 19);
  doc.text(formatPdfINR(entry.amount), boxX + 72, startY + 19, { align: 'right' });

  // Note
  if (entry.note) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Note / Remarks:', 14, startY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
    doc.text(entry.note, 14, startY + 12, { maxWidth: 95 });
  }

  // Signature Block
  const sigY = Math.max(startY + 45, 220);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 65, sigY);
  doc.line(145, sigY, 196, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text('Supplier Signature / Stamp', 14, sigY + 5);
  doc.text(`For ${business.name || 'Store'} (Authorized)`, 196, sigY + 5, { align: 'right' });

  return doc;
}

export async function sharePurchaseVoucher(
  entry: PurchaseEntry,
  business: Business,
  party?: Party,
  shareToWhatsApp = true
): Promise<boolean> {
  const doc = generatePurchaseVoucherPdf(entry, business, party);
  const pdfBlob = doc.output('blob');
  const fileName = `${entry.type.toLowerCase()}-${entry.voucherNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const isReturn = entry.type === 'PURCHASE_OUT';
  const isDebitNote = entry.type === 'DEBIT_NOTE';
  const typeLabel = isDebitNote ? 'Debit Note' : isReturn ? 'Purchase Return' : 'Purchase Voucher';
  const amountRs = (entry.amount / 100).toLocaleString('en-IN');
  const message = `Dear ${entry.supplierName}, here is ${typeLabel} #${entry.voucherNumber} for Rs. ${amountRs} from ${business.name || 'Store'}. Date: ${entry.date}.`;

  const phone = entry.supplierPhone || party?.phone;

  if (shareToWhatsApp && phone) {
    const res = await sharePdfToWhatsAppDirect(doc, fileName, phone, message);
    return res.success;
  }

  const res = await sharePdfDocument(doc, fileName, `${typeLabel} #${entry.voucherNumber}`, message);
  return res.success;
}
