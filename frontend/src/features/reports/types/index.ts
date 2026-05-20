export type EthiopianYmd = { year: number; month: number; day: number };

export type TeacherDashboardDTO = {
  ethiopianDate: EthiopianYmd;
  totalStudents: number;
  activeCourses: number;
  todayAttendanceRatePercent: number | null;
  pendingGradeEntries: number;
  attendanceTrend: Array<{ date: string; ratePercent: number | null }>;
  gradeDistribution: Array<{
    medresaCourseId: string;
    courseName: string;
    distribution: Record<string, number>;
  }>;
  quickActions: {
    attendanceTakePath: string;
    gradeEntryPath: string;
    studentsPath: string;
  };
};

export type MedresaDashboardDTO = {
  medresaId: string;
  ethiopianDate: EthiopianYmd;
  totalStudents: number;
  activeCourses: number;
  todayAttendanceRatePercent: number | null;
  feesCollectedEtb: number;
  outstandingFeesEtb: number;
  feeTrend: Array<{ month: number; year: number; collectedEtb: number; outstandingEtb: number }>;
  enrollmentTrend: Array<{ month: number; year: number; count: number }>;
  courseStats: Array<{
    medresaCourseId: string;
    courseName: string;
    studentCount: number;
    todayAttendanceRatePercent: number | null;
    averageGradePercent: number | null;
  }>;
  quickActions: {
    recordPaymentPath: string;
    unpaidStudentsPath: string;
    reportsPath: string;
  };
};

export type SuperAdminDashboardDTO = {
  ethiopianDate: EthiopianYmd;
  activeMedresas: number;
  inactiveMedresas: number;
  totalTeachers: number;
  totalStudents: number;
  networkFeesCollectedEtb: number;
  networkOutstandingEtb: number;
  salaryDisbursedThisMonthEtb: number;
  unpaidTeachersThisMonth: number;
  enrollmentPerMedresa: Array<{ medresaId: string; medresaName: string; studentCount: number }>;
  feeTrend: Array<{ month: number; year: number; collectedEtb: number }>;
  salaryTrend: Array<{ month: number; year: number; disbursedEtb: number }>;
  attendancePerMedresa: Array<{
    medresaId: string;
    medresaName: string;
    todayAttendanceRatePercent: number | null;
  }>;
  gradePerMedresa: Array<{
    medresaId: string;
    medresaName: string;
    averageGradePercent: number | null;
  }>;
  quickActions: {
    unpaidTeachersPath: string;
    feeDefaultersPath: string;
    reportsPath: string;
  };
};

export type ReportRangeParams = {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
  medresaId?: string;
  medresaCourseId?: string;
  studentId?: string;
  status?: string;
  feeStatus?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
};
