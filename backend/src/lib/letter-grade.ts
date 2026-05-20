import { LetterGrade } from "../../prisma/generated/prisma/enums";

/** BR-03: 90–100 A, 80–89 B, 70–79 C, 60–69 D, 0–59 F */
export const scoreToLetterGrade = (numericScore: number): LetterGrade => {
  if (numericScore >= 90) return LetterGrade.A;
  if (numericScore >= 80) return LetterGrade.B;
  if (numericScore >= 70) return LetterGrade.C;
  if (numericScore >= 60) return LetterGrade.D;
  return LetterGrade.F;
};
