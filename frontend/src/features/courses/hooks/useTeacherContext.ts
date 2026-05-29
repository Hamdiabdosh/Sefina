import { useMemo } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import type { MedresaRoleEntry } from '../../auth/types/auth.types';

/**
 * Medresa scope for teacher-area flows (students list, attendance, etc.).
 * Includes medresas where the user is TEACHER or ADMIN (Amir sees full roster).
 */
export const useTeacherContext = () => {
  const { currentUser } = useCurrentUser();
  const search = useSearch({ strict: false }) as { medresaId?: string };

  const scopeMedresas = useMemo((): MedresaRoleEntry[] => {
    const byId = new Map<string, MedresaRoleEntry>();
    for (const r of currentUser?.medresaRoles ?? []) {
      if (r.role !== 'TEACHER' && r.role !== 'ADMIN') continue;
      const existing = byId.get(r.medresaId);
      if (!existing || r.role === 'ADMIN') {
        byId.set(r.medresaId, r);
      }
    }
    return [...byId.values()].sort((a, b) =>
      a.medresaName.localeCompare(b.medresaName)
    );
  }, [currentUser?.medresaRoles]);

  const medresaId = useMemo(() => {
    if (
      search.medresaId &&
      scopeMedresas.some((m) => m.medresaId === search.medresaId)
    ) {
      return search.medresaId;
    }
    return scopeMedresas[0]?.medresaId ?? '';
  }, [scopeMedresas, search.medresaId]);

  const medresaName =
    scopeMedresas.find((m) => m.medresaId === medresaId)?.medresaName ?? '';

  const isAdminAtMedresa = useMemo(
    () =>
      currentUser?.isSuperAdmin === true ||
      (currentUser?.medresaRoles ?? []).some(
        (r) => r.medresaId === medresaId && r.role === 'ADMIN'
      ),
    [currentUser, medresaId]
  );

  return {
    medresaId,
    medresaName,
    /** Medresas where user teaches and/or is Amir */
    teacherMedresas: scopeMedresas,
    hasMultipleMedresas: scopeMedresas.length > 1,
    hasTeacherMedresa: scopeMedresas.length > 0,
    isAdminAtMedresa,
  };
};
