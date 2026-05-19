import { useTranslation } from 'react-i18next';
import type { CourseListItem } from '../types';
import type { useCourses } from '../hooks/useCourses';

type DeactivateCourseDialogProps = {
  course: CourseListItem | null;
  onClose: () => void;
  deactivateCourse: ReturnType<typeof useCourses>['deactivateCourse'];
};

export const DeactivateCourseDialog = ({
  course,
  onClose,
  deactivateCourse,
}: DeactivateCourseDialogProps) => {
  const { t } = useTranslation();
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-2">{t('courses.deactivateTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('courses.deactivateBody')}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('courses.cancel')}
          </button>
          <button
            type="button"
            className="flex-1 text-white rounded-md py-3 bg-danger-text hover:opacity-90 text-sm font-medium"
            disabled={deactivateCourse.isPending}
            onClick={() =>
              deactivateCourse.mutate(course.id, {
                onSuccess: () => onClose(),
              })
            }
          >
            {deactivateCourse.isPending ? t('courses.saving') : t('courses.deactivate')}
          </button>
        </div>
      </div>
    </div>
  );
};
