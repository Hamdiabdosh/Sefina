import { z } from "zod";

export const createFeeStructureSchema = z.object({
  monthlyAmountEtb: z.coerce.number().positive().max(1_000_000),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const recordFeePaymentSchema = z
  .object({
    studentId: z.uuid(),
    medresaId: z.uuid(),
    month: z.coerce.number().int().min(1).max(13),
    year: z.coerce.number().int().min(1900).max(2200),
    amountPaidEtb: z.coerce.number().positive().max(1_000_000),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER"]),
    bankReference: z.string().max(100).optional(),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "BANK_TRANSFER" && !data.bankReference?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Bank reference is required for bank transfer",
        path: ["bankReference"],
      });
    }
  });

export const voidFeePaymentSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const feeCollectionQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(13),
  year: z.coerce.number().int().min(1900).max(2200),
  status: z.enum(["ALL", "PAID", "PARTIAL", "UNPAID"]).optional(),
});

export const feeOverviewQuerySchema = z.object({
  fromMonth: z.coerce.number().int().min(1).max(13),
  fromYear: z.coerce.number().int().min(1900).max(2200),
  toMonth: z.coerce.number().int().min(1).max(13),
  toYear: z.coerce.number().int().min(1900).max(2200),
});

export const networkFeeOverviewQuerySchema = feeOverviewQuerySchema.extend({
  medresaId: z.uuid().optional(),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>;
export type VoidFeePaymentInput = z.infer<typeof voidFeePaymentSchema>;
export type FeeCollectionQuery = z.infer<typeof feeCollectionQuerySchema>;
export type FeeOverviewQuery = z.infer<typeof feeOverviewQuerySchema>;
export type NetworkFeeOverviewQuery = z.infer<typeof networkFeeOverviewQuerySchema>;
