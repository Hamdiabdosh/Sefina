import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { MedresaRoleEntry } from '../../auth/types/auth.types';

type TeacherMedresaPickerProps = {
  medresas: MedresaRoleEntry[];
  selectedId: string;
  /** Route to stay on when switching medresa (e.g. `/teacher/students`) */
  routeTo: '/teacher/students' | '/teacher/attendance' | '/teacher/grades';
};

export const TeacherMedresaPicker = ({
  medresas,
  selectedId,
  routeTo,
}: TeacherMedresaPickerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (medresas.length <= 1) return null;

  return (
    <div className="mb-4">
      <label className="field-label">{t('courses.medresaPicker')}</label>
      <select
        className="field-input"
        value={selectedId}
        onChange={(e) => {
          void navigate({
            to: routeTo,
            search: { medresaId: e.target.value },
            replace: true,
          });
        }}
        aria-label={t('courses.medresaPicker')}
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
