import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '../../../teachers/utils/localizedJson';
import type { MedresaCourseDetail } from '../../types';

type Props = {
  course: MedresaCourseDetail;
};

export const CourseOverviewTab = ({ course }: Props) => {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-cream-dark bg-surface p-4">
      <p className="text-sm text-muted-foreground">{getLocalizedValue(course.description)}</p>
      <p className="mt-2 text-sm text-teal-600">
        {t(`courses.level.${course.level.toLowerCase()}`)} ·{' '}
        {t(`courses.status.${course.status.toLowerCase()}`)}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase text-muted-foreground">{t('courses.enrolledStudents')}</dt>
          <dd className="font-medium text-teal-800">
            {t('courses.studentCount', { count: course.studentCount })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">{t('courses.assignedTeacher')}</dt>
          <dd className="font-medium text-teal-800">
            {course.assignedTeacher?.fullName ?? t('courses.noTeacher')}
          </dd>
        </div>
      </dl>
    </section>
  );
};
