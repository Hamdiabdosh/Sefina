import { formatInTimeZone } from "date-fns-tz";
import { ETHIOPIA_TZ, prismaDateFromCalendarYmd } from "./ethiopia-time";

/** Ethiopian month 1–13, year (e.g. 2017). */
export type EthiopianYmd = { year: number; month: number; day: number };

const startDayOfEthiopian = (year: number): number => {
  const newYearDay = Math.floor(year / 100) - Math.floor(year / 400) - 4;
  return (year - 1) % 4 === 3 ? newYearDay + 1 : newYearDay;
};

/** Gregorian [y, m, d] from Ethiopian [y, m, d]. */
export const toGregorian = (year: number, month: number, day: number): [number, number, number] => {
  const newYearDay = startDayOfEthiopian(year);
  let gregorianYear = year + 7;
  let gregorianMonths = [0, 30, 31, 30, 31, 31, 28, 31, 30, 31, 30, 31, 31, 30];
  const nextYear = gregorianYear + 1;
  if ((nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0) {
    gregorianMonths[6] = 29;
  }
  let until = (month - 1) * 30 + day;
  if (until <= 37 && year <= 1575) {
    until += 28;
    gregorianMonths[0] = 31;
  } else {
    until += newYearDay - 1;
  }
  if ((year - 1) % 4 === 3) until += 1;

  let m = 0;
  let gregorianDate = 0;
  for (let i = 0; i < gregorianMonths.length; i++) {
    const g = gregorianMonths[i] ?? 0;
    if (until <= g) {
      m = i;
      gregorianDate = until;
      break;
    }
    m = i;
    until -= g;
  }
  if (m > 4) gregorianYear += 1;
  const order = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return [gregorianYear, order[m] ?? 1, gregorianDate];
};

/** Ethiopian [y, m, d] from Gregorian [y, m, d]. */
export const toEthiopian = (year: number, month: number, day: number): EthiopianYmd => {
  const gregorianMonths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const ethiopianMonths = [0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5, 30, 30, 30, 30];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    gregorianMonths[2] = 29;
  }
  let ethiopianYear = year - 8;
  if (ethiopianYear % 4 === 3) ethiopianMonths[10] = 6;
  const newYearDay = startDayOfEthiopian(ethiopianYear);
  let until = 0;
  for (let i = 1; i < month; i++) until += gregorianMonths[i] ?? 0;
  until += day;
  let tahissas = ethiopianYear % 4 === 0 ? 26 : 25;
  if (year < 1582) {
    ethiopianMonths[1] = 0;
    ethiopianMonths[2] = tahissas;
  } else if (until <= 277 && year === 1582) {
    ethiopianMonths[1] = 0;
    ethiopianMonths[2] = tahissas;
  } else {
    tahissas = newYearDay - 3;
    ethiopianMonths[1] = tahissas;
  }
  let m = 1;
  let ethiopianDate = 1;
  for (m = 1; m < ethiopianMonths.length; m++) {
    const em = ethiopianMonths[m] ?? 0;
    if (until <= em) {
      ethiopianDate =
        m === 1 || em === 0 ? until + (30 - tahissas) : until;
      break;
    }
    until -= em;
  }
  if (m > 10) ethiopianYear += 1;
  const order = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4];
  return { year: ethiopianYear, month: order[m] ?? 1, day: ethiopianDate };
};

export const getEthiopianToday = (ref: Date = new Date()): EthiopianYmd => {
  const ymd = formatInTimeZone(ref, ETHIOPIA_TZ, "yyyy-MM-dd");
  const parts = ymd.split("-").map(Number);
  const y = parts[0] ?? 2020;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return toEthiopian(y, m, d);
};

/** Last day of Ethiopian month as UTC noon anchor for comparisons. */
export const endOfEthiopianMonth = (year: number, month: number): Date => {
  const daysInMonth = month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;
  const [gy, gm, gd] = toGregorian(year, month, daysInMonth);
  const ymd = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
  return prismaDateFromCalendarYmd(ymd);
};

export const ethiopianMonthCompare = (
  a: { month: number; year: number },
  b: { month: number; year: number }
): number => {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
};

/** Iterate Ethiopian months from start (inclusive) to end (inclusive). */
export function* iterateEthiopianMonths(
  start: { month: number; year: number },
  end: { month: number; year: number }
): Generator<{ month: number; year: number }> {
  if (ethiopianMonthCompare(start, end) > 0) return;
  let y = start.year;
  let m = start.month;
  for (;;) {
    yield { year: y, month: m };
    if (y === end.year && m === end.month) break;
    m += 1;
    if (m > 13) {
      m = 1;
      y += 1;
    }
  }
}

export const parsePaymentDateYmd = (input: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const parts = input.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (y === undefined || mo === undefined || d === undefined) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
};

export const isFuturePaymentDate = (paymentDate: Date, ref: Date = new Date()): boolean => {
  const today = formatInTimeZone(ref, ETHIOPIA_TZ, "yyyy-MM-dd");
  const pay = formatInTimeZone(paymentDate, ETHIOPIA_TZ, "yyyy-MM-dd");
  return pay > today;
};
