import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { MedresaRoleEntry } from '../../auth/types/auth.types';

type MedresaPickerProps = {
  medresas: MedresaRoleEntry[];
  selectedId: string;
};

export const MedresaPicker = ({ medresas, selectedId }: MedresaPickerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (medresas.length <= 1) return null;

  return (
    <div>
      <label className="field-label">{t('courses.medresaPicker')}</label>
      <select
        className="field-input"
        value={selectedId}
        onChange={(e) => {
          void navigate({
            to: '/medresa/courses',
            search: { medresaId: e.target.value },
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
