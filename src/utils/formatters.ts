/**
 * Indian Rupee & Number Formatting Utilities
 * Strictly supports Indian comma group formatting: e.g., ₹1,25,000.00 (Lakhs and Crores)
 * and tabular numeric presentation.
 */

/**
 * Converts integer paise into rupees floating value for display/input
 */
export function paiseToRupees(paise: number): number {
  return (paise || 0) / 100;
}

/**
 * Converts rupee decimal input into exact integer paise
 * Rounds to nearest integer to avoid any precision flaws
 */
export function rupeesToPaise(rupees: number | string): number {
  const val = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

/**
 * Formats a number with Indian Lakhs and Crores numbering system
 * Example: 125000 -> 1,25,000
 */
export function formatIndianNumber(num: number, showDecimals: boolean = false): string {
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian formatting: last 3 digits, then groups of 2
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  if (showDecimals && decimalPart) {
    return `${integerPart}.${decimalPart}`;
  }
  return integerPart;
}

export interface FormatINROptions {
  showPaisa?: boolean; // Default false unless there are non-zero paise
  showSign?: boolean;  // Prepend '+' or '−'
  type?: 'IN' | 'OUT' | 'NEUTRAL';
}

/**
 * Primary Currency Formatter
 * Input: amount in PAISE (e.g. 12500000 = ₹1,25,000.00)
 */
export function formatINR(paise: number, options: FormatINROptions = {}): string {
  const { showPaisa = false, showSign = false, type = 'NEUTRAL' } = options;
  const rupeeVal = paiseToRupees(Math.abs(paise));
  
  // Decide whether to show decimal paise
  const hasDecimals = paise % 100 !== 0;
  const displayDecimals = showPaisa || hasDecimals;
  
  const formatted = formatIndianNumber(rupeeVal, displayDecimals);
  const base = `₹${formatted}`;

  if (!showSign) {
    return paise < 0 ? `−${base}` : base;
  }

  if (type === 'IN') {
    return `+${base}`;
  } else if (type === 'OUT') {
    return `−${base}`;
  } else {
    return paise < 0 ? `−${base}` : base;
  }
}

/**
 * Formats date into human friendly Indian accounting style
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Formats full date with year: "12 Oct 2026"
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats time: "02:30 PM"
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m} ${period}`;
  }
  return timeStr;
}

/**
 * Get current date string: YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string: HH:mm
 */
export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
