import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '../../../teachers/utils/localizedJson';
import type { StudentCourseDetail, StudentDetail } from '../../types';

type Props = {
  student: StudentDetail;
  isMedresaAdmin: boolean;
  onAssign: () => void;
  onRemove: (enrollment: StudentCourseDetail) => void;
};

export const StudentCoursesTab = ({
  student,
  isMedresaAdmin,
  onAssign,
  onRemove,
}: Props) => {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-cream-dark bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase text-muted-foreground">
          {t('students.courses')} ({student.courses.length})
        </h2>
        {isMedresaAdmin ? (
          <button type="button" onClick={onAssign} className="text-sm text-teal-600">
            {t('students.assignCourse')}
          </button>
        ) : null}
      </div>
      {student.courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('students.noCourses')}</p>
      ) : (
        <ul className="space-y-2">
          {student.courses.map((c) => (
            <li
              key={c.studentCourseId}
              className="flex items-center justify-between border-b border-cream-dark pb-2 text-sm last:border-0"
            >
              <span>{getLocalizedValue(c.courseName)}</span>
              {isMedresaAdmin ? (
                <button
                  type="button"
                  onClick={() => onRemove(c)}
                  className="text-xs text-danger-text"
                >
                  {t('students.remove')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
