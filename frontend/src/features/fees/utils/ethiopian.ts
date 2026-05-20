export {
  ET_MONTHS,
  formatEthiopianMonthYear,
  getCurrentEthiopianMonthYear,
  type EthiopianMonthYear,
} from '../../../lib/ethiopian';

export const getTodayCalendarEt = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};
