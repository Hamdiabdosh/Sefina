import { toEthiopian } from 'ethiopian-date';

const MONTH_NAMES = [
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
];

export const getCurrentEthiopianMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  const [year, month] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { month, year };
};

export const formatEthiopianMonthYear = (month: number, year: number): string => {
  const name = MONTH_NAMES[month - 1] ?? `Month ${month}`;
  return `${name} ${year}`;
};

export const getTodayCalendarEt = (): string => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' });
};
