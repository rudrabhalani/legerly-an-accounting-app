import { Invoice, PrintSettings, Business, Party, Account, InvoiceTheme } from '../../types';

export interface InvoiceThemeProps {
  invoice: Invoice;
  settings: PrintSettings;
  business: Business;
  party?: Party;
  account?: Account;
  qrDataUrl?: string | null;
}

export type ThemeRenderer = (props: InvoiceThemeProps) => string;

export interface ThemeMeta {
  id: InvoiceTheme;
  name: string;
  description: string;
  category: 'Standard' | 'Tax Compliant' | 'Compact' | 'Design';
  badge?: string;
  defaultColor: string;
}
