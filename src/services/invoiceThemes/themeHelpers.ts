import { PrintSettings } from '../../types';

export function escapeHtml(str?: string | number | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatINR(paise: number): string {
  const rs = (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${rs}`;
}

export function formatINRPlain(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function numberToWords(amountPaise: number): string {
  const rupees = Math.floor(amountPaise / 100);
  const paise = amountPaise % 100;
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += units[n] + ' ';
      } else {
        str += tens[Math.floor(n / 10)] + ' ' + units[n % 10] + ' ';
      }
    }
    return str.trim();
  }

  let result = '';
  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundredPart = rem;

  if (crore > 0) result += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) result += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) result += convertHundreds(thousand) + ' Thousand ';
  if (hundredPart > 0) result += convertHundreds(hundredPart) + ' ';

  result = result.trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertHundreds(paise) + ' Paise';
  }
  return result + ' Only';
}

export function getFontScale(size?: 'small' | 'medium' | 'large'): { base: string; scale: number } {
  if (size === 'small') return { base: '11px', scale: 0.9 };
  if (size === 'large') return { base: '14px', scale: 1.15 };
  return { base: '12px', scale: 1.0 };
}
