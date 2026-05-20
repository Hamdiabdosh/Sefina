import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, CalendarDays, Coins, Users } from 'lucide-react';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { StatCard } from '../../../components/ui/StatCard';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { formatEthiopianMonthYear } from '../../../lib/ethiopian';
import { ChartCard } from '../components/ChartCard';
import { useMedresaDashboard } from '../hooks/useDashboard';

export const MedresaDashboardContent = () => {
  const { t } = useTranslation();
  const { medresaId, medresaName, hasMultipleMedresas } = useMedresaContext();
  const { data, isLoading } = useMedresaDashboard(medresaId, Boolean(medresaId));

  const feeChart =
    data?.feeTrend.map((f) => ({
      label: formatEthiopianMonthYear(f.month, f.year),
      collected: f.collectedEtb,
      outstanding: f.outstandingEtb,
    })) ?? [];

  const enrollChart =
    data?.enrollmentTrend.map((e) => ({
      label: formatEthiopianMonthYear(e.month, e.year),
      count: e.count,
    })) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={t('dashboard.title')}
        subtitle={medresaName || t('dashboard.medresaSubtitle')}
      />
      <PageBody fullWidth className="max-w-none space-y-4">
        {hasMultipleMedresas ? (
          <p className="text-xs text-muted-foreground">
            {t('dashboard.switchMedresaHint')}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard icon={Users} value={data?.totalStudents ?? 0} label={t('dashboard.enrolledStudents')} />
              <StatCard icon={BookOpen} value={data?.activeCourses ?? 0} label={t('dashboard.activeCourses')} />
              <StatCard
                icon={CalendarDays}
                value={
                  data?.todayAttendanceRatePercent != null
                    ? `${data.todayAttendanceRatePercent}%`
                    : '—'
                }
                label={t('dashboard.todayAttendance')}
              />
              <StatCard
                icon={Coins}
                value={data?.outstandingFeesEtb ?? 0}
                label={t('dashboard.outstandingFees')}
                hint={`${t('dashboard.collected')}: ${data?.feesCollectedEtb ?? 0} ETB`}
                tone="amber"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t('dashboard.feeTrend')}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="collected" fill="#1D9E75" name={t('dashboard.collected')} />
                      <Bar dataKey="outstanding" fill="#EF9F27" name={t('dashboard.outstanding')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title={t('dashboard.enrollmentTrend')}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#1D9E75" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {(data?.courseStats.length ?? 0) > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-cream-dark/50">
                    <tr>
                      <th className="p-2 text-left">{t('dashboard.course')}</th>
                      <th className="p-2 text-right">{t('dashboard.students')}</th>
                      <th className="p-2 text-right">{t('dashboard.attendance')}</th>
                      <th className="p-2 text-right">{t('dashboard.avgGrade')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.courseStats.map((c) => (
                      <tr key={c.medresaCourseId} className="border-t border-cream-dark/60">
                        <td className="p-2">{c.courseName}</td>
                        <td className="p-2 text-right">{c.studentCount}</td>
                        <td className="p-2 text-right">
                          {c.todayAttendanceRatePercent != null
                            ? `${c.todayAttendanceRatePercent}%`
                            : '—'}
                        </td>
                        <td className="p-2 text-right">
                          {c.averageGradePercent != null ? `${c.averageGradePercent}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Link
                to="/medresa/fees"
                search={{ medresaId }}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                {t('dashboard.recordPayment')}
              </Link>
              <Link
                to="/medresa/reports"
                search={{ medresaId }}
                className="rounded-lg border border-cream-dark bg-surface px-4 py-2 text-sm font-medium text-teal-800 hover:bg-cream"
              >
                {t('dashboard.viewReports')}
              </Link>
            </div>
          </>
        )}
      </PageBody>
    </div>
  );
};
