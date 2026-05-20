import { useEffect, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useMedresaAttendanceOverview } from '../hooks/useAttendance';

export const MedresaAttendanceOverviewPage = () => {
  const { t } = useTranslation();
  const { medresaId, adminMedresas, medresaScopeLoading } = useMedresaContext();
  const url = useSearch({ strict: false }) as { date?: string };
  const [date, setDate] = useState(() => url.date ?? new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (url.date) setDate(url.date);
  }, [url.date]);

  const overview = useMedresaAttendanceOverview(medresaId, date, Boolean(medresaId));

  if (medresaScopeLoading) {
    return (
      <div className="min-h-screen bg-cream p-4">
        <PageHeader title={t('attendance.medresaOverview')} subtitle={t('attendance.loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-12">
      <PageHeader title={t('attendance.medresaOverview')} subtitle={t('attendance.medresaSubtitle')} />
      <div className="p-4 space-y-4">
        {adminMedresas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('courses.noMedresaAccess')}</p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('attendance.date')}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-cream-dark rounded-md px-2 py-1 max-w-xs"
              />
            </label>
            {overview.isLoading ? (
              <p className="text-sm text-muted-foreground">{t('attendance.loading')}</p>
            ) : (overview.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">{t('attendance.noOverviewRows')}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-cream-dark/50">
                    <tr>
                      <th className="text-left p-2">{t('attendance.course')}</th>
                      <th className="text-left p-2">{t('courses.form.teacher')}</th>
                      <th className="text-right p-2">P</th>
                      <th className="text-right p-2">A</th>
                      <th className="text-right p-2">L</th>
                      <th className="text-right p-2">E</th>
                      <th className="text-right p-2">{t('attendance.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.data!.items.map((row) => (
                      <tr key={row.sessionId} className="border-t border-cream-dark">
                        <td className="p-2">{row.courseNameEn}</td>
                        <td className="p-2">{row.teacherName}</td>
                        <td className="text-right p-2">{row.present}</td>
                        <td className="text-right p-2">{row.absent}</td>
                        <td className="text-right p-2">{row.late}</td>
                        <td className="text-right p-2">{row.excused}</td>
                        <td className="text-right p-2">{row.totalStudents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
