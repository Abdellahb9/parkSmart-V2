// Locale-correct formatting in one place, following the active language:
// fr-MA in French, ar-MA in Arabic (Latin digits, د.م. for the dirham).
import i18n, { currentLocale } from '../i18n';

// Intl formatters are costly to build; keep one per locale and shape.
const cache = new Map();
const get = (kind, options) => {
  const locale = currentLocale();
  const key = `${locale}|${kind}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      kind.startsWith('date') ? new Intl.DateTimeFormat(locale, options) : new Intl.NumberFormat(locale, options)
    );
  }
  return cache.get(key);
};

const isNum = (v) => v != null && !Number.isNaN(Number(v));

export const fmtNumber = (v) => (isNum(v) ? get('number').format(Number(v)) : '—');

export const fmtMAD = (v) =>
  isNum(v) ? get('currency', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(v)) : '—';

export const fmtDate = (v) =>
  v ? get('date', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v)) : '—';

export const fmtDateTime = (v) =>
  v
    ? get('datetime', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
        new Date(v)
      )
    : '—';

/** Short weekday from Mongo's $dayOfWeek (1 = Sunday). */
export const dayName = (dayOfWeek) => i18n.t('days', { returnObjects: true })[dayOfWeek] ?? String(dayOfWeek);

/** "08h" in French, "08:00" in Arabic. */
export const hourLabel = (h) => i18n.t('hourLabel', { h: String(h).padStart(2, '0') });

/** Percentage change, or null when there is no baseline to compare against. */
export const trendPct = (current, previous) => {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
};

/** Minutes a booking has run past its end time, or 0. */
export const overstayMinutes = (endTime) => {
  if (!endTime) return 0;
  const diff = Date.now() - new Date(endTime).getTime();
  return diff > 0 ? Math.floor(diff / 60000) : 0;
};

/** "2 h 15" / "45 min" — "2 س 15" / "45 د" in Arabic. */
export const fmtDuration = (minutes) => {
  const m = Math.max(0, Math.floor(minutes));
  const h = Math.floor(m / 60);
  const ar = i18n.language === 'ar';
  if (h > 0) return `${fmtNumber(h)} ${ar ? 'س' : 'h'} ${String(m % 60).padStart(2, '0')}`;
  return `${fmtNumber(m)} ${ar ? 'د' : 'min'}`;
};

/** Collator for sorting table text in the active language. */
export const compareText = (a, b) =>
  String(a).localeCompare(String(b), currentLocale(), { numeric: true, sensitivity: 'base' });

/**
 * Wraps a left-to-right value (a plate like 1234-A-70, an email) in Unicode
 * first-strong isolates before it goes into a translated sentence. Inside
 * Arabic text the bidi algorithm would otherwise reorder its parts and show
 * the plate as 70-A-1234.
 */
export const isolate = (value) => `\u2068${value ?? ''}\u2069`;
