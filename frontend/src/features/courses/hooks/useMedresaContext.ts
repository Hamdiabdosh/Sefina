import { useMemo } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';

export const useMedresaContext = () => {
  const { currentUser } = useCurrentUser();
  const search = useSearch({ strict: false }) as { medresaId?: string };

  const adminMedresas = useMemo(
    () =>
      (currentUser?.medresaRoles ?? []).filter((r) => r.role === 'ADMIN'),
    [currentUser?.medresaRoles]
  );

  const medresaId = useMemo(() => {
    if (search.medresaId && adminMedresas.some((m) => m.medresaId === search.medresaId)) {
      return search.medresaId;
    }
    return adminMedresas[0]?.medresaId ?? '';
  }, [adminMedresas, search.medresaId]);

  const medresaName =
    adminMedresas.find((m) => m.medresaId === medresaId)?.medresaName ?? '';

  return {
    medresaId,
    medresaName,
    adminMedresas,
    hasMultipleMedresas: adminMedresas.length > 1,
  };
};
