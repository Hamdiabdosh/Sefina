import { describe, expect, it } from 'vitest';
import {
  daysInEthiopianMonth,
  ethiopianMonthCompare,
  isFuturePaymentDate,
  iterateEthiopianMonths,
  parsePaymentDateYmd,
  toEthiopian,
} from '../ethiopian-calendar';

describe('toEthiopian', () => {
  // Cross-checked against this module via ts-node (same algorithm as Bahire Hasab-style tables).
  it('converts 2024-01-01 to Tahsas 22, 2016 EC', () => {
    expect(toEthiopian(2024, 1, 1)).toEqual({ year: 2016, month: 4, day: 22 });
  });

  // Ethiopian New Year 2016 EC: this converter maps 2023-09-12 (not 09-11) to Meskerem 1.
  it('converts 2023-09-12 to Meskerem 1, 2016 EC (New Year)', () => {
    expect(toEthiopian(2023, 9, 12)).toEqual({ year: 2016, month: 1, day: 1 });
  });

  it('converts 2024-09-11 to Meskerem 1, 2017 EC (New Year)', () => {
    expect(toEthiopian(2024, 9, 11)).toEqual({ year: 2017, month: 1, day: 1 });
  });

  // Pagumen (month 13): 2023-09-06 is the first day of Pagumen 2015 EC in this algorithm.
  it('converts 2023-09-06 to Pagumen 1, 2015 EC', () => {
    expect(toEthiopian(2023, 9, 6)).toEqual({ year: 2015, month: 13, day: 1 });
  });
});

describe('daysInEthiopianMonth', () => {
  it('returns 30 for a regular month (1–12)', () => {
    expect(daysInEthiopianMonth(2016, 4)).toBe(30);
  });

  it('returns 5 for month 13 in a non-leap Ethiopian year (2016 % 4 !== 3)', () => {
    expect(daysInEthiopianMonth(2016, 13)).toBe(5);
  });

  it('returns 6 for month 13 in an Ethiopian leap year (2015 % 4 === 3)', () => {
    expect(daysInEthiopianMonth(2015, 13)).toBe(6);
  });

  it('returns 30 for months 1 through 12 for any year', () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(daysInEthiopianMonth(2015, month)).toBe(30);
      expect(daysInEthiopianMonth(2016, month)).toBe(30);
    }
  });
});

describe('ethiopianMonthCompare', () => {
  it('returns 0 for same month and year', () => {
    expect(ethiopianMonthCompare({ year: 2016, month: 5 }, { year: 2016, month: 5 })).toBe(0);
  });

  it('returns negative when first year is earlier', () => {
    expect(ethiopianMonthCompare({ year: 2015, month: 1 }, { year: 2016, month: 1 })).toBeLessThan(0);
  });

  it('returns positive when first year is later', () => {
    expect(ethiopianMonthCompare({ year: 2017, month: 1 }, { year: 2016, month: 1 })).toBeGreaterThan(0);
  });

  it('returns negative for same year when first month is earlier', () => {
    expect(ethiopianMonthCompare({ year: 2016, month: 3 }, { year: 2016, month: 8 })).toBeLessThan(0);
  });

  it('returns positive for same year when first month is later', () => {
    expect(ethiopianMonthCompare({ year: 2016, month: 10 }, { year: 2016, month: 2 })).toBeGreaterThan(0);
  });
});

describe('iterateEthiopianMonths', () => {
  it('yields nothing when start is after end', () => {
    const items = [
      ...iterateEthiopianMonths({ year: 2017, month: 5 }, { year: 2016, month: 1 }),
    ];
    expect(items).toEqual([]);
  });

  it('yields exactly one item when start equals end', () => {
    const items = [
      ...iterateEthiopianMonths({ year: 2016, month: 7 }, { year: 2016, month: 7 }),
    ];
    expect(items).toEqual([{ year: 2016, month: 7 }]);
  });

  it('yields months 12–2 across an Ethiopian year boundary including Pagumen', () => {
    const items = [
      ...iterateEthiopianMonths({ year: 2016, month: 12 }, { year: 2017, month: 2 }),
    ];
    expect(items).toEqual([
      { year: 2016, month: 12 },
      { year: 2016, month: 13 },
      { year: 2017, month: 1 },
      { year: 2017, month: 2 },
    ]);
  });

  it('yields 13 items from month 1 through month 13 of the same year', () => {
    const items = [
      ...iterateEthiopianMonths({ year: 2016, month: 1 }, { year: 2016, month: 13 }),
    ];
    expect(items).toHaveLength(13);
  });
});

describe('parsePaymentDateYmd', () => {
  it('parses valid YYYY-MM-DD as UTC noon on that civil day', () => {
    const dt = parsePaymentDateYmd('2024-01-15');
    expect(dt).not.toBeNull();
    expect(dt!.getUTCFullYear()).toBe(2024);
    expect(dt!.getUTCMonth()).toBe(0);
    expect(dt!.getUTCDate()).toBe(15);
  });

  it('returns null for slash-separated format', () => {
    expect(parsePaymentDateYmd('2024/01/15')).toBeNull();
  });

  it('returns null for impossible calendar day', () => {
    expect(parsePaymentDateYmd('2024-02-30')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parsePaymentDateYmd('abcd-ef-gh')).toBeNull();
  });
});

describe('isFuturePaymentDate', () => {
  const ref = parsePaymentDateYmd('2024-06-15')!;

  it('returns false when payment date is the same Ethiopia civil day as ref', () => {
    const payment = parsePaymentDateYmd('2024-06-15')!;
    expect(isFuturePaymentDate(payment, ref)).toBe(false);
  });

  it('returns true when payment date is one day after ref', () => {
    const payment = parsePaymentDateYmd('2024-06-16')!;
    expect(isFuturePaymentDate(payment, ref)).toBe(true);
  });

  it('returns false when payment date is one day before ref', () => {
    const payment = parsePaymentDateYmd('2024-06-14')!;
    expect(isFuturePaymentDate(payment, ref)).toBe(false);
  });
});
