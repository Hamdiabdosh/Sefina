import { useMemo, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useMedresaCourseResults } from '../hooks/useGrades';
import type { LetterGrade } from '../types';

type ClassResultsData = {
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

export const ClassResultsPage = () => {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { medresaCourseId?: string };
  const medresaCourseId = search.medresaCourseId ?? '';
  const { data, isLoading } = useMedresaCourseResults(medresaCourseId, Boolean(medresaCourseId));
  const results = data as ClassResultsData | undefined;

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

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('grades.classResultsTitle')}
        subtitle={results?.courseName}
        actions={
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => window.print()}
          >
            {t('grades.print')}
          </button>
        }
      />
      <PageBody fullWidth>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('grades.loading')}</p>
        ) : !results ? null : (
          <>
            <div className="mb-4">
              <FilterTabs value={examFilter} onChange={setExamFilter} tabs={examTabs} />
            </div>
            <div className="overflow-x-auto rounded-xl border border-cream-dark bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">{t('grades.student')}</th>
                    {visibleExamTypes.map((et) => (
                      <th
                        key={et.id}
                        className={cnExamHeader(et.id === examFilter && examFilter !== 'ALL')}
                      >
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
                          <td
                            key={et.id}
                            className={cnExamCell(et.id === examFilter && examFilter !== 'ALL')}
                          >
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
          </>
        )}
      </PageBody>
    </div>
  );
};

function cnExamHeader(highlight: boolean) {
  return highlight ? 'p-3 bg-teal-50 font-medium' : 'p-3';
}

function cnExamCell(highlight: boolean) {
  return highlight ? 'p-3 tabular-nums bg-teal-50/50' : 'p-3 tabular-nums';
}
