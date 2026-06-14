import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMedresaContext } from '../../features/courses/hooks/useMedresaContext';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser';

export const MedresaContextBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser } = useCurrentUser();
  const { medresaId, medresaName, adminMedresas, hasMultipleMedresas } = useMedresaContext();

  const showBar =
    hasMultipleMedresas &&
    medresaName &&
    (currentUser?.isMedresaAdmin || currentUser?.isSuperAdmin);

  if (!showBar) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-topbar-border bg-teal-50/80 px-4 py-2 md:px-6">
      <Building2 className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-xs text-teal-800">
        {t('medresas.contextBar', { name: medresaName })}
      </span>
      <label className="sr-only" htmlFor="shell-medresa-picker">
        {t('courses.medresaPicker')}
      </label>
      <select
        id="shell-medresa-picker"
        className="max-w-[12rem] rounded-md border border-cream-dark bg-surface px-2 py-1.5 text-xs text-teal-800"
        value={medresaId}
        onChange={(e) => {
          void navigate({
            to: pathname,
            search: (prev: Record<string, unknown>) => ({
              ...prev,
              medresaId: e.target.value,
            }),
          });
        }}
      >
        {adminMedresas.map((m) => (
          <option key={m.medresaId} value={m.medresaId}>
            {m.medresaName}
          </option>
        ))}
      </select>
    </div>
  );
};
