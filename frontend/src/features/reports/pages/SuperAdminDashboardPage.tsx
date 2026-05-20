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
import { Building2, Coins, GraduationCap, Users, Wallet } from 'lucide-react';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { StatCard } from '../../../components/ui/StatCard';
import { formatEthiopianMonthYear } from '../../../lib/ethiopian';
import { ChartCard } from '../components/ChartCard';
import { useSuperAdminDashboard } from '../hooks/useDashboard';

export const SuperAdminDashboardPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useSuperAdminDashboard();

  const feeLine =
    data?.feeTrend.map((f) => ({
      label: formatEthiopianMonthYear(f.month, f.year),
      collected: f.collectedEtb,
    })) ?? [];

  const enrollBars =
    data?.enrollmentPerMedresa.map((m) => ({
      name: m.medresaName.length > 12 ? `${m.medresaName.slice(0, 12)}…` : m.medresaName,
      students: m.studentCount,
    })) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('dashboard.title')} subtitle={t('dashboard.networkSubtitle')} />
      <PageBody fullWidth className="max-w-none space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
              <StatCard
                icon={Building2}
                value={data?.activeMedresas ?? 0}
                label={t('dashboard.activeMedresas')}
                hint={t('dashboard.inactiveCount', { count: data?.inactiveMedresas ?? 0 })}
              />
              <StatCard icon={GraduationCap} value={data?.totalTeachers ?? 0} label={t('nav.teachers')} />
              <StatCard icon={Users} value={data?.totalStudents ?? 0} label={t('nav.students')} />
              <StatCard
                icon={Coins}
                value={data?.networkFeesCollectedEtb ?? 0}
                label={t('dashboard.feesCollected')}
              />
              <StatCard
                icon={Coins}
                value={data?.networkOutstandingEtb ?? 0}
                label={t('dashboard.outstandingFees')}
                tone="amber"
              />
              <StatCard
                icon={Wallet}
                value={data?.salaryDisbursedThisMonthEtb ?? 0}
                label={t('dashboard.salaryDisbursed')}
              />
              <StatCard
                icon={Wallet}
                value={data?.unpaidTeachersThisMonth ?? 0}
                label={t('dashboard.unpaidTeachers')}
                tone="amber"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t('dashboard.networkFees')}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={feeLine}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="collected" stroke="#1D9E75" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title={t('dashboard.enrollmentByMedresa')}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enrollBars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="students" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/salaries"
                className="rounded-lg border border-cream-dark bg-surface px-4 py-2 text-sm font-medium text-teal-800 hover:bg-cream"
              >
                {t('dashboard.unpaidTeachers')}
              </Link>
              <Link
                to="/admin/fees"
                className="rounded-lg border border-cream-dark bg-surface px-4 py-2 text-sm font-medium text-teal-800 hover:bg-cream"
              >
                {t('dashboard.feeDefaulters')}
              </Link>
              <Link
                to="/admin/reports"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
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
