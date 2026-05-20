import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { getTodayCalendarEt } from '../utils/ethiopiaDate';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useMedresaAttendanceOverview } from '../hooks/useAttendance';

export const MedresaAttendanceOverviewPage = () => {
  const { t } = useTranslation();
  const { medresaId, adminMedresas, medresaScopeLoading } = useMedresaContext();
  const url = useSearch({ strict: false }) as { date?: string };
  const [date, setDate] = useState(() => url.date ?? getTodayCalendarEt());

  useEffect(() => {
    if (url.date) setDate(url.date);
  }, [url.date]);

  const overview = useMedresaAttendanceOverview(medresaId, date, Boolean(medresaId));

  const todayEt = getTodayCalendarEt();

  if (medresaScopeLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('attendance.medresaOverview')} subtitle={t('attendance.loading')} />
      </div>
    );
  }

  const row = overview.data?.items[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('attendance.medresaOverview')} subtitle={t('attendance.medresaSubtitleDaily')} />
      <PageBody>
        {adminMedresas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('courses.noMedresaAccess')}</p>
        ) : (
          <>
            <Link
              to="/medresa/attendance/take"
              search={{ medresaId }}
              className="inline-block text-sm px-4 py-2 rounded-lg bg-teal-700 text-white"
            >
              {t('attendance.openTakeAttendance')}
            </Link>
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
            ) : !row ? (
              <p className="text-sm text-muted-foreground">{t('attendance.noOverviewRows')}</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground flex flex-wrap gap-3">
                  <span>
                    {t('attendance.markerTeacher')}:{' '}
                    {row.teacherMarkedAt ? t('attendance.markerDone') : t('attendance.markerPending')}
                  </span>
                  <span>
                    {t('attendance.markerAmir')}:{' '}
                    {row.adminMarkedAt ? t('attendance.markerDone') : t('attendance.markerPending')}
                  </span>
                </p>
                <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-dark/50">
                      <tr>
                        <th className="text-right p-2">P</th>
                        <th className="text-right p-2">A</th>
                        <th className="text-right p-2">L</th>
                        <th className="text-right p-2">E</th>
                        <th className="text-right p-2">{t('attendance.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-cream-dark">
                        <td className="text-right p-2">{row.present}</td>
                        <td className="text-right p-2">{row.absent}</td>
                        <td className="text-right p-2">{row.late}</td>
                        <td className="text-right p-2">{row.excused}</td>
                        <td className="text-right p-2">{row.totalStudents}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {todayEt !== date ? (
              <p className="text-xs text-muted-foreground">{t('attendance.overviewHistoricalNote')}</p>
            ) : null}
          </>
        )}
      </PageBody>
    </div>
  );
};
