/**
 * Directory of 36 Indian States and Union Territories with 2-digit GST state codes
 */

export interface IndianState {
  code: string; // e.g. "24"
  name: string; // e.g. "Gujarat"
  label: string; // e.g. "24 - Gujarat"
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir', label: '01 - Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh', label: '02 - Himachal Pradesh' },
  { code: '03', name: 'Punjab', label: '03 - Punjab' },
  { code: '04', name: 'Chandigarh', label: '04 - Chandigarh' },
  { code: '05', name: 'Uttarakhand', label: '05 - Uttarakhand' },
  { code: '06', name: 'Haryana', label: '06 - Haryana' },
  { code: '07', name: 'Delhi', label: '07 - Delhi' },
  { code: '08', name: 'Rajasthan', label: '08 - Rajasthan' },
  { code: '09', name: 'Uttar Pradesh', label: '09 - Uttar Pradesh' },
  { code: '10', name: 'Bihar', label: '10 - Bihar' },
  { code: '11', name: 'Sikkim', label: '11 - Sikkim' },
  { code: '12', name: 'Arunachal Pradesh', label: '12 - Arunachal Pradesh' },
  { code: '13', name: 'Nagaland', label: '13 - Nagaland' },
  { code: '14', name: 'Manipur', label: '14 - Manipur' },
  { code: '15', name: 'Mizoram', label: '15 - Mizoram' },
  { code: '16', name: 'Tripura', label: '16 - Tripura' },
  { code: '17', name: 'Meghalaya', label: '17 - Meghalaya' },
  { code: '18', name: 'Assam', label: '18 - Assam' },
  { code: '19', name: 'West Bengal', label: '19 - West Bengal' },
  { code: '20', name: 'Jharkhand', label: '20 - Jharkhand' },
  { code: '21', name: 'Odisha', label: '21 - Odisha' },
  { code: '22', name: 'Chhattisgarh', label: '22 - Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh', label: '23 - Madhya Pradesh' },
  { code: '24', name: 'Gujarat', label: '24 - Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', label: '26 - Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra', label: '27 - Maharashtra' },
  { code: '29', name: 'Karnataka', label: '29 - Karnataka' },
  { code: '30', name: 'Goa', label: '30 - Goa' },
  { code: '31', name: 'Lakshadweep', label: '31 - Lakshadweep' },
  { code: '32', name: 'Kerala', label: '32 - Kerala' },
  { code: '33', name: 'Tamil Nadu', label: '33 - Tamil Nadu' },
  { code: '34', name: 'Puducherry', label: '34 - Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands', label: '35 - Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana', label: '36 - Telangana' },
  { code: '37', name: 'Andhra Pradesh', label: '37 - Andhra Pradesh' },
  { code: '38', name: 'Ladakh', label: '38 - Ladakh' },
];

/**
 * Checks if a transaction is inter-state supply (IGST) or intra-state (CGST + SGST)
 */
export function isInterStateSupply(
  businessStateCodeOrName: string = '24',
  supplyStateCodeOrName: string = '24'
): boolean {
  if (!businessStateCodeOrName || !supplyStateCodeOrName) return false;

  const normalize = (val: string) => {
    const match = val.match(/^(\d{2})/);
    if (match) return match[1];
    return val.toLowerCase().trim();
  };

  return normalize(businessStateCodeOrName) !== normalize(supplyStateCodeOrName);
}
