import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { AttendanceDateLabel } from '../components/AttendanceDateLabel';
import { useMedresas } from '../../medresas/hooks/useMedresas';
import { useNetworkAttendanceOverview } from '../hooks/useAttendance';
import { getTodayCalendarEt } from '../utils/ethiopiaDate';

function subtractDaysIso(isoStart: string, days: number): string {
  const d = new Date(`${isoStart}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export const AdminAttendanceNetworkPage = () => {
  const { t } = useTranslation();
  const today = useMemo(() => getTodayCalendarEt(), []);
  const [from, setFrom] = useState(() => subtractDaysIso(today, 6));
  const [to, setTo] = useState(today);
  const [medresaFilter, setMedresaFilter] = useState('');
  const { medresas, isLoading: medLoading } = useMedresas({ enabled: true });
  const overview = useNetworkAttendanceOverview(from, to, medresaFilter || undefined);

  const activeMedresas = useMemo(
    () => medresas.filter((m) => m.status === 'ACTIVE').sort((a, b) => a.name.localeCompare(b.name)),
    [medresas]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('attendance.networkOverview')}
        subtitle={t('attendance.networkSubtitleEthiopian')}
      />
      <PageBody fullWidth className="max-w-none">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1 text-sm">
            {t('attendance.rangeFrom')}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-cream-dark rounded-md px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('attendance.rangeTo')}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-cream-dark rounded-md px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('courses.medresaPicker')}
            <select
              value={medresaFilter}
              onChange={(e) => setMedresaFilter(e.target.value)}
              className="border border-cream-dark rounded-md px-2 py-1 min-w-[200px]"
            >
              <option value="">{t('attendance.allMedresas')}</option>
              {activeMedresas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {medLoading ? (
          <p className="text-sm text-muted-foreground">{t('attendance.loading')}</p>
        ) : overview.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('attendance.loading')}</p>
        ) : (overview.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">{t('attendance.noOverviewRows')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/50">
                <tr>
                  <th className="text-left p-2">{t('attendance.date')}</th>
                  <th className="text-left p-2">{t('nav.medresas')}</th>
                  <th className="text-right p-2">P</th>
                  <th className="text-right p-2">A</th>
                  <th className="text-right p-2">L</th>
                  <th className="text-right p-2">E</th>
                  <th className="text-right p-2">{t('attendance.total')}</th>
                </tr>
              </thead>
              <tbody>
                {overview.data!.items.map((row, i) => (
                  <tr key={`${row.date}-${row.medresaId}-${i}`} className="border-t border-cream-dark">
                    <td className="p-2">
                      <AttendanceDateLabel ymd={row.date} />
                    </td>
                    <td className="p-2">{row.medresaName}</td>
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
      </PageBody>
    </div>
  );
};
