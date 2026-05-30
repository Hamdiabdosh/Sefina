export const etbToCents = (etb: number): number => Math.round(etb * 100);

export const centsToEtb = (cents: number): number => Math.round(cents) / 100;

export type SalaryRankDto = {
  id: string;
  name: Record<string, string>;
  monthlyAmountEtb: number;
  effectiveFrom: string;
  status: string;
  teacherCount?: number;
  createdAt: string;
};

export const mapSalaryRank = (row: {
  id: string;
  name: unknown;
  monthly_amount: number;
  effective_from: Date;
  status: string;
  created_at: Date;
}): SalaryRankDto => ({
  id: row.id,
  name: row.name as Record<string, string>,
  monthlyAmountEtb: centsToEtb(row.monthly_amount),
  effectiveFrom: row.effective_from.toISOString().slice(0, 10),
  status: row.status,
  createdAt: row.created_at.toISOString(),
});

export type SalaryPaymentDto = {
  id: string;
  teacherId: string;
  salaryRankId: string | null;
  month: number;
  year: number;
  amountPaidEtb: number;
  bankReference: string;
  paymentDate: string;
  note: string | null;
  isAdjusted: boolean;
  adjustmentReason: string | null;
  recordedAt: string;
};

export const mapSalaryPayment = (row: {
  id: string;
  teacher_id: string;
  salary_rank_id: string | null;
  month: number;
  year: number;
  amount_paid: number;
  bank_reference: string;
  payment_date: Date;
  note: string | null;
  is_adjusted: boolean;
  adjustment_reason: string | null;
  created_at: Date;
}): SalaryPaymentDto => ({
  id: row.id,
  teacherId: row.teacher_id,
  salaryRankId: row.salary_rank_id,
  month: row.month,
  year: row.year,
  amountPaidEtb: centsToEtb(row.amount_paid),
  bankReference: row.bank_reference,
  paymentDate: row.payment_date.toISOString().slice(0, 10),
  note: row.note,
  isAdjusted: row.is_adjusted,
  adjustmentReason: row.adjustment_reason,
  recordedAt: row.created_at.toISOString(),
});

export type SalaryPaymentListStatus = "PAID" | "UNPAID";

export type SalaryBreakdownDto = "TEACHER_MULTI" | "ADMIN_ONLY" | "TEACHER_ADMIN_COMBINED";

export type SalaryPaymentListRowDto = {
  teacherId: string;
  fullName: string;
  photoUrl: string | null;
  salaryRankId: string | null;
  rankName: Record<string, string> | null;
  monthlyAmountEtb: number | null;
  month: number;
  year: number;
  status: SalaryPaymentListStatus;
  paymentId: string | null;
  amountPaidEtb: number | null;
  breakdown: SalaryBreakdownDto | null;
  medresaCount: number;
  cbeAccount: string | null;
};
