const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** 所有「純日期」都用 UTC 午夜儲存，避免 server 時區造成偏移一天 */
export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateDots(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

export function formatWeekday(date: Date): string {
  return WEEKDAYS[date.getUTCDay()];
}
