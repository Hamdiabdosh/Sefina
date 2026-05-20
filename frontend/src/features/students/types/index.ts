export type StudentStatus = 'ACTIVE' | 'TRANSFERRED';
export type Gender = 'MALE' | 'FEMALE';

export type EnrolledCourseSummary = {
  studentCourseId: string;
  medresaCourseId: string;
  courseName: string | Record<string, string>;
};

export type StudentListItem = {
  id: string;
  fullName: string;
  gender: Gender;
  guardianPhone: string;
  guardianName: string;
  photoUrl: string | null;
  status: StudentStatus;
  enrolledAt: string;
  enrolledCourses: EnrolledCourseSummary[];
};

export type StudentCourseDetail = {
  studentCourseId: string;
  medresaCourseId: string;
  courseName: string | Record<string, string>;
  enrolledAt: string;
};

export type StudentTransferHistory = {
  id: string;
  fromMedresaId: string;
  toMedresaId: string;
  fromMedresaName: string | null;
  toMedresaName: string | null;
  transferDate: string;
  reason: string | null;
  createdAt: string;
};

export type StudentDetail = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  guardianName: string;
  guardianPhone: string;
  photoUrl: string | null;
  status: StudentStatus;
  enrolledAt: string;
  currentMedresaId: string;
  currentMedresaName: string;
  courses: StudentCourseDetail[];
  transferHistory: StudentTransferHistory[];
  gradesSummary?: { overallGpaPercent: number | null; courseCount: number } | null;
  feeStatus?: {
    status: string;
    outstandingBalanceEtb: number;
    month: number;
    year: number;
  } | null;
};

export type StudentsListResponse = {
  items: StudentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TransferDestination = {
  id: string;
  name: string;
};

export type TeacherStudentListItem = {
  id: string;
  fullName: string;
  gender: Gender;
  photoUrl: string | null;
  enrolledCourses: Array<{
    medresaCourseId: string;
    courseName: string | Record<string, string>;
  }>;
};
