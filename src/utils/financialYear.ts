/**
 * Indian Financial Year Utilities (April 1 to March 31)
 */

export function getCurrentFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 is January, 3 is April

  if (month >= 3) {
    // April (3) to December (11): FY is year-(year+1)
    const nextYearShort = (year + 1).toString().slice(-2);
    return `${year}-${nextYearShort}`;
  } else {
    // January (0) to March (2): FY is (year-1)-year
    const currentYearShort = year.toString().slice(-2);
    return `${year - 1}-${currentYearShort}`;
  }
}

export function getFinancialYearLabel(fy: string): string {
  const parts = fy.split('-');
  if (parts.length === 2) {
    const startYear = parts[0];
    const endYearShort = parts[1];
    return `FY ${startYear}-${endYearShort} (1 Apr ${startYear} – 31 Mar 20${endYearShort})`;
  }
  return `FY ${fy}`;
}

export function getAvailableFinancialYears(): string[] {
  const current = getCurrentFinancialYear();
  const [currStart] = current.split('-').map(Number);
  return [
    `${currStart - 2}-${(currStart - 1).toString().slice(-2)}`,
    `${currStart - 1}-${currStart.toString().slice(-2)}`,
    current,
    `${currStart + 1}-${(currStart + 2).toString().slice(-2)}`,
  ];
}

export function isDateInFinancialYear(dateStr: string, fy: string): boolean {
  if (!dateStr || !fy) return true;
  const parts = fy.split('-');
  if (parts.length !== 2) return true;
  const startYear = parseInt(parts[0], 10);
  const endYear = 2000 + parseInt(parts[1], 10);

  const start = new Date(`${startYear}-04-01`);
  const end = new Date(`${endYear}-03-31T23:59:59`);
  const d = new Date(dateStr);

  return d >= start && d <= end;
}
