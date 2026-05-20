import type { PaymentMethod } from "../../../prisma/generated/prisma/enums";

export const etbToCents = (etb: number): number => Math.round(etb * 100);

export const centsToEtb = (cents: number): number => Math.round(cents) / 100;

export type FeeStructureDto = {
  id: string;
  monthlyAmountEtb: number;
  effectiveFrom: string;
  status: string;
  createdAt: string;
};

export const mapFeeStructure = (row: {
  id: string;
  monthly_amount: number;
  effective_from: Date;
  status: string;
  created_at: Date;
}): FeeStructureDto => ({
  id: row.id,
  monthlyAmountEtb: centsToEtb(row.monthly_amount),
  effectiveFrom: row.effective_from.toISOString().slice(0, 10),
  status: row.status,
  createdAt: row.created_at.toISOString(),
});

export type FeePaymentDto = {
  id: string;
  studentId: string;
  medresaId: string;
  month: number;
  year: number;
  amountDueEtb: number;
  amountPaidEtb: number;
  paymentMethod: PaymentMethod;
  bankReference: string | null;
  paymentDate: string;
  note: string | null;
  recordedAt: string;
};

export const mapFeePayment = (row: {
  id: string;
  student_id: string;
  medresa_id: string;
  month: number;
  year: number;
  amount_due: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  bank_reference: string | null;
  payment_date: Date;
  note: string | null;
  created_at: Date;
}): FeePaymentDto => ({
  id: row.id,
  studentId: row.student_id,
  medresaId: row.medresa_id,
  month: row.month,
  year: row.year,
  amountDueEtb: centsToEtb(row.amount_due),
  amountPaidEtb: centsToEtb(row.amount_paid),
  paymentMethod: row.payment_method,
  bankReference: row.bank_reference,
  paymentDate: row.payment_date.toISOString().slice(0, 10),
  note: row.note,
  recordedAt: row.created_at.toISOString(),
});

export type FeeCollectionStatus = "PAID" | "PARTIAL" | "UNPAID";

export type FeeCollectionRowDto = {
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  month: number;
  year: number;
  amountDueEtb: number;
  amountPaidEtb: number;
  balanceEtb: number;
  status: FeeCollectionStatus;
};
