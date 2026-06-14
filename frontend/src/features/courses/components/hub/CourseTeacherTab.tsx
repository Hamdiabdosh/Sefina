import { useTranslation } from 'react-i18next';
import type { MedresaCourseDetail } from '../../types';

type Props = {
  course: MedresaCourseDetail;
  onAssign: () => void;
};

export const CourseTeacherTab = ({ course, onAssign }: Props) => {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-cream-dark bg-surface p-4">
      <h2 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
        {t('courses.assignedTeacher')}
      </h2>
      {course.assignedTeacher ? (
        <p className="font-medium text-teal-800">{course.assignedTeacher.fullName}</p>
      ) : (
        <p className="text-sm text-amber-700">{t('courses.noTeacher')}</p>
      )}
      {course.status === 'ACTIVE' ? (
        <button type="button" onClick={onAssign} className="btn-secondary mt-4 w-full text-sm">
          {course.assignedTeacher ? t('courses.changeTeacher') : t('courses.assignTeacher')}
        </button>
      ) : null}
    </section>
  );
};
