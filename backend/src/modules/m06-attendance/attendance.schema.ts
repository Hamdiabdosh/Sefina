import { z } from "zod";
import { parseCalendarYmd } from "../../lib/ethiopia-time";

const attendanceStatusZ = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export const createAttendanceSessionSchema = z
  .object({
    medresaId: z.uuid(),
    date: z.string().min(10).max(10),
    records: z.array(
      z.object({
        studentId: z.uuid(),
        status: attendanceStatusZ.optional(),
        note: z.string().max(500).optional(),
      })
    ),
  })
  .superRefine((d, ctx) => {
    if (!parseCalendarYmd(d.date)) {
      ctx.addIssue({ code: "custom", message: "INVALID_DATE", path: ["date"] });
    }
  });

export const patchAttendanceSessionSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.uuid(),
        status: attendanceStatusZ.optional(),
        note: z.string().max(500).nullable().optional(),
      })
    )
    .min(1),
});

export const listAttendanceSessionsQuerySchema = z
  .object({
    medresaId: z.uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.from && !parseCalendarYmd(q.from)) {
      ctx.addIssue({ code: "custom", message: "INVALID_FROM_DATE", path: ["from"] });
    }
    if (q.to && !parseCalendarYmd(q.to)) {
      ctx.addIssue({ code: "custom", message: "INVALID_TO_DATE", path: ["to"] });
    }
  });

export const attendanceRosterQuerySchema = z.object({
  medresaId: z.uuid(),
});

export const medresaAttendanceOverviewQuerySchema = z
  .object({
    date: z.string().min(10).max(10),
  })
  .superRefine((q, ctx) => {
    if (!parseCalendarYmd(q.date)) {
      ctx.addIssue({ code: "custom", message: "INVALID_DATE", path: ["date"] });
    }
  });

export const networkAttendanceOverviewQuerySchema = z
  .object({
    from: z.string().min(10).max(10),
    to: z.string().min(10).max(10),
    medresaId: z.uuid().optional(),
  })
  .superRefine((q, ctx) => {
    if (!parseCalendarYmd(q.from)) {
      ctx.addIssue({ code: "custom", message: "INVALID_FROM_DATE", path: ["from"] });
    }
    if (!parseCalendarYmd(q.to)) {
      ctx.addIssue({ code: "custom", message: "INVALID_TO_DATE", path: ["to"] });
    }
  });

export type CreateAttendanceSessionInput = z.infer<typeof createAttendanceSessionSchema>;
export type PatchAttendanceSessionInput = z.infer<typeof patchAttendanceSessionSchema>;
export type ListAttendanceSessionsQuery = z.infer<typeof listAttendanceSessionsQuerySchema>;
export type MedresaAttendanceOverviewQuery = z.infer<typeof medresaAttendanceOverviewQuerySchema>;
export type NetworkAttendanceOverviewQuery = z.infer<typeof networkAttendanceOverviewQuerySchema>;
