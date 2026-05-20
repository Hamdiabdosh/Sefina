import type { LetterGrade } from "../../prisma/generated/prisma/enums";

export type ExamGradeRow = {
  examTypeId: string;
  name: unknown;
  numericScore: number;
  maxScore: number;
  weight: number;
  letterGrade: LetterGrade;
};

/** Weighted percent: sum of (score/max * weight) for entered exams only. */
export const computeWeightedTotalPercent = (exams: ExamGradeRow[]): number | null => {
  if (exams.length === 0) return null;
  let total = 0;
  let weightSum = 0;
  for (const e of exams) {
    total += (e.numericScore / e.maxScore) * e.weight;
    weightSum += e.weight;
  }
  if (weightSum === 0) return null;
  return Math.round((total / weightSum) * 10000) / 100;
};

export const computeOverallGpaPercent = (coursePercents: (number | null)[]): number | null => {
  const valid = coursePercents.filter((p): p is number => p !== null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
};
