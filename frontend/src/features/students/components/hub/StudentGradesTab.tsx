import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterTabs } from '../../../../components/ui/FilterTabs';
import { DataTable } from '../../../../components/ui/DataTable';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { getLocalizedValue } from '../../../teachers/utils/localizedJson';
import { useStudentResults } from '../../../grades/hooks/useGrades';

type Props = {
  studentId: string;
};

export const StudentGradesTab = ({ studentId }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useStudentResults(studentId, Boolean(studentId));
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [examFilter, setExamFilter] = useState<string>('ALL');

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

  const filteredCourses = useMemo(
    () =>
      courses
        .filter((c) => courseFilter === 'ALL' || c.medresaCourseId === courseFilter)
        .map((c) => ({
          ...c,
          exams: c.exams.filter((e) => examFilter === 'ALL' || e.examTypeId === examFilter),
        }))
        .filter((c) => c.exams.length > 0 || examFilter === 'ALL'),
    [courses, courseFilter, examFilter]
  );

  if (isLoading) {
    return <SkeletonTable rows={4} />;
  }

  if (!data || courses.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('grades.noGradesYet')}</p>;
  }

  return (
    <div className="space-y-4">
      {data.overallGpaPercent !== null ? (
        <p className="text-lg font-medium text-teal-800">
          {t('grades.overallGpa', { gpa: data.overallGpaPercent })}
        </p>
      ) : null}

      <div className="space-y-2">
        <FilterTabs value={courseFilter} onChange={setCourseFilter} tabs={courseTabs} />
        <FilterTabs value={examFilter} onChange={setExamFilter} tabs={examTabs} />
      </div>

      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <section
            key={course.medresaCourseId}
            className="card overflow-hidden p-0"
          >
            <div className="flex items-center justify-between border-b border-cream-dark bg-cream/50 px-4 py-2">
              <h2 className="text-sm font-medium">{course.courseName}</h2>
              {course.weightedTotalPercent !== null ? (
                <span className="text-sm tabular-nums text-teal-800">
                  {course.weightedTotalPercent}%
                </span>
              ) : null}
            </div>
            <DataTable className="border-0 shadow-none rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
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
                    <td colSpan={5} className="p-3 text-xs text-muted-foreground">
                      {t('grades.noExamsInFilter')}
                    </td>
                  </tr>
                ) : (
                  course.exams.map((e) => (
                    <tr key={e.examTypeId} className="border-b border-cream-dark/60 last:border-0">
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
            </DataTable>
          </section>
        ))}
      </div>
    </div>
  );
};
