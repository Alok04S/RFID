export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parse any date representation (ISO string, SQLite string, epoch ms)
 * into a valid Date object.
 */
export function parseToDate(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    // If it's an SQLite string like '2026-10-09 18:05:00'
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      // It is stored in IST local representation. Parse ISO with +05:30
      return new Date(trimmed.replace(' ', 'T') + '+05:30');
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Formats time in IST (12-hour AM/PM with seconds): e.g. "06:05:22 PM"
 */
export function formatIstTime(dateOrStr, options = {}) {
  const d = parseToDate(dateOrStr);
  if (!d) return '--:--:--';

  const defaultOpts = {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options
  };

  try {
    return new Intl.DateTimeFormat('en-IN', defaultOpts).format(d).toUpperCase();
  } catch (e) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

/**
 * Formats date in IST: e.g. "09/10/2026" or "09 Oct 2026"
 */
export function formatIstDate(dateOrStr, options = {}) {
  const d = parseToDate(dateOrStr);
  if (!d) return '--/--/----';

  const defaultOpts = {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };

  try {
    return new Intl.DateTimeFormat('en-IN', defaultOpts).format(d);
  } catch (e) {
    return d.toLocaleDateString();
  }
}

/**
 * Formats both Date and Time in IST: e.g. "09 Oct 2026, 06:05:22 PM"
 */
export function formatIstDateTime(dateOrStr) {
  const d = parseToDate(dateOrStr);
  if (!d) return '--';

  const datePart = formatIstDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = formatIstTime(d);
  return `${datePart}, ${timePart}`;
}
