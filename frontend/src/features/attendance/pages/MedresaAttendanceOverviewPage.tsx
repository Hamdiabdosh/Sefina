import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { DataTable } from '../../../components/ui/DataTable';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { AttendanceDualDateLine } from '../components/AttendanceDateLabel';
import { AttendanceMarkerStrip } from '../components/AttendanceMarkerStrip';
import { getCurrentEthiopianMonthYear, getTodayCalendarEt } from '../utils/ethiopian';
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
  const ethToday = getCurrentEthiopianMonthYear();

  if (medresaScopeLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('attendance.medresaOverview')} subtitle={t('attendance.loading')} />
        <PageBody>
          <SkeletonTable rows={5} />
        </PageBody>
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
              {t('attendance.openTakeAttendanceAmir')}
            </Link>
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-sm">
                <span>{t('attendance.date')}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-cream-dark rounded-md px-2 py-1 max-w-xs"
                />
              </label>
              <AttendanceDualDateLine ymd={date} />
              <button
                type="button"
                onClick={() => setDate(todayEt)}
                className="text-left text-xs text-teal-700 underline w-fit"
              >
                {t('attendance.jumpToday')}
              </button>
              <p className="text-xs text-muted-foreground">
                {t('attendance.ethiopianMonthHint', {
                  month: ethToday.month,
                  year: ethToday.year,
                })}
              </p>
            </div>
            {overview.isLoading ? (
              <SkeletonTable rows={5} />
            ) : !row ? (
              <p className="text-sm text-muted-foreground">{t('attendance.noOverviewRows')}</p>
            ) : (
              <>
                <AttendanceMarkerStrip
                  teacherMarkedAt={row.teacherMarkedAt}
                  adminMarkedAt={row.adminMarkedAt}
                />
                <DataTable>
                  <div className="overflow-x-auto">
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
                </DataTable>
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
