import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MarketingPage } from './features/marketing/pages/MarketingPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';
import { MedresasPage } from './features/medresas/pages/MedresasPage';
import { MedresaDetailPage } from './features/medresas/pages/MedresaDetailPage';
import { TeachersPage } from './features/teachers/pages/TeachersPage';
import { TeacherDetailPage } from './features/teachers/pages/TeacherDetailPage';
import { CoursesPage } from './features/courses/pages/CoursesPage';
import { MedresaCoursesPage } from './features/courses/pages/MedresaCoursesPage';
import { MedresaCourseDetailPage } from './features/courses/pages/MedresaCourseDetailPage';
import { MedresaStudentsPage } from './features/students/pages/MedresaStudentsPage';
import { StudentDetailPage } from './features/students/pages/StudentDetailPage';
import { TeacherStudentsPage } from './features/students/pages/TeacherStudentsPage';
import { MedresaDashboardPage } from './pages/MedresaDashboardPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { PendingAccessPage } from './features/auth/pages/PendingAccessPage';
import { TeacherAttendanceHubPage } from './features/attendance/pages/TeacherAttendanceHubPage';
import { DailyAttendanceTakePage } from './features/attendance/pages/DailyAttendanceTakePage';
import { MedresaAttendanceOverviewPage } from './features/attendance/pages/MedresaAttendanceOverviewPage';
import { AdminAttendanceNetworkPage } from './features/attendance/pages/AdminAttendanceNetworkPage';
import { ExamTypesPage } from './features/grades/pages/ExamTypesPage';
import { GradeEditApprovalPage } from './features/grades/pages/GradeEditApprovalPage';
import { GradeEntryPage } from './features/grades/pages/GradeEntryPage';
import { GradeEditRequestPage } from './features/grades/pages/GradeEditRequestPage';
import { ClassResultsPage } from './features/grades/pages/ClassResultsPage';
import { isStudentHubTab } from './features/students/types/studentHub';
import { MedresaResultsOverviewPage } from './features/grades/pages/MedresaResultsOverviewPage';
import { NetworkResultsOverviewPage } from './features/grades/pages/NetworkResultsOverviewPage';
import { TeacherGradesHubPage } from './features/grades/pages/TeacherGradesHubPage';
import { FeeStructurePage } from './features/fees/pages/FeeStructurePage';
import { FeeCollectionPage } from './features/fees/pages/FeeCollectionPage';
import { RecordPaymentPage } from './features/fees/pages/RecordPaymentPage';
import { NetworkFeesOverviewPage } from './features/fees/pages/NetworkFeesOverviewPage';
import { SalaryRanksPage } from './features/salaries/pages/SalaryRanksPage';
import { SalaryPaymentListPage } from './features/salaries/pages/SalaryPaymentListPage';
import { RecordSalaryPaymentPage } from './features/salaries/pages/RecordSalaryPaymentPage';
import { TeacherSalaryHistoryPage } from './features/salaries/pages/TeacherSalaryHistoryPage';
import { NetworkSalariesOverviewPage } from './features/salaries/pages/NetworkSalariesOverviewPage';
import { SuperAdminDashboardPage } from './features/reports/pages/SuperAdminDashboardPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import type { CurrentUser } from './features/auth/types/auth.types';
import { enrichCurrentUser, getHomeRouteForUser } from './features/auth/utils/roleRedirect';

export type RouterContext = {
  queryClient: QueryClient;
};

const getCurrentUser = (queryClient: QueryClient): CurrentUser | null => {
  const cached = queryClient.getQueryData<CurrentUser | null>(['currentUser']) ?? null;
  if (!cached) return null;
  return cached.hasAppAccess !== undefined ? cached : enrichCurrentUser(cached);
};

const requireAuth = (queryClient: QueryClient) => {
  const user = getCurrentUser(queryClient);
  if (!user) {
    throw redirect({ to: '/login' });
  }
  return user;
};

/** BR-11: teachers without admin role cannot access fee screens. */
const requireFeeAccess = (user: CurrentUser) => {
  if (user.isTeacher && !user.isMedresaAdmin && !user.isSuperAdmin) {
    throw redirect({ to: getHomeRouteForUser(user) });
  }
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    const user = getCurrentUser(context.queryClient);
    if (user) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: MarketingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: ({ context }) => {
    const user = getCurrentUser(context.queryClient);
    if (user) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: LoginPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  component: ResetPasswordPage,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: ({ context }) => {
    requireAuth(context.queryClient);
  },
  component: AppShell,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/dashboard',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: SuperAdminDashboardPage,
});

const adminReportsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/reports',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: () => <ReportsPage variant="admin" />,
});

const medresaReportsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/reports',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: () => <ReportsPage variant="medresa" />,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const teacherReportsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/reports',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: () => <ReportsPage variant="teacher" />,
});

const adminMedresasRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/medresas',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: MedresasPage,
});

const adminMedresaDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/medresas/$medresaId',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: MedresaDetailPage,
});

const adminTeachersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/teachers',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: TeachersPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const adminTeacherDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/teachers/$teacherId',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: TeacherDetailPage,
});

const pendingAccessRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/account/pending',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (user.hasAppAccess) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: PendingAccessPage,
});

const medresaDashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/dashboard',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: MedresaDashboardPage,
});

const medresaAttendanceRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/attendance',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: MedresaAttendanceOverviewPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
    date: (search.date as string) || undefined,
  }),
});

const adminCoursesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/courses',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: CoursesPage,
});

const adminAttendanceNetworkRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/attendance',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: AdminAttendanceNetworkPage,
});

const medresaCoursesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/courses',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: MedresaCoursesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const medresaCourseDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/courses/$medresaCourseId',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: MedresaCourseDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const medresaStudentsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/students',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: MedresaStudentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
    medresaCourseId: (search.medresaCourseId as string) || undefined,
  }),
});

const medresaStudentDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/students/$studentId',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: StudentDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
    tab: isStudentHubTab(search.tab as string | undefined) ? search.tab : undefined,
  }),
});

const teacherStudentsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/students',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: TeacherStudentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const teacherDashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/dashboard',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: TeacherDashboardPage,
});

const teacherAttendanceHubRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/attendance',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: TeacherAttendanceHubPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const teacherAttendanceTakeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/attendance/take',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: () => <DailyAttendanceTakePage variant="teacher" />,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const teacherGradesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/grades',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: TeacherGradesHubPage,
});

const teacherGradeEntryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/grades/entry',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: GradeEntryPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaCourseId: (search.medresaCourseId as string) || undefined,
    examTypeId: (search.examTypeId as string) || undefined,
  }),
});

const teacherGradeEditRequestRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/grades/edit-request',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: GradeEditRequestPage,
  validateSearch: (search: Record<string, unknown>) => ({
    gradeId: (search.gradeId as string) || undefined,
    currentScore: (search.currentScore as string) || undefined,
    studentName: (search.studentName as string) || undefined,
    examTypeName: (search.examTypeName as string) || undefined,
    medresaCourseId: (search.medresaCourseId as string) || undefined,
    examTypeId: (search.examTypeId as string) || undefined,
  }),
});

const teacherStudentResultsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/students/$studentId/results',
  beforeLoad: ({ context, params }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
    throw redirect({
      to: '/medresa/students/$studentId',
      params: { studentId: params.studentId },
      search: { medresaId: undefined, tab: 'grades' },
    });
  },
});

const medresaStudentResultsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/students/$studentId/results',
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
  beforeLoad: ({ context, params, search }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
    throw redirect({
      to: '/medresa/students/$studentId',
      params: { studentId: params.studentId },
      search: {
        medresaId: search.medresaId,
        tab: 'grades',
      },
    });
  },
});

const classResultsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/courses/results',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (
      !user.isTeacher &&
      !user.isMedresaAdmin &&
      !user.isSuperAdmin
    ) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: ClassResultsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaCourseId: (search.medresaCourseId as string) || undefined,
  }),
});

const adminExamTypesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/exam-types',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: ExamTypesPage,
});

const adminGradeEditsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/grade-edits',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: () => <GradeEditApprovalPage variant="admin" />,
});

const medresaGradeEditsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/grade-edits',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: () => <GradeEditApprovalPage variant="medresa" />,
});

const medresaResultsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/results',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: MedresaResultsOverviewPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const adminResultsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/results',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: NetworkResultsOverviewPage,
});

const adminFeeStructureRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/fee-structure',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: FeeStructurePage,
});

const adminFeesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/fees',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: NetworkFeesOverviewPage,
});

const adminSalaryRanksRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/salary-ranks',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: SalaryRanksPage,
});

const adminSalariesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/salaries',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: SalaryPaymentListPage,
});

const adminSalariesOverviewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/salaries/overview',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: NetworkSalariesOverviewPage,
});

const adminRecordSalaryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/salaries/record',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: RecordSalaryPaymentPage,
  validateSearch: (search: Record<string, unknown>) => ({
    teacherId: (search.teacherId as string) || undefined,
    teacherName: (search.teacherName as string) || undefined,
    month: search.month !== undefined ? Number(search.month) : undefined,
    year: search.year !== undefined ? Number(search.year) : undefined,
    amountEtb: search.amountEtb !== undefined ? Number(search.amountEtb) : undefined,
  }),
});

const adminTeacherSalaryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/admin/teachers/$teacherId/salary',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isSuperAdmin) throw redirect({ to: getHomeRouteForUser(user) });
  },
  component: TeacherSalaryHistoryPage,
});

const medresaFeesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/fees',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    requireFeeAccess(user);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: FeeCollectionPage,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const medresaRecordPaymentRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/fees/record',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    requireFeeAccess(user);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: RecordPaymentPage,
  validateSearch: (search: Record<string, unknown>) => ({
    studentId: (search.studentId as string) || undefined,
    studentName: (search.studentName as string) || undefined,
    medresaId: (search.medresaId as string) || undefined,
    month: search.month !== undefined ? Number(search.month) : undefined,
    year: search.year !== undefined ? Number(search.year) : undefined,
    amountDueEtb: search.amountDueEtb !== undefined ? Number(search.amountDueEtb) : undefined,
    returnTab: (search.returnTab as string) || undefined,
  }),
});

const medresaStudentFeesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/students/$studentId/fees',
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
  beforeLoad: ({ context, params, search }) => {
    const user = requireAuth(context.queryClient);
    requireFeeAccess(user);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
    throw redirect({
      to: '/medresa/students/$studentId',
      params: { studentId: params.studentId },
      search: {
        medresaId: search.medresaId,
        tab: 'fees',
      },
    });
  },
});

const medresaAttendanceTakeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/medresa/attendance/take',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isMedresaAdmin && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: () => <DailyAttendanceTakePage variant="medresa_admin" />,
  validateSearch: (search: Record<string, unknown>) => ({
    medresaId: (search.medresaId as string) || undefined,
  }),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  protectedRoute.addChildren([
    adminDashboardRoute,
    adminReportsRoute,
    medresaReportsRoute,
    teacherReportsRoute,
    adminMedresasRoute,
    adminMedresaDetailRoute,
    adminTeachersRoute,
    adminTeacherDetailRoute,
    adminCoursesRoute,
    adminAttendanceNetworkRoute,
    pendingAccessRoute,
    medresaDashboardRoute,
    medresaAttendanceRoute,
    medresaAttendanceTakeRoute,
    medresaCoursesRoute,
    medresaCourseDetailRoute,
    medresaStudentsRoute,
    medresaStudentDetailRoute,
    medresaStudentResultsRoute,
    teacherStudentsRoute,
    teacherStudentResultsRoute,
    teacherDashboardRoute,
    teacherAttendanceHubRoute,
    teacherAttendanceTakeRoute,
    teacherGradesRoute,
    teacherGradeEntryRoute,
    teacherGradeEditRequestRoute,
    classResultsRoute,
    adminExamTypesRoute,
    adminGradeEditsRoute,
    medresaGradeEditsRoute,
    medresaResultsRoute,
    adminResultsRoute,
    adminFeeStructureRoute,
    adminFeesRoute,
    adminSalaryRanksRoute,
    adminSalariesRoute,
    adminSalariesOverviewRoute,
    adminRecordSalaryRoute,
    adminTeacherSalaryRoute,
    medresaFeesRoute,
    medresaRecordPaymentRoute,
    medresaStudentFeesRoute,
  ]),
]);

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    context: { queryClient },
  });

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
