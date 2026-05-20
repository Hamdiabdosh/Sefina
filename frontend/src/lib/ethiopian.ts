import { toEthiopian } from 'ethiopian-date';

export type EthiopianMonthYear = { month: number; year: number };

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

export const getCurrentEthiopianMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  const [y, m] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { year: y, month: m };
};

export const formatEthiopianMonthYear = (month: number, year: number): string => {
  const name = ET_MONTHS[month - 1] ?? `Month ${month}`;
  return `${name} ${year}`;
};

export const formatEthiopianDate = (year: number, month: number, day: number): string =>
  `${day} ${ET_MONTHS[month - 1] ?? month} ${year}`;
