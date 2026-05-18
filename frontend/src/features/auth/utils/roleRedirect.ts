import type { CurrentUser, User } from '../types/auth.types';

export const enrichCurrentUser = (user: User): CurrentUser => {
  const isMedresaAdmin = user.medresaRoles.some((r) => r.role === 'ADMIN');
  const isTeacher = user.medresaRoles.some((r) => r.role === 'TEACHER');

  return {
    ...user,
    isMedresaAdmin,
    isTeacher,
    hasAppAccess: user.isSuperAdmin || isMedresaAdmin || isTeacher,
  };
};

export const getHomeRouteForUser = (user: CurrentUser): string => {
  if (user.isSuperAdmin) return '/admin/medresas';
  if (user.isMedresaAdmin) return '/medresa/dashboard';
  if (user.isTeacher) return '/teacher/dashboard';
  return '/account/pending';
};
