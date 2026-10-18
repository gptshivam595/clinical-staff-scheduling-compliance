/**
 * Date utility functions for Shiftwell CareVerify
 * Uses pure calendar date math (YYYY-MM-DD) to prevent timezone drift or client machine offsets.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Format ISO date string (YYYY-MM-DD) to "19 Oct 2026"
 */
export function formatDisplayDate(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'Not recorded';
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return isoDateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (monthIdx < 0 || monthIdx > 11 || isNaN(day)) return isoDateStr;
  return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
}

/**
 * Parse YYYY-MM-DD into a comparable numeric integer: YYYYMMDD
 */
export function dateToInteger(isoDateStr: string): number {
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return 0;
  return parseInt(parts[0], 10) * 10000 + parseInt(parts[1], 10) * 100 + parseInt(parts[2], 10);
}

/**
 * Compare two ISO dates (YYYY-MM-DD)
 * Returns true if dateA is strictly before dateB (dateA < dateB)
 */
export function isBeforeDate(dateA: string, dateB: string): boolean {
  return dateToInteger(dateA) < dateToInteger(dateB);
}

/**
 * Returns true if dateA is strictly after dateB (dateA > dateB)
 */
export function isAfterDate(dateA: string, dateB: string): boolean {
  return dateToInteger(dateA) > dateToInteger(dateB);
}

/**
 * Returns true if dateA is equal to dateB
 */
export function isSameDate(dateA: string, dateB: string): boolean {
  return dateToInteger(dateA) === dateToInteger(dateB);
}

/**
 * Calculate difference in calendar days (dateB - dateA)
 */
export function getDaysDifference(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split('-').map(Number);
  const [y2, m2, d2] = dateB.split('-').map(Number);
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Core product rule from specification:
 * "Treat the expiry date as the final calendar day the credential remains valid.
 * Example:
 * - Certificate expires on 20 Oct 2026.
 * - Shift on 20 Oct 2026: passes the expiry check.
 * - Shift on 21 Oct 2026: fails the expiry check."
 * 
 * Therefore: a credential is EXPIRED for a shift date if shiftDate > expiryDate.
 */
export function isExpiredForShift(expiryDate: string, shiftDate: string): boolean {
  return dateToInteger(shiftDate) > dateToInteger(expiryDate);
}

/**
 * Specification rule:
 * "For the demo, define 'Expiring soon' consistently as a verified credential expiring within
 * the next 30 calendar days, inclusive, relative to the explicitly selected reference date.
 * Expiring soon is an informational warning; it is not automatically a block while the
 * credential remains valid for the shift date."
 */
export function isExpiringSoon(expiryDate: string, referenceDate: string): boolean {
  const diff = getDaysDifference(referenceDate, expiryDate);
  // Valid on or after referenceDate, and within 30 days
  return diff >= 0 && diff <= 30;
}
