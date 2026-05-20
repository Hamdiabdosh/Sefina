import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import type { StudentCourseDetail } from '../types';
import type { useStudent } from '../hooks/useStudent';

type RemoveFromCourseDialogProps = {
  open: boolean;
  onClose: () => void;
  enrollment: StudentCourseDetail | null;
  removeCourse: ReturnType<typeof useStudent>['removeCourse'];
};

export const RemoveFromCourseDialog = ({
  open,
  onClose,
  enrollment,
  removeCourse,
}: RemoveFromCourseDialogProps) => {
  const { t } = useTranslation();

  if (!open || !enrollment) return null;

  const handleRemove = () => {
    removeCourse.mutate(enrollment.studentCourseId, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-2">{t('students.removeCourseTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('students.removeCourseBody', {
            course: getLocalizedValue(enrollment.courseName),
          })}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('students.cancel')}
          </button>
          <button
            type="button"
            disabled={removeCourse.isPending}
            onClick={handleRemove}
            className="flex-1 px-4 py-2 rounded-lg bg-danger-text text-white text-sm font-medium"
          >
            {removeCourse.isPending ? t('students.saving') : t('students.remove')}
          </button>
        </div>
      </div>
    </div>
  );
};
