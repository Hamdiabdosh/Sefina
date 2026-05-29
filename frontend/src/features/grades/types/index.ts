import type { LocalizedString } from '../../teachers/utils/localizedJson';

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type ExamTypeDTO = {
  id: string;
  name: LocalizedString;
  maxScore: number;
  weight: number;
  status: 'ACTIVE' | 'INACTIVE';
};

export type GradeDTO = {
  id: string;
  studentId: string;
  medresaCourseId: string;
  examTypeId: string;
  teacherId: string;
  numericScore: number;
  letterGrade: LetterGrade;
  submittedAt: string;
};

export type GradeRosterItem = {
  studentId: string;
  fullName: string;
  grade: GradeDTO | null;
};

export type GradeEditRequestDTO = {
  id: string;
  gradeId: string;
  requestedBy: string;
  currentScore: number;
  requestedScore: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  studentName?: string;
  courseName?: LocalizedString;
  medresaId?: string;
  examTypeName?: LocalizedString;
  teacherName?: string;
  createdAt?: string;
  rejectionReason?: string | null;
};

export type TeacherCourseOption = {
  medresaCourseId: string;
  medresaId: string;
  medresaName: string;
  courseName: string;
};

export type StudentResultsDTO = {
  studentId: string;
  fullName: string;
  courses: Array<{
    medresaCourseId: string;
    courseName: string;
    exams: Array<{
      examTypeId: string;
      name: unknown;
      score: number;
      maxScore: number;
      weight: number;
      letterGrade: LetterGrade;
    }>;
    weightedTotalPercent: number | null;
  }>;
  overallGpaPercent: number | null;
};
