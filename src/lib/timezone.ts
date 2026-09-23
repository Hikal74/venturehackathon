export const APP_TIMEZONE = "Asia/Almaty";
const APP_TIMEZONE_OFFSET_MS = 5 * 60 * 60 * 1000;

export function formatTime(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleTimeString([], { timeZone: APP_TIMEZONE, ...opts });
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleDateString([], { timeZone: APP_TIMEZONE, ...opts });
}

export function formatDateTime(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleString([], { timeZone: APP_TIMEZONE, ...opts });
}

function astanaDateParts(date: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value])) as Record<string, string>;
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

export function astanaDateParam(date: Date = new Date()): string {
  const { year, month, day } = astanaDateParts(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function startOfDayInAstana(date: Date = new Date()): Date {
  const { year, month, day } = astanaDateParts(date);
  return new Date(Date.UTC(year, month - 1, day) - APP_TIMEZONE_OFFSET_MS);
}

export function astanaMidnightFor(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - APP_TIMEZONE_OFFSET_MS);
}

export function parseAstanaDatetimeLocal(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!m) return new Date(NaN);
  const [year, month, day, hour, minute] = m.slice(1, 6).map((v) => Number(v));
  const seconds = m[6] ? Number(m[6]) : 0;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, seconds) - APP_TIMEZONE_OFFSET_MS);
}

export function nowAsAstanaDatetimeLocal(): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value])) as Record<string, string>;
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}
