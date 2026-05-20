import { z } from "zod";
import { localizedStringSchema } from "../m04-course/course.schema";

export const createSalaryRankSchema = z.object({
  name: localizedStringSchema,
  monthlyAmountEtb: z.coerce.number().positive().max(1_000_000),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const patchSalaryRankSchema = z.object({
  name: localizedStringSchema.optional(),
  monthlyAmountEtb: z.coerce.number().positive().max(1_000_000).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const assignTeacherRankSchema = z.object({
  salaryRankId: z.uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const recordSalaryPaymentSchema = z
  .object({
    teacherId: z.uuid(),
    month: z.coerce.number().int().min(1).max(13),
    year: z.coerce.number().int().min(1900).max(2200),
    amountPaidEtb: z.coerce.number().positive().max(1_000_000),
    bankReference: z.string().min(1).max(100),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().max(500).optional(),
    adjustmentReason: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.bankReference.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Bank reference is required",
        path: ["bankReference"],
      });
    }
  });

export const salaryPaymentListQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(13),
  year: z.coerce.number().int().min(1900).max(2200),
  status: z.enum(["ALL", "PAID", "UNPAID"]).optional(),
  rankId: z.uuid().optional(),
});

export const salaryOverviewQuerySchema = z.object({
  fromMonth: z.coerce.number().int().min(1).max(13),
  fromYear: z.coerce.number().int().min(1900).max(2200),
  toMonth: z.coerce.number().int().min(1).max(13),
  toYear: z.coerce.number().int().min(1900).max(2200),
  rankId: z.uuid().optional(),
});

export type CreateSalaryRankInput = z.infer<typeof createSalaryRankSchema>;
export type PatchSalaryRankInput = z.infer<typeof patchSalaryRankSchema>;
export type AssignTeacherRankInput = z.infer<typeof assignTeacherRankSchema>;
export type RecordSalaryPaymentInput = z.infer<typeof recordSalaryPaymentSchema>;
export type SalaryPaymentListQuery = z.infer<typeof salaryPaymentListQuerySchema>;
export type SalaryOverviewQuery = z.infer<typeof salaryOverviewQuerySchema>;
