import { Link, useNavigate, useParams, useRouterState, useSearch } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useStudentResults } from '../hooks/useGrades';

export const StudentResultsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { studentId } = useParams({ strict: false }) as { studentId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isTeacherRoute = pathname.includes('/teacher/students/');
  const { data, isLoading } = useStudentResults(studentId, Boolean(studentId));

  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [examFilter, setExamFilter] = useState<string>('ALL');

  const backTo = isTeacherRoute ? '/teacher/students' : '/medresa/students';

  const courses = data?.courses ?? [];

  const courseTabs = useMemo(
    () => [
      { value: 'ALL', label: t('grades.filterAllCourses') },
      ...courses.map((c) => ({
        value: c.medresaCourseId,
        label: c.courseName,
      })),
    ],
    [courses, t]
  );

  const examTypeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of courses) {
      for (const e of c.exams) {
        ids.add(e.examTypeId);
      }
    }
    return [...ids];
  }, [courses]);

  const examTabs = useMemo(
    () => [
      { value: 'ALL', label: t('grades.filterAllExams') },
      ...examTypeIds.map((id) => {
        const exam = courses.flatMap((c) => c.exams).find((e) => e.examTypeId === id);
        return {
          value: id,
          label: exam ? getLocalizedValue(exam.name) : id.slice(0, 8),
        };
      }),
    ],
    [examTypeIds, courses, t]
  );

  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => courseFilter === 'ALL' || c.medresaCourseId === courseFilter)
      .map((c) => ({
        ...c,
        exams: c.exams.filter(
          (e) => examFilter === 'ALL' || e.examTypeId === examFilter
        ),
      }))
      .filter((c) => c.exams.length > 0 || examFilter === 'ALL');
  }, [courses, courseFilter, examFilter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('grades.studentResultsTitle')}
        subtitle={data?.fullName}
        onBack={() =>
          void navigate({
            to: backTo,
            search: isTeacherRoute
              ? { medresaId: search.medresaId }
              : { medresaId: search.medresaId, medresaCourseId: undefined },
          })
        }
      />
      <PageBody>
        <Link
          to={backTo}
          search={
            isTeacherRoute
              ? { medresaId: search.medresaId }
              : { medresaId: search.medresaId, medresaCourseId: undefined }
          }
          className="mb-4 inline-block text-sm text-teal-700 underline"
        >
          {t('grades.backToStudents')}
        </Link>

        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : !data ? (
          <p className="text-sm text-muted-foreground">{t('grades.noGradesYet')}</p>
        ) : (
          <>
            {data.overallGpaPercent !== null ? (
              <p className="mb-4 text-lg font-medium text-teal-800">
                {t('grades.overallGpa', { gpa: data.overallGpaPercent })}
              </p>
            ) : null}

            <div className="mb-3 space-y-2">
              <FilterTabs value={courseFilter} onChange={setCourseFilter} tabs={courseTabs} />
              <FilterTabs value={examFilter} onChange={setExamFilter} tabs={examTabs} />
            </div>

            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <section
                  key={course.medresaCourseId}
                  className="rounded-xl border border-cream-dark bg-surface overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-cream-dark px-4 py-2 bg-cream/50">
                    <h2 className="text-sm font-medium">{course.courseName}</h2>
                    {course.weightedTotalPercent !== null ? (
                      <span className="text-sm text-teal-800 tabular-nums">
                        {course.weightedTotalPercent}%
                      </span>
                    ) : null}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground border-b border-cream-dark">
                        <th className="p-3">{t('grades.examTypeLabel')}</th>
                        <th className="p-3">{t('grades.score')}</th>
                        <th className="p-3">{t('grades.maxScoreLabel')}</th>
                        <th className="p-3">{t('grades.weightLabel')}</th>
                        <th className="p-3">{t('grades.letter')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.exams.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-muted-foreground text-xs">
                            {t('grades.noExamsInFilter')}
                          </td>
                        </tr>
                      ) : (
                        course.exams.map((e) => (
                          <tr
                            key={e.examTypeId}
                            className="border-b border-cream-dark/60 last:border-0"
                          >
                            <td className="p-3">{getLocalizedValue(e.name)}</td>
                            <td className="p-3 tabular-nums">{e.score}</td>
                            <td className="p-3 tabular-nums">{e.maxScore}</td>
                            <td className="p-3 tabular-nums">{e.weight}%</td>
                            <td className="p-3 font-medium">{e.letterGrade}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          </>
        )}
      </PageBody>
    </div>
  );
};
