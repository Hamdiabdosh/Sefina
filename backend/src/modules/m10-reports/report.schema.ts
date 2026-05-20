import { z } from "zod";

const ethMonth = z.coerce.number().int().min(1).max(13);
const ethYear = z.coerce.number().int().min(1900).max(2200);

export const medresaDashboardQuerySchema = z.object({
  medresaId: z.string().uuid().optional(),
});

export type MedresaDashboardQuery = z.infer<typeof medresaDashboardQuerySchema>;

export const ethMonthYearQuerySchema = z.object({
  month: ethMonth.optional(),
  year: ethYear.optional(),
});

export const reportRangeQuerySchema = z
  .object({
    fromMonth: ethMonth,
    fromYear: ethYear,
    toMonth: ethMonth,
    toYear: ethYear,
    medresaId: z.string().uuid().optional(),
    medresaCourseId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    status: z.enum(["ACTIVE", "TRANSFERRED", "ALL"]).optional(),
    feeStatus: z.enum(["PAID", "PARTIAL", "UNPAID", "ALL"]).optional(),
    paymentStatus: z.enum(["PAID", "UNPAID", "ALL"]).optional(),
    rankId: z.string().uuid().optional(),
    examTypeId: z.string().uuid().optional(),
  })
  .refine(
    (q) =>
      ethiopianMonthCompare(
        { month: q.fromMonth, year: q.fromYear },
        { month: q.toMonth, year: q.toYear }
      ) <= 0,
    { message: "Invalid Ethiopian month range" }
  );

export type ReportRangeQuery = z.infer<typeof reportRangeQuerySchema>;

export const enrollmentReportQuerySchema = reportRangeQuerySchema;

export const attendanceReportQuerySchema = reportRangeQuerySchema.extend({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const feesReportQuerySchema = reportRangeQuerySchema;

export const salaryReportQuerySchema = reportRangeQuerySchema;

export const gradesReportQuerySchema = reportRangeQuerySchema;

function ethiopianMonthCompare(
  a: { month: number; year: number },
  b: { month: number; year: number }
): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}
