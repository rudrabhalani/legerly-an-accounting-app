import { Invoice, PrintSettings, Business, Party, Account, InvoiceTheme } from '../../types';
import { InvoiceThemeProps, ThemeMeta } from './types';
import { renderClassicTheme } from './classicTheme';
import { renderModernTheme } from './modernTheme';
import { renderGstTaxTheme } from './gstTaxTheme';
import { renderMinimalTheme } from './minimalTheme';
import { renderThermalTheme } from './thermalTheme';
import { renderElegantTheme } from './elegantTheme';
import { renderColorfulTheme } from './colorfulTheme';
import { renderLandscapeTheme } from './landscapeTheme';

export * from './types';
export * from './themeHelpers';

export const THEME_LIST: ThemeMeta[] = [
  {
    id: 'CLASSIC',
    name: 'Classic',
    description: 'Traditional Indian accounting format with crisp grid lines and complete boxes',
    category: 'Standard',
    badge: 'Popular',
    defaultColor: '#0f172a',
  },
  {
    id: 'MODERN',
    name: 'Modern',
    description: 'Clean SaaS layout with colored accent header band and contemporary cards',
    category: 'Design',
    badge: 'Recommended',
    defaultColor: '#4F46E5',
  },
  {
    id: 'GST_TAX',
    name: 'GST / Tax Invoice',
    description: 'Full statutory CGST/SGST/IGST tax breakup table, HSN codes, and amount in words',
    category: 'Tax Compliant',
    badge: 'Govt Compliant',
    defaultColor: '#1e3a8a',
  },
  {
    id: 'MINIMAL',
    name: 'Minimal',
    description: 'Clean borderless layout with ample whitespace and typographic focus',
    category: 'Design',
    defaultColor: '#334155',
  },
  {
    id: 'THERMAL',
    name: 'Thermal Receipt',
    description: 'Compact 58mm and 80mm roll format for Bluetooth/USB thermal POS printers',
    category: 'Compact',
    badge: 'POS Printer',
    defaultColor: '#000000',
  },
  {
    id: 'ELEGANT',
    name: 'Elegant',
    description: 'Refined serif typography with ornamental gold / navy borders',
    category: 'Design',
    defaultColor: '#b45309',
  },
  {
    id: 'COLORFUL',
    name: 'Colorful',
    description: 'Vibrant rounded cards and bold gradients for retail and sweets shops',
    category: 'Design',
    defaultColor: '#059669',
  },
  {
    id: 'LANDSCAPE',
    name: 'Landscape',
    description: 'Wide horizontal presentation layout for landscape printing',
    category: 'Standard',
    defaultColor: '#1e293b',
  },
];

export const THEME_METAS = THEME_LIST;

export function renderInvoiceThemeHtml(props: InvoiceThemeProps): string {
  const theme = props.settings.invoiceTheme || props.invoice.theme || 'MODERN';

  switch (theme) {
    case 'CLASSIC':
      return renderClassicTheme(props);
    case 'GST_TAX':
      return renderGstTaxTheme(props);
    case 'MINIMAL':
      return renderMinimalTheme(props);
    case 'THERMAL':
      return renderThermalTheme(props);
    case 'ELEGANT':
      return renderElegantTheme(props);
    case 'COLORFUL':
      return renderColorfulTheme(props);
    case 'LANDSCAPE':
      return renderLandscapeTheme(props);
    case 'MODERN':
    case 'PROFESSIONAL':
    default:
      return renderModernTheme(props);
  }
}

/**
 * Realistic Sample Invoice Data used in Live Preview inside Invoice Settings
 */
export const SAMPLE_INVOICE_DATA: {
  invoice: Invoice;
  business: Business;
  party: Party;
  account: Account;
} = {
  invoice: {
    id: 'inv-sample-demo',
    type: 'SALE',
    number: 'INV/2026/042',
    partyId: 'party-sample-01',
    partyName: 'Rajesh Sharma',
    customerPhone: '9876543210',
    date: '2026-10-12',
    dueDate: '2026-10-22',
    financialYear: '2026-27',
    withGst: true,
    stateOfSupply: '24 - Gujarat',
    placeOfSupply: '24 - Gujarat',
    subtotal: 124000, // ₹1,240.00
    discountTotal: 4000, // ₹40.00
    taxableAmount: 120000, // ₹1,200.00
    taxTotal: 6000, // ₹60.00
    cgstTotal: 3000,
    sgstTotal: 3000,
    roundOff: 0,
    total: 126000, // ₹1,260.00
    paidAmount: 100000, // ₹1,000.00
    paymentMode: 'UPI',
    status: 'PARTIAL',
    lines: [
      {
        id: 'line-1',
        itemId: 'item-1',
        itemName: 'Kaju Katli Special',
        unit: 'kg',
        qty: 1,
        rate: 90000,
        discountPercent: 0,
        taxPercent: 5,
        amount: 90000,
        hsn: '2106',
      },
      {
        id: 'line-2',
        itemId: 'item-2',
        itemName: 'Dry Fruit Barfi',
        unit: 'kg',
        qty: 0.5,
        rate: 68000,
        discountPercent: 5,
        taxPercent: 5,
        amount: 34000,
        hsn: '2106',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  business: {
    id: 'biz-sample',
    name: 'Shree Sweets & Bakers',
    ownerName: 'Harsh Patel',
    ownerPhone: '9825098250',
    phone: '9825098250',
    currency: 'INR',
    gstEnabled: true,
    gstin: '24ABCDE1234F1Z5',
    address: 'Shop 4, Sardar Patel Complex, MG Road, Ahmedabad, Gujarat',
    state: '24 - Gujarat',
    financialYearStart: '2026-04-01',
    language: 'en',
    pinEnabled: false,
    isOnboarded: true,
    bankName: 'State Bank of India',
    bankAccountNo: '304958192834',
    bankIfsc: 'SBIN0001234',
    upiId: 'shreesweets@sbi',
  },
  party: {
    id: 'party-sample-01',
    name: 'Rajesh Sharma',
    phone: '9876543210',
    type: 'CUSTOMER',
    address: 'Flat 302, Gokul Dham, Satellite, Ahmedabad',
    gstin: '24AAAPL1234C1ZV',
    openingBalance: 0,
    openingType: 'RECEIVABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  },
  account: {
    id: 'acc-sample-1',
    type: 'BANK',
    bankName: 'State Bank of India',
    nickname: 'SBI Current',
    accountNumberMasked: '•••• 2834',
    ifsc: 'SBIN0001234',
    openingBalance: 5000000,
    currentBalance: 5240000,
  },
};
