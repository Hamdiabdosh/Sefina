export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type AttendanceRecordDTO = {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  note: string | null;
  editedAt: string | null;
};

export type AttendanceSessionDTO = {
  id: string;
  medresaId: string;
  date: string;
  submittedAt: string | null;
  teacherMarkedAt: string | null;
  adminMarkedAt: string | null;
  isLocked: boolean;
  records: AttendanceRecordDTO[];
};

export type SessionListItemDTO = {
  id: string;
  medresaId: string;
  date: string;
  submittedAt: string | null;
  teacherMarkedAt: string | null;
  adminMarkedAt: string | null;
  isLocked: boolean;
  counts: Record<AttendanceStatus, number>;
  totalStudents: number;
};

export type StudentAttendanceEntryDTO = {
  date: string;
  medresaId: string;
  medresaName: string;
  status: AttendanceStatus;
  note: string | null;
};

export type StudentAttendanceSummaryDTO = {
  studentId: string;
  totalSessions: number;
  countedAsPresent: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRatePct: number;
  entries: StudentAttendanceEntryDTO[];
};
