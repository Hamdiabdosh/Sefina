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
  medresaCourseId: string;
  medresaId: string;
  date: string;
  submittedAt: string | null;
  isLocked: boolean;
  records: AttendanceRecordDTO[];
};

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
