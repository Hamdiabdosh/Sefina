import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { MedresaRoleEntry } from '../../auth/types/auth.types';

type MedresaPickerProps = {
  medresas: MedresaRoleEntry[];
  selectedId: string;
};

export const MedresaPicker = ({ medresas, selectedId }: MedresaPickerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (medresas.length <= 1) return null;

  return (
    <div>
      <label className="field-label" htmlFor="page-medresa-picker">
        {t('courses.medresaPicker')}
      </label>
      <select
        id="page-medresa-picker"
        className="field-input"
        value={selectedId}
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
        {medresas.map((m) => (
          <option key={m.medresaId} value={m.medresaId}>
            {m.medresaName}
          </option>
        ))}
      </select>
    </div>
  );
};
