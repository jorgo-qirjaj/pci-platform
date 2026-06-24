import type { ExpressionTone } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parse(iso: string): Date {
  // Treat YYYY-MM-DD as a local calendar date (avoid UTC off-by-one).
  return iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
}

/** "Jun 19" */
export function shortDate(iso: string): string {
  const d = parse(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Jun 19, 2026" */
export function shortDateYear(iso: string): string {
  const d = parse(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Wednesday, June 22" */
export function weekdayDate(iso: string): string {
  const d = parse(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}`;
}

export function gigabytes(bytes: number): string {
  return `${(bytes / 1e9).toFixed(2)} GB`;
}

export function scoreColor(tone: ExpressionTone | null | undefined): string {
  if (tone === 'oe') return 'var(--ctrl-oe)';
  if (tone === 'wt') return 'var(--ctrl-wt)';
  return 'var(--text-tertiary)';
}
