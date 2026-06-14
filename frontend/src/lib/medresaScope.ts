const STORAGE_KEY = 'sefina.selectedMedresaId';

/** Routes that should carry ?medresaId= when a medresa admin has multiple schools. */
export const MEDRESA_SCOPED_ROUTE_PREFIXES = [
  '/medresa/dashboard',
  '/medresa/courses',
  '/medresa/students',
  '/medresa/attendance',
  '/medresa/grade-edits',
  '/medresa/results',
  '/medresa/fees',
  '/medresa/reports',
] as const;

export const isMedresaScopedRoute = (pathname: string): boolean =>
  MEDRESA_SCOPED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const readStoredMedresaId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const writeStoredMedresaId = (medresaId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, medresaId);
  } catch {
    // ignore quota / private mode
  }
};

export const buildMedresaNavSearch = (
  to: string,
  medresaId: string | undefined
): { medresaId?: string } | undefined => {
  if (!medresaId || !isMedresaScopedRoute(to)) return undefined;
  return { medresaId };
};
