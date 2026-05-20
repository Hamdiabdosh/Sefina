import { useMemo } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import { useMedresas } from '../../medresas/hooks/useMedresas';

type AdminMedresaPick = {
  medresaId: string;
  medresaName: string;
  role: 'ADMIN';
};

/**
 * Resolved medresa scope for flows that behave as Medresa Admin (courses, students dashboard).
 * Super Admin: all active medresas from GET /api/v1/medresas + search param handling.
 */
export const useMedresaContext = () => {
  const { currentUser } = useCurrentUser();
  const search = useSearch({ strict: false }) as { medresaId?: string };

  const superNeedsNetworkList = Boolean(currentUser?.isSuperAdmin);

  const { medresas, isLoading: medresaNetworkLoading } = useMedresas({
    enabled: superNeedsNetworkList,
  });

  const jwtAdminMedresas = useMemo(
    (): AdminMedresaPick[] =>
      (currentUser?.medresaRoles ?? [])
        .filter((r) => r.role === 'ADMIN')
        .map((r) => ({ medresaId: r.medresaId, medresaName: r.medresaName, role: 'ADMIN' as const })),
    [currentUser?.medresaRoles]
  );

  const adminMedresas = useMemo((): AdminMedresaPick[] => {
    if (!currentUser?.isSuperAdmin) {
      return jwtAdminMedresas;
    }
    return medresas
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => ({
        medresaId: m.id,
        medresaName: m.name,
        role: 'ADMIN' as const,
      }))
      .sort((a, b) => a.medresaName.localeCompare(b.medresaName));
  }, [currentUser?.isSuperAdmin, jwtAdminMedresas, medresas]);

  const medresaId = useMemo(() => {
    if (
      search.medresaId &&
      adminMedresas.some((m) => m.medresaId === search.medresaId)
    ) {
      return search.medresaId;
    }
    return adminMedresas[0]?.medresaId ?? '';
  }, [adminMedresas, search.medresaId]);

  const medresaName =
    adminMedresas.find((m) => m.medresaId === medresaId)?.medresaName ?? '';

  /** True while Super Admin waits for GET /medresas (avoid false "no access"). */
  const medresaScopeLoading = superNeedsNetworkList && medresaNetworkLoading;

  return {
    medresaId,
    medresaName,
    /** Medresas the user may administer here (JWT admins, or entire network when Super Admin). */
    adminMedresas,
    hasMultipleMedresas: adminMedresas.length > 1,
    medresaScopeLoading,
  };
};
