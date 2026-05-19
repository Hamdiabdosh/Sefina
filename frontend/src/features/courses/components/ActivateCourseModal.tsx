import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import type { AvailableMasterCourse } from '../types';
import type { useMedresaCourses } from '../hooks/useMedresaCourses';

type ActivateCourseModalProps = {
  open: boolean;
  onClose: () => void;
  availableCourses: AvailableMasterCourse[];
  activateCourse: ReturnType<typeof useMedresaCourses>['activateCourse'];
};

export const ActivateCourseModal = ({
  open,
  onClose,
  availableCourses,
  activateCourse,
}: ActivateCourseModalProps) => {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('courses.activateTitle')}</h3>
        {availableCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('courses.noAvailable')}</p>
        ) : (
          <ul className="space-y-2">
            {availableCourses.map((course) => (
              <li key={course.id}>
                <button
                  type="button"
                  disabled={activateCourse.isPending}
                  onClick={() =>
                    activateCourse.mutate(course.id, {
                      onSuccess: () => onClose(),
                    })
                  }
                  className="w-full text-left p-3 rounded-lg border border-cream-dark hover:bg-teal-50 transition-colors"
                >
                  <p className="font-medium text-teal-800">{getLocalizedValue(course.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`courses.level.${course.level.toLowerCase()}`)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={onClose} className="btn-secondary w-full mt-4">
          {t('courses.cancel')}
        </button>
      </div>
    </div>
  );
};
