import { describe, expect, it } from 'vitest';
import { LetterGrade } from '../../../prisma/generated/prisma/enums';
import { scoreToLetterGrade } from '../letter-grade';

describe('scoreToLetterGrade', () => {
  it('maps 100 to A', () => {
    expect(scoreToLetterGrade(100)).toBe(LetterGrade.A);
  });

  it('maps 90 to A', () => {
    expect(scoreToLetterGrade(90)).toBe(LetterGrade.A);
  });

  it('maps 89 to B', () => {
    expect(scoreToLetterGrade(89)).toBe(LetterGrade.B);
  });

  it('maps 80 to B', () => {
    expect(scoreToLetterGrade(80)).toBe(LetterGrade.B);
  });

  it('maps 79 to C', () => {
    expect(scoreToLetterGrade(79)).toBe(LetterGrade.C);
  });

  it('maps 70 to C', () => {
    expect(scoreToLetterGrade(70)).toBe(LetterGrade.C);
  });

  it('maps 69 to D', () => {
    expect(scoreToLetterGrade(69)).toBe(LetterGrade.D);
  });

  it('maps 60 to D', () => {
    expect(scoreToLetterGrade(60)).toBe(LetterGrade.D);
  });

  it('maps 59 to F', () => {
    expect(scoreToLetterGrade(59)).toBe(LetterGrade.F);
  });

  it('maps 0 to F', () => {
    expect(scoreToLetterGrade(0)).toBe(LetterGrade.F);
  });

  it('maps 91 to A (just above B threshold)', () => {
    expect(scoreToLetterGrade(91)).toBe(LetterGrade.A);
  });

  it('maps 81 to B (just above C threshold)', () => {
    expect(scoreToLetterGrade(81)).toBe(LetterGrade.B);
  });

  it('maps 71 to C (just above D threshold)', () => {
    expect(scoreToLetterGrade(71)).toBe(LetterGrade.C);
  });

  it('maps 61 to D (just above F threshold)', () => {
    expect(scoreToLetterGrade(61)).toBe(LetterGrade.D);
  });

  it('maps 58 to F (just below D threshold)', () => {
    expect(scoreToLetterGrade(58)).toBe(LetterGrade.F);
  });

  it('maps negative score to F', () => {
    expect(scoreToLetterGrade(-1)).toBe(LetterGrade.F);
  });

  it('maps score above 100 to A', () => {
    expect(scoreToLetterGrade(101)).toBe(LetterGrade.A);
  });
});
