/**
 * Indian Banks Directory & Search Helper
 * Supports instant search by full name, acronym (SBI, BOB, PNB, etc.), or keywords.
 */

export interface IndianBank {
  code: string;
  name: string;
  shortName: string;
  aliases: string[];
  color: string;
  initials: string;
}

export const INDIAN_BANKS: IndianBank[] = [
  {
    code: 'SBI',
    name: 'State Bank of India',
    shortName: 'SBI',
    aliases: ['sbi', 'state bank', 'state bank of india'],
    color: '#1E40AF',
    initials: 'SBI',
  },
  {
    code: 'HDFC',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    aliases: ['hdfc', 'hdfc bank'],
    color: '#1E3A8A',
    initials: 'HDFC',
  },
  {
    code: 'ICICI',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    aliases: ['icici', 'icici bank'],
    color: '#B45309',
    initials: 'ICICI',
  },
  {
    code: 'AXIS',
    name: 'Axis Bank',
    shortName: 'Axis',
    aliases: ['axis', 'axis bank', 'uti'],
    color: '#9F1239',
    initials: 'AXIS',
  },
  {
    code: 'PNB',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    aliases: ['pnb', 'punjab national bank'],
    color: '#B91C1C',
    initials: 'PNB',
  },
  {
    code: 'BOB',
    name: 'Bank of Baroda',
    shortName: 'Bank of Baroda',
    aliases: ['bob', 'baroda', 'bank of baroda'],
    color: '#EA580C',
    initials: 'BOB',
  },
  {
    code: 'KOTAK',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    aliases: ['kotak', 'kotak mahindra', 'kmb'],
    color: '#DC2626',
    initials: 'KMB',
  },
  {
    code: 'CANARA',
    name: 'Canara Bank',
    shortName: 'Canara',
    aliases: ['canara', 'canara bank', 'syndicate'],
    color: '#0284C7',
    initials: 'CAN',
  },
  {
    code: 'UNION',
    name: 'Union Bank of India',
    shortName: 'Union Bank',
    aliases: ['union', 'union bank', 'ubi', 'andhra', 'corporation'],
    color: '#3730A3',
    initials: 'UBI',
  },
  {
    code: 'IDBI',
    name: 'IDBI Bank',
    shortName: 'IDBI',
    aliases: ['idbi', 'idbi bank'],
    color: '#047857',
    initials: 'IDBI',
  },
  {
    code: 'INDUSIND',
    name: 'IndusInd Bank',
    shortName: 'IndusInd',
    aliases: ['indusind', 'indus ind'],
    color: '#831843',
    initials: 'INDB',
  },
  {
    code: 'YES',
    name: 'Yes Bank',
    shortName: 'Yes Bank',
    aliases: ['yes', 'yes bank'],
    color: '#0284C7',
    initials: 'YES',
  },
  {
    code: 'CENTRAL',
    name: 'Central Bank of India',
    shortName: 'Central Bank',
    aliases: ['central bank', 'cbi', 'central'],
    color: '#C2410C',
    initials: 'CBI',
  },
  {
    code: 'INDIAN',
    name: 'Indian Bank',
    shortName: 'Indian Bank',
    aliases: ['indian bank', 'allahabad'],
    color: '#1D4ED8',
    initials: 'INB',
  },
  {
    code: 'BOI',
    name: 'Bank of India',
    shortName: 'Bank of India',
    aliases: ['boi', 'bank of india'],
    color: '#D97706',
    initials: 'BOI',
  },
  {
    code: 'FEDERAL',
    name: 'Federal Bank',
    shortName: 'Federal',
    aliases: ['federal', 'federal bank'],
    color: '#0F766E',
    initials: 'FED',
  },
  {
    code: 'IDFC',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC FIRST',
    aliases: ['idfc', 'idfc first'],
    color: '#BE123C',
    initials: 'IDFC',
  },
  {
    code: 'BANDHAN',
    name: 'Bandhan Bank',
    shortName: 'Bandhan',
    aliases: ['bandhan', 'bandhan bank'],
    color: '#0369A1',
    initials: 'BBL',
  },
];

/**
 * Filter Indian banks based on search query.
 * Typing "SBI" matches "State Bank of India".
 */
export function searchIndianBanks(query: string): IndianBank[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return INDIAN_BANKS;

  return INDIAN_BANKS.filter((bank) => {
    if (bank.code.toLowerCase().includes(clean)) return true;
    if (bank.name.toLowerCase().includes(clean)) return true;
    if (bank.shortName.toLowerCase().includes(clean)) return true;
    return bank.aliases.some((alias) => alias.includes(clean));
  });
}
