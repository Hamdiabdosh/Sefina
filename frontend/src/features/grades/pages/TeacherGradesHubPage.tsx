import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useTeacherGradeCourses } from '../hooks/useGrades';

export const TeacherGradesHubPage = () => {
  const { t } = useTranslation();
  const coursesQuery = useTeacherGradeCourses(true);

  const courses = coursesQuery.data?.items ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('grades.title')} subtitle={t('grades.teacherSubtitle')} />
      <PageBody>
        {coursesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('grades.loading')}</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('grades.noAssignedCourses')}</p>
        ) : (
          <ul className="space-y-3">
            {courses.map((c) => (
              <li
                key={c.medresaCourseId}
                className="rounded-xl border border-cream-dark bg-surface p-4"
              >
                <p className="font-medium text-foreground">{c.courseName}</p>
                <p className="text-xs text-muted-foreground">{c.medresaName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/teacher/grades/entry"
                    search={{ medresaCourseId: c.medresaCourseId, examTypeId: undefined }}
                    className="rounded-md border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100"
                  >
                    {t('grades.enterGrades')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </div>
  );
};
