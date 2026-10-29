// lib/format.ts
// Arabic locale with Latin digits — matches the product's typographic convention.
const LOCALE = 'ar-u-nu-latn';

const numberFormat = new Intl.NumberFormat(LOCALE);
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatShortDate(iso: string): string {
  return shortDateFormat.format(new Date(iso));
}

export function formatWeekday(iso: string): string {
  return weekdayFormat.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** "منذ ساعتين", "غداً", "بعد 3 أيام" … */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  if (abs < HOUR) return relativeFormat.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return relativeFormat.format(Math.round(diff / HOUR), 'hour');
  return relativeFormat.format(Math.round(diff / DAY), 'day');
}

/** Whole calendar days from now until `iso` (negative when past). */
export function daysUntil(iso: string, now: number = Date.now()): number {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((startOfDay(new Date(iso).getTime()) - startOfDay(now)) / DAY);
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
