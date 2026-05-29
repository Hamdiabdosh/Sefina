import { toEthiopian, toGregorian } from 'ethiopian-date';
import type { TFunction } from 'i18next';

export type EthiopianMonthYear = { month: number; year: number };
export type EthiopianYmd = { year: number; month: number; day: number };

export const ET_MONTHS = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagumen',
] as const;

export const daysInEthiopianMonth = (year: number, month: number): number =>
  month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;

export const parseGregorianYmd = (ymd: string): { y: number; m: number; d: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
};

export const gregorianYmdToEthiopian = (ymd: string): EthiopianYmd | null => {
  const p = parseGregorianYmd(ymd);
  if (!p) return null;
  const [ey, em, ed] = toEthiopian(p.y, p.m, p.d);
  return { year: ey, month: em, day: ed };
};

export const ethiopianMonthStartYmd = (year: number, month: number): string => {
  const [gy, gm, gd] = toGregorian(year, month, 1);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
};

export const ethiopianMonthEndYmd = (year: number, month: number): string => {
  const dim = daysInEthiopianMonth(year, month);
  const [gy, gm, gd] = toGregorian(year, month, dim);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
};

export const getCurrentEthiopianMonthYear = (): EthiopianMonthYear => {
  const now = new Date();
  const [y, m] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { year: y, month: m };
};

export const ethiopianMonthCompare = (
  a: EthiopianMonthYear,
  b: EthiopianMonthYear
): number => {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
};

export const ethiopianMonthName = (month: number, t?: TFunction): string => {
  if (t) {
    const key = `calendar.ethMonth.${month}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return ET_MONTHS[month - 1] ?? `Month ${month}`;
};

export const formatEthiopianMonthYear = (
  month: number,
  year: number,
  t?: TFunction
): string => `${ethiopianMonthName(month, t)} ${year}`;

export const formatEthiopianDate = (
  year: number,
  month: number,
  day: number,
  t?: TFunction
): string => `${day} ${ethiopianMonthName(month, t)} ${year}`;

export const formatEthiopianFromYmd = (ymd: string, t?: TFunction): string => {
  const et = gregorianYmdToEthiopian(ymd);
  if (!et) return ymd;
  return formatEthiopianDate(et.year, et.month, et.day, t);
};

/** Compact label for charts: `15 Hamle`. */
export const formatEthiopianDayMonth = (ymd: string, t?: TFunction): string => {
  const et = gregorianYmdToEthiopian(ymd);
  if (!et) return ymd;
  return `${et.day} ${ethiopianMonthName(et.month, t)}`;
};

/** Primary Ethiopian date with Gregorian reference: `15 Hamle 2017 · 2025-07-23`. */
export const formatDualDateFromYmd = (ymd: string, t?: TFunction): string =>
  `${formatEthiopianFromYmd(ymd, t)} · ${ymd}`;
