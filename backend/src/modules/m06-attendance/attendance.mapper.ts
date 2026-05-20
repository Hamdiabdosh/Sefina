import { AttendanceStatus } from "../../../prisma/generated/prisma/enums";
import type { AttendanceRecord } from "../../../prisma/generated/prisma/client";

export type SessionListItemDTO = {
  id: string;
  medresaCourseId: string;
  medresaId: string;
  date: string;
  submittedAt: string | null;
  isLocked: boolean;
  counts: Record<AttendanceStatus, number>;
  totalStudents: number;
};

export const countStatuses = (
  statuses: readonly AttendanceStatus[]
): Record<AttendanceStatus, number> => ({
  [AttendanceStatus.PRESENT]: statuses.filter((s) => s === AttendanceStatus.PRESENT).length,
  [AttendanceStatus.ABSENT]: statuses.filter((s) => s === AttendanceStatus.ABSENT).length,
  [AttendanceStatus.LATE]: statuses.filter((s) => s === AttendanceStatus.LATE).length,
  [AttendanceStatus.EXCUSED]: statuses.filter((s) => s === AttendanceStatus.EXCUSED).length,
});

export type AttendanceRecordDTO = {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  note: string | null;
  editedAt: string | null;
};

export type AttendanceSessionDetailDTO = {
  id: string;
  medresaCourseId: string;
  medresaId: string;
  date: string;
  submittedAt: string | null;
  isLocked: boolean;
  records: AttendanceRecordDTO[];
};

export const mapRecord = (
  row: Pick<AttendanceRecord, "id" | "student_id" | "status" | "note" | "edited_at">
): AttendanceRecordDTO => ({
  id: row.id,
  studentId: row.student_id,
  status: row.status,
  note: row.note,
  editedAt: row.edited_at ? row.edited_at.toISOString() : null,
});

export type StudentAttendanceSummaryDTO = {
  studentId: string;
  totalSessions: number;
  countedAsPresent: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRatePct: number;
  entries: {
    date: string;
    medresaCourseId: string;
    courseNameEn: string;
    status: AttendanceStatus;
    note: string | null;
  }[];
};
