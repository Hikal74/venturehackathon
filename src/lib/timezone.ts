/**
 * The app is scoped to a single fixed timezone — Astana/Almaty,
 * Kazakhstan — rather than being per-user timezone-aware (there's no
 * timezone field on a care profile). That's why this is a small,
 * dependency-free helper instead of a library like date-fns-tz: Kazakhstan
 * has used a single UTC+5 offset nationwide with no DST since the March
 * 2024 unification, so it really is just a fixed offset.
 *
 * Two different problems both need this:
 *   1. Display — `toLocaleTimeString()`/`toLocaleDateString()` without an
 *      explicit `timeZone` render in whatever timezone the JS runtime is
 *      in. In the browser that's the visitor's OS timezone; on the server
 *      (Vercel's functions run in UTC) it's UTC. Neither is guaranteed to
 *      be Astana, so every formatted time was potentially off by hours.
 *   2. Day boundaries — `date.setHours(0, 0, 0, 0)` sets midnight in the
 *      *runtime's* local timezone, not Astana's. On a UTC server this
 *      makes Timeline's "today" and Reports' daily/weekly windows drift
 *      by up to 5 hours from the actual Astana calendar day.
 */
export const APP_TIMEZONE = "Asia/Almaty";
const APP_TIMEZONE_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5, no DST

/** `date.toLocaleTimeString()`, pinned to Astana time regardless of where the code runs. */
export function formatTime(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleTimeString([], { timeZone: APP_TIMEZONE, ...opts });
}

/** `date.toLocaleDateString()`, pinned to Astana time regardless of where the code runs. */
export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleDateString([], { timeZone: APP_TIMEZONE, ...opts });
}

/** `date.toLocaleString()`, pinned to Astana time regardless of where the code runs. */
export function formatDateTime(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleString([], { timeZone: APP_TIMEZONE, ...opts });
}

function astanaDateParts(date: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value])) as Record<string, string>;
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/** YYYY-MM-DD of `date` as seen in Astana — for URL params and DB date-only columns. */
export function astanaDateParam(date: Date = new Date()): string {
  const { year, month, day } = astanaDateParts(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The real instant that is midnight at the start of `date`'s calendar day in Astana. */
export function startOfDayInAstana(date: Date = new Date()): Date {
  const { year, month, day } = astanaDateParts(date);
  return new Date(Date.UTC(year, month - 1, day) - APP_TIMEZONE_OFFSET_MS);
}

/** Midnight in Astana for an explicit Y-M-D (e.g. parsed from a `?date=` query param), not "now". */
export function astanaMidnightFor(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - APP_TIMEZONE_OFFSET_MS);
}

/**
 * An `<input type="datetime-local">` value ("YYYY-MM-DDTHH:MM[:SS]") has no
 * timezone in it at all — `new Date(value)` on the server would interpret
 * those digits as the *server's* local time (UTC on Vercel), silently
 * shifting whatever the caregiver actually picked by up to 5 hours. This
 * interprets those same digits as Astana wall-clock time instead, and
 * returns the real instant they refer to.
 */
export function parseAstanaDatetimeLocal(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!m) return new Date(NaN);
  const [year, month, day, hour, minute] = m.slice(1, 6).map((v) => Number(v));
  const seconds = m[6] ? Number(m[6]) : 0;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, seconds) - APP_TIMEZONE_OFFSET_MS);
}

/** The current moment as a `datetime-local` input value, in Astana wall-clock time — for defaulting a picker to "now". */
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
  const hour = parts.hour === "24" ? "00" : parts.hour; // some ICU builds return "24" for midnight with hour12: false
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}
