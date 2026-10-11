import { describe, it, expect, beforeEach } from 'vitest';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import {
  renderInvoiceThemeHtml,
  THEME_METAS,
  SAMPLE_INVOICE_DATA,
} from '../services/invoiceThemes';
import { generatePurchaseVoucherPdf } from '../services/purchaseVoucherService';
import { generateInvoicePdf, formatInvoiceMessageTemplate } from '../services/pdfService';
import { InvoiceTheme, PurchaseEntry, PrintSettings } from '../types';

describe('Part 1: Purchase Section (Vyapar-style simple accounting)', () => {
  beforeEach(() => {
    useLedgerlyStore.setState({
      parties: [
        {
          id: 'supplier-test-1',
          name: 'Amul Dairy Distributors',
          phone: '9898989898',
          type: 'SUPPLIER',
          openingBalance: 0,
          openingType: 'PAYABLE',
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        },
      ],
      purchases: [],
      transactions: [],
    });
  });

  it('records Purchase In (goods bought) and increases supplier payable balance on CREDIT', () => {
    const store = useLedgerlyStore.getState();
    const supplierId = 'supplier-test-1';

    // 1. Add credit purchase of Rs. 15,000 (1,500,000 paise)
    store.addPurchaseEntry({
      type: 'PURCHASE_IN',
      partyId: supplierId,
      partyName: 'Amul Dairy Distributors',
      partyPhone: '9898989898',
      amount: 1500000,
      paymentMode: 'CREDIT',
      date: '2026-10-12',
      note: '50kg pure ghee + 20 crates milk',
    });

    const updated = useLedgerlyStore.getState();
    expect(updated.purchases.length).toBe(1);
    expect(updated.purchases[0].voucherNumber).toContain('PIN-');
    expect(updated.purchases[0].amount).toBe(1500000);

    // Supplier balance should increase (payable)
    const supplier = updated.parties.find((p) => p.id === supplierId);
    expect(supplier?.balance).toBe(1500000);
  });

  it('records Purchase Out / Return and decreases supplier payable balance', () => {
    const store = useLedgerlyStore.getState();
    const supplierId = 'supplier-test-1';

    // Initial purchase in
    store.addPurchaseEntry({
      type: 'PURCHASE_IN',
      partyId: supplierId,
      partyName: 'Amul Dairy Distributors',
      amount: 1000000,
      paymentMode: 'CREDIT',
      date: '2026-10-12',
    });

    // Supplier returns Rs. 2,000 goods
    store.addPurchaseEntry({
      type: 'PURCHASE_OUT',
      partyId: supplierId,
      partyName: 'Amul Dairy Distributors',
      amount: 200000,
      paymentMode: 'CREDIT',
      date: '2026-10-12',
      note: 'Returned 2 damaged crates milk',
    });

    const updated = useLedgerlyStore.getState();
    expect(updated.purchases.length).toBe(2);
    expect(updated.purchases[0].voucherNumber).toContain('POUT-');

    // Net supplier balance: 10,000 - 2,000 = 8,000
    const supplier = updated.parties.find((p) => p.id === supplierId);
    expect(supplier?.balance).toBe(800000);
  });

  it('records Debit Note and reduces supplier payable balance', () => {
    const store = useLedgerlyStore.getState();
    const supplierId = 'supplier-test-1';

    // Initial purchase in
    store.addPurchaseEntry({
      type: 'PURCHASE_IN',
      partyId: supplierId,
      partyName: 'Amul Dairy Distributors',
      amount: 500000,
      paymentMode: 'CREDIT',
      date: '2026-10-12',
    });

    // Debit Note for Rs. 500 rate difference discount
    store.addPurchaseEntry({
      type: 'DEBIT_NOTE',
      partyId: supplierId,
      partyName: 'Amul Dairy Distributors',
      amount: 50000,
      paymentMode: 'CREDIT',
      date: '2026-10-12',
      note: 'Agreed bulk price discount adjustment',
    });

    const updated = useLedgerlyStore.getState();
    expect(updated.purchases.length).toBe(2);
    expect(updated.purchases[0].voucherNumber).toContain('DN-');

    // Balance: 5,000 - 500 = 4,500
    const supplier = updated.parties.find((p) => p.id === supplierId);
    expect(supplier?.balance).toBe(450000);
  });

  it('generates a valid Purchase Voucher PDF', () => {
    const entry: PurchaseEntry = {
      id: 'purch-test-01',
      voucherNumber: 'PIN-2026-001',
      type: 'PURCHASE_IN',
      partyId: 'supplier-test-1',
      partyName: 'Amul Dairy Distributors',
      partyPhone: '9898989898',
      amount: 1250000,
      paymentMode: 'CASH',
      date: '2026-10-12',
      note: 'Sweet ingredients & dry fruits',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const business = useLedgerlyStore.getState().business;
    const doc = generatePurchaseVoucherPdf(entry, business);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});

describe('Part 2: 8 Invoice Themes with Live Previews & Customizations', () => {
  const allThemes: InvoiceTheme[] = [
    'CLASSIC',
    'MODERN',
    'GST_TAX',
    'MINIMAL',
    'THERMAL',
    'ELEGANT',
    'COLORFUL',
    'LANDSCAPE',
  ];

  it('has all 8 ready-made themes defined in metadata catalog', () => {
    expect(THEME_METAS.length).toBeGreaterThanOrEqual(8);
    const themeIds = THEME_METAS.map((m) => m.id);
    for (const t of allThemes) {
      expect(themeIds).toContain(t);
    }
  });

  it.each(allThemes)('renders complete HTML for theme "%s"', (theme) => {
    const settings: PrintSettings = {
      ...useLedgerlyStore.getState().printSettings,
      invoiceTheme: theme,
      accentColor: '#4F46E5',
      showCustomerName: true,
      paperSize: theme === 'THERMAL' ? '58mm' : theme === 'LANDSCAPE' ? 'A4' : 'A4',
    };

    const html = renderInvoiceThemeHtml({
      invoice: SAMPLE_INVOICE_DATA.invoice,
      business: SAMPLE_INVOICE_DATA.business,
      party: SAMPLE_INVOICE_DATA.party,
      account: SAMPLE_INVOICE_DATA.account,
      settings,
    });

    expect(html).toBeDefined();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('INV/2026/042');
    expect(html).toContain('Shree Sweets &amp; Bakers');
    // Ensure customer name is present
    expect(html).toContain('Rajesh Sharma');
  });

  it('correctly adapts layout for thermal paper sizes (58mm and 80mm)', () => {
    const html58 = renderInvoiceThemeHtml({
      invoice: SAMPLE_INVOICE_DATA.invoice,
      business: SAMPLE_INVOICE_DATA.business,
      party: SAMPLE_INVOICE_DATA.party,
      settings: {
        ...useLedgerlyStore.getState().printSettings,
        invoiceTheme: 'THERMAL',
        paperSize: '58mm',
      },
    });

    expect(html58).toContain('54mm');
    expect(html58).toContain('monospace');

    const html80 = renderInvoiceThemeHtml({
      invoice: SAMPLE_INVOICE_DATA.invoice,
      business: SAMPLE_INVOICE_DATA.business,
      party: SAMPLE_INVOICE_DATA.party,
      settings: {
        ...useLedgerlyStore.getState().printSettings,
        invoiceTheme: 'THERMAL',
        paperSize: '80mm',
      },
    });

    expect(html80).toContain('76mm');
  });
});

describe('Part 3: Show Customer Name Toggle (ON / OFF switch)', () => {
  it('cleanly removes customer name across all 8 themes when toggle is OFF with no empty voids or "undefined"', () => {
    const allThemes: InvoiceTheme[] = [
      'CLASSIC',
      'MODERN',
      'GST_TAX',
      'MINIMAL',
      'THERMAL',
      'ELEGANT',
      'COLORFUL',
      'LANDSCAPE',
    ];

    for (const theme of allThemes) {
      const html = renderInvoiceThemeHtml({
        invoice: SAMPLE_INVOICE_DATA.invoice,
        business: SAMPLE_INVOICE_DATA.business,
        party: SAMPLE_INVOICE_DATA.party,
        settings: {
          ...useLedgerlyStore.getState().printSettings,
          invoiceTheme: theme,
          showCustomerName: false, // OFF
        },
      });

      // Must NOT contain the specific customer name
      expect(html).not.toContain('Rajesh Sharma');
      // Must NOT contain "undefined" or broken placeholders
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('null');
    }
  });

  it('cleanly removes customer name from jsPDF standard and thermal layouts without throwing errors', () => {
    const business = SAMPLE_INVOICE_DATA.business;
    const invoice = SAMPLE_INVOICE_DATA.invoice;
    const party = SAMPLE_INVOICE_DATA.party;

    // Standard A4 with showCustomerName: false
    const docA4 = generateInvoicePdf(invoice, business, party, undefined, {
      ...useLedgerlyStore.getState().printSettings,
      showCustomerName: false,
      paperSize: 'A4',
    });
    expect(docA4).toBeDefined();
    expect(docA4.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    // Thermal 58mm with showCustomerName: false
    const docThermal = generateInvoicePdf(invoice, business, party, undefined, {
      ...useLedgerlyStore.getState().printSettings,
      showCustomerName: false,
      paperSize: '58mm',
    });
    expect(docThermal).toBeDefined();
    expect(docThermal.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('uses clean fallback in WhatsApp message template when showCustomerName is OFF', () => {
    const template = 'Dear {customer_name}, your Bill #{bill_no} for ₹{total} from {shop_name} is ready.';
    const business = SAMPLE_INVOICE_DATA.business;
    const invoice = SAMPLE_INVOICE_DATA.invoice;
    const party = SAMPLE_INVOICE_DATA.party;

    // 1. When ON
    const msgOn = formatInvoiceMessageTemplate(template, invoice, business, party, undefined, {
      ...useLedgerlyStore.getState().printSettings,
      showCustomerName: true,
    });
    expect(msgOn).toContain('Dear Rajesh Sharma');

    // 2. When OFF
    const msgOff = formatInvoiceMessageTemplate(template, invoice, business, party, undefined, {
      ...useLedgerlyStore.getState().printSettings,
      showCustomerName: false,
    });
    expect(msgOff).toContain('Dear Customer');
    expect(msgOff).not.toContain('Rajesh Sharma');
  });
});
