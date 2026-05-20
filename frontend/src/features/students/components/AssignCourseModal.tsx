import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import type { MedresaCourseListItem } from '../../courses/types';
import type { useStudent } from '../hooks/useStudent';

type AssignCourseModalProps = {
  open: boolean;
  onClose: () => void;
  courses: MedresaCourseListItem[];
  enrolledCourseIds: string[];
  assignCourse: ReturnType<typeof useStudent>['assignCourse'];
};

export const AssignCourseModal = ({
  open,
  onClose,
  courses,
  enrolledCourseIds,
  assignCourse,
}: AssignCourseModalProps) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState('');

  if (!open) return null;

  const eligible = courses.filter(
    (c) =>
      c.status === 'ACTIVE' &&
      c.assignedTeacher &&
      !enrolledCourseIds.includes(c.medresaCourseId)
  );

  const handleAssign = () => {
    if (!selectedId) return;
    assignCourse.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId('');
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('students.assignCourseTitle')}</h3>
        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">{t('students.noCoursesToAssign')}</p>
        ) : (
          <select
            className="field-input w-full mb-4"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">{t('students.selectCourse')}</option>
            {eligible.map((c) => (
              <option key={c.medresaCourseId} value={c.medresaCourseId}>
                {getLocalizedValue(c.name)}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('students.cancel')}
          </button>
          <button
            type="button"
            disabled={!selectedId || assignCourse.isPending}
            onClick={handleAssign}
            className="btn-primary flex-1"
          >
            {assignCourse.isPending ? t('students.saving') : t('students.assign')}
          </button>
        </div>
      </div>
    </div>
  );
};
