import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { useNetworkResultsOverview } from '../hooks/useGrades';

type NetworkRow = {
  medresaId: string;
  medresaName: string;
  courseCount: number;
  averagePercent: number | null;
  courses: Array<{
    medresaCourseId: string;
    courseName: string;
    assignedTeacher: { id: string; fullName: string } | null;
    averagePercent: number | null;
    highestPercent: number | null;
    lowestPercent: number | null;
  }>;
};

export const NetworkResultsOverviewPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useNetworkResultsOverview(true);
  const [medresaFilter, setMedresaFilter] = useState('ALL');

  const items = (data?.items ?? []) as NetworkRow[];

  const flatRows = useMemo(() => {
    const rows: Array<{
      medresaId: string;
      medresaName: string;
      courseName: string;
      teacherName: string;
      averagePercent: number | null;
      high: number | null;
      low: number | null;
    }> = [];
    for (const m of items) {
      if (medresaFilter !== 'ALL' && m.medresaId !== medresaFilter) continue;
      for (const c of m.courses) {
        rows.push({
          medresaId: m.medresaId,
          medresaName: m.medresaName,
          courseName: c.courseName,
          teacherName: c.assignedTeacher?.fullName ?? '—',
          averagePercent: c.averagePercent,
          high: c.highestPercent,
          low: c.lowestPercent,
        });
      }
    }
    return rows;
  }, [items, medresaFilter]);

  const medresaTabs = useMemo(
    () => [
      { value: 'ALL', label: t('grades.filterAllMedresas') },
      ...items.map((m) => ({ value: m.medresaId, label: m.medresaName })),
    ],
    [items, t]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('grades.networkOverviewTitle')} />
      <PageBody fullWidth>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('grades.loading')}</p>
        ) : (
          <>
            <div className="mb-4">
              <FilterTabs value={medresaFilter} onChange={setMedresaFilter} tabs={medresaTabs} />
            </div>
            <div className="overflow-x-auto rounded-xl border border-cream-dark bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">{t('grades.medresa')}</th>
                    <th className="p-3">{t('grades.course')}</th>
                    <th className="p-3">{t('grades.teacher')}</th>
                    <th className="p-3">{t('grades.average')}</th>
                    <th className="p-3">{t('grades.highest')}</th>
                    <th className="p-3">{t('grades.lowest')}</th>
                  </tr>
                </thead>
                <tbody>
                  {flatRows.map((r, i) => (
                    <tr key={`${r.medresaId}-${r.courseName}-${i}`} className="border-b border-cream-dark/60">
                      <td className="p-3">{r.medresaName}</td>
                      <td className="p-3 font-medium">{r.courseName}</td>
                      <td className="p-3">{r.teacherName}</td>
                      <td className="p-3 tabular-nums">
                        {r.averagePercent !== null ? `${r.averagePercent}%` : '—'}
                      </td>
                      <td className="p-3 tabular-nums">
                        {r.high !== null ? `${r.high}%` : '—'}
                      </td>
                      <td className="p-3 tabular-nums">
                        {r.low !== null ? `${r.low}%` : '—'}
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
