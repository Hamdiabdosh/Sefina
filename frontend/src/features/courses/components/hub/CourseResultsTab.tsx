import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterTabs } from '../../../../components/ui/FilterTabs';
import { DataTable } from '../../../../components/ui/DataTable';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { getLocalizedValue } from '../../../teachers/utils/localizedJson';
import { useMedresaCourseResults } from '../../../grades/hooks/useGrades';
import type { LetterGrade } from '../../../grades/types';

type CourseResultsData = {
  courseName: string;
  examTypes: Array<{ id: string; name: unknown; maxScore: number; weight: number }>;
  students: Array<{
    studentId: string;
    fullName: string;
    exams: Array<{
      examTypeId: string;
      score: number;
      letterGrade: LetterGrade;
    }>;
    weightedTotalPercent: number | null;
  }>;
};

type Props = {
  medresaCourseId: string;
};

export const CourseResultsTab = ({ medresaCourseId }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useMedresaCourseResults(medresaCourseId, Boolean(medresaCourseId));
  const results = data as CourseResultsData | undefined;
  const [examFilter, setExamFilter] = useState<string>('ALL');

  const examTabs = useMemo(
    () => [
      { value: 'ALL', label: t('grades.filterAllExams') },
      ...(results?.examTypes ?? []).map((et) => ({
        value: et.id,
        label: getLocalizedValue(et.name),
      })),
    ],
    [results?.examTypes, t]
  );

  const visibleExamTypes = useMemo(() => {
    if (!results) return [];
    if (examFilter === 'ALL') return results.examTypes;
    return results.examTypes.filter((et) => et.id === examFilter);
  }, [results, examFilter]);

  if (isLoading) return <SkeletonTable rows={5} />;
  if (!results) return <p className="text-sm text-muted-foreground">{t('grades.noAssignedCourses')}</p>;

  return (
    <>
      <div className="mb-4">
        <FilterTabs value={examFilter} onChange={setExamFilter} tabs={examTabs} />
      </div>
      <DataTable>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">{t('grades.student')}</th>
                {visibleExamTypes.map((et) => (
                  <th key={et.id} className="p-3">
                    {getLocalizedValue(et.name)}
                  </th>
                ))}
                <th className="p-3">{t('grades.weightedTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {results.students.map((s) => (
                <tr key={s.studentId} className="border-b border-cream-dark/60 last:border-0">
                  <td className="p-3 font-medium">{s.fullName}</td>
                  {visibleExamTypes.map((et) => {
                    const ex = s.exams.find((e) => e.examTypeId === et.id);
                    return (
                      <td key={et.id} className="p-3 tabular-nums">
                        {ex ? `${ex.score} (${ex.letterGrade})` : '—'}
                      </td>
                    );
                  })}
                  <td className="p-3 tabular-nums">
                    {s.weightedTotalPercent !== null ? `${s.weightedTotalPercent}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTable>
    </>
  );
};
