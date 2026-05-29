import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useMedresaResultsOverview } from '../hooks/useGrades';

type CourseRow = {
  medresaCourseId: string;
  courseName: string;
  assignedTeacher: { id: string; fullName: string } | null;
  studentCount: number;
  averagePercent: number | null;
  highestPercent: number | null;
  lowestPercent: number | null;
};

export const MedresaResultsOverviewPage = () => {
  const { t } = useTranslation();
  const { medresaId, adminMedresas, medresaScopeLoading } = useMedresaContext();
  const { data, isLoading } = useMedresaResultsOverview(medresaId, Boolean(medresaId));

  const [courseFilter, setCourseFilter] = useState('ALL');
  const [teacherFilter, setTeacherFilter] = useState('ALL');

  const courses = (data?.courses ?? []) as CourseRow[];

  const teachers = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) {
      if (c.assignedTeacher) map.set(c.assignedTeacher.id, c.assignedTeacher.fullName);
    }
    return [...map.entries()].map(([id, fullName]) => ({ id, fullName }));
  }, [courses]);

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        if (courseFilter !== 'ALL' && c.medresaCourseId !== courseFilter) return false;
        if (teacherFilter !== 'ALL' && c.assignedTeacher?.id !== teacherFilter) return false;
        return true;
      }),
    [courses, courseFilter, teacherFilter]
  );

  if (medresaScopeLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('grades.medresaOverviewTitle')} subtitle={t('grades.loading')} />
        <PageBody fullWidth>
          <SkeletonTable rows={5} />
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('grades.medresaOverviewTitle')} />
      <PageBody fullWidth>
        {adminMedresas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('courses.noMedresaAccess')}</p>
        ) : isLoading ? (
          <SkeletonTable rows={5} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="text-xs text-muted-foreground">
                {t('grades.filterCourse')}
                <select
                  className="field-input mt-1 block text-sm"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                >
                  <option value="ALL">{t('grades.filterAllCourses')}</option>
                  {courses.map((c) => (
                    <option key={c.medresaCourseId} value={c.medresaCourseId}>
                      {c.courseName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                {t('grades.filterTeacher')}
                <select
                  className="field-input mt-1 block text-sm"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                >
                  <option value="ALL">{t('grades.filterAllTeachers')}</option>
                  {teachers.map((te) => (
                    <option key={te.id} value={te.id}>
                      {te.fullName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="overflow-x-auto rounded-xl border border-cream-dark bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">{t('grades.course')}</th>
                    <th className="p-3">{t('grades.teacher')}</th>
                    <th className="p-3">{t('grades.average')}</th>
                    <th className="p-3">{t('grades.highest')}</th>
                    <th className="p-3">{t('grades.lowest')}</th>
                    <th className="p-3">{t('grades.students')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.medresaCourseId} className="border-b border-cream-dark/60">
                      <td className="p-3 font-medium">{c.courseName}</td>
                      <td className="p-3">{c.assignedTeacher?.fullName ?? '—'}</td>
                      <td className="p-3 tabular-nums">
                        {c.averagePercent !== null ? `${c.averagePercent}%` : '—'}
                      </td>
                      <td className="p-3 tabular-nums">
                        {c.highestPercent !== null ? `${c.highestPercent}%` : '—'}
                      </td>
                      <td className="p-3 tabular-nums">
                        {c.lowestPercent !== null ? `${c.lowestPercent}%` : '—'}
                      </td>
                      <td className="p-3 tabular-nums">{c.studentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PageBody>
    </div>
  );
};
