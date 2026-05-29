import { describe, expect, it } from 'vitest';
import { centsToEtb, etbToCents } from '../fee.mapper';

describe('etbToCents', () => {
  it('converts 0 ETB to 0 cents', () => {
    expect(etbToCents(0)).toBe(0);
  });

  it('converts 1 ETB to 100 cents', () => {
    expect(etbToCents(1)).toBe(100);
  });

  it('converts 100 ETB to 10000 cents', () => {
    expect(etbToCents(100)).toBe(10000);
  });

  it('converts 0.5 ETB to 50 cents', () => {
    expect(etbToCents(0.5)).toBe(50);
  });

  it('rounds 1.005 ETB per Math.round(1.005 * 100) in Node', () => {
    expect(etbToCents(1.005)).toBe(Math.round(1.005 * 100));
    expect(etbToCents(1.005)).toBe(100);
  });

  it('converts 999.99 ETB to 99999 cents', () => {
    expect(etbToCents(999.99)).toBe(99999);
  });
});

describe('centsToEtb', () => {
  it('converts 0 cents to 0 ETB', () => {
    expect(centsToEtb(0)).toBe(0);
  });

  it('converts 100 cents to 1 ETB', () => {
    expect(centsToEtb(100)).toBe(1);
  });

  it('converts 10000 cents to 100 ETB', () => {
    expect(centsToEtb(10000)).toBe(100);
  });

  it('converts 50 cents to 0.5 ETB', () => {
    expect(centsToEtb(50)).toBe(0.5);
  });

  it('converts 99999 cents to 999.99 ETB', () => {
    expect(centsToEtb(99999)).toBe(999.99);
  });

  it('rounds non-integer cents per Math.round(cents) / 100', () => {
    expect(centsToEtb(100.7)).toBe(Math.round(100.7) / 100);
    expect(centsToEtb(100.7)).toBe(1.01);
  });
});

describe('etbToCents / centsToEtb round-trip', () => {
  const wholeCentAmounts = [0, 0.5, 1, 50, 100, 999.99] as const;

  for (const amount of wholeCentAmounts) {
    it(`round-trips ${amount} ETB`, () => {
      expect(centsToEtb(etbToCents(amount))).toBe(amount);
    });
  }
});
