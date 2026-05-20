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
import { TeacherCourseAttendancePage } from './features/attendance/pages/TeacherCourseAttendancePage';
import { MedresaAttendanceOverviewPage } from './features/attendance/pages/MedresaAttendanceOverviewPage';
import { AdminAttendanceNetworkPage } from './features/attendance/pages/AdminAttendanceNetworkPage';
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

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    const user = getCurrentUser(context.queryClient);
    if (!user) throw redirect({ to: '/login' });
    throw redirect({ to: getHomeRouteForUser(user) });
  },
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

const teacherCourseAttendanceRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/teacher/attendance/$medresaCourseId',
  beforeLoad: ({ context }) => {
    const user = requireAuth(context.queryClient);
    if (!user.isTeacher && !user.isSuperAdmin) {
      throw redirect({ to: getHomeRouteForUser(user) });
    }
  },
  component: TeacherCourseAttendancePage,
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
    adminMedresasRoute,
    adminMedresaDetailRoute,
    adminTeachersRoute,
    adminTeacherDetailRoute,
    adminCoursesRoute,
    adminAttendanceNetworkRoute,
    pendingAccessRoute,
    medresaDashboardRoute,
    medresaAttendanceRoute,
    medresaCoursesRoute,
    medresaCourseDetailRoute,
    medresaStudentsRoute,
    medresaStudentDetailRoute,
    teacherStudentsRoute,
    teacherDashboardRoute,
    teacherAttendanceHubRoute,
    teacherCourseAttendanceRoute,
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
