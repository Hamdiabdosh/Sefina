import { formatInTimeZone } from "date-fns-tz";

/** Ethiopian civil timezone (UTC+3, no DST) used for attendance calendar rules. */
export const ETHIOPIA_TZ = "Africa/Addis_Ababa";

/** Current calendar date in Ethiopia as `YYYY-MM-DD`. */
export const getCalendarDateEt = (ref: Date = new Date()): string =>
  formatInTimeZone(ref, ETHIOPIA_TZ, "yyyy-MM-dd");

/**
 * Gregorian calendar subtraction for `YYYY-MM-DD` strings.
 * Ethiopian civil calendar uses Gregorian dates.
 */
export const subtractGregorianDays = (ymd: string, days: number): string => {
  const parts = ymd.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (y === undefined || mo === undefined || d === undefined) {
    throw new Error(`Invalid YMD string: ${ymd}`);
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

export const getYesterdayCalendarDateEt = (ref: Date = new Date()): string =>
  subtractGregorianDays(getCalendarDateEt(ref), 1);

/** Format a stored `@db.Date` / JS Date using Ethiopia calendar date (for edits / locks). */
export const dateToCalendarEt = (stored: Date): string =>
  formatInTimeZone(stored, ETHIOPIA_TZ, "yyyy-MM-dd");

/**
 * Postgres `DATE` + Prisma: store midday UTC anchor from `YYYY-MM-DD` to avoid TZ boundary drift.
 */
export const prismaDateFromCalendarYmd = (ymd: string): Date => {
  const parts = ymd.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`Invalid YMD string: ${ymd}`);
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
};

const calendarYmdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const parseCalendarYmd = (input: string): string | null => {
  if (!calendarYmdRegex.test(input)) return null;
  const parts = input.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return null;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return input;
};
