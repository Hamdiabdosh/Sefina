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
import { BookOpen, CalendarDays, ClipboardList, Users } from 'lucide-react';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { StatCard } from '../../../components/ui/StatCard';
import { ChartCard } from '../components/ChartCard';
import { SkeletonCard, SkeletonStatGrid } from '../../../components/ui/Skeleton';
import { formatEthiopianDayMonth } from '../../../lib/ethiopian';
import { useTeacherDashboard } from '../hooks/useDashboard';

export const TeacherDashboardContent = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useTeacherDashboard();

  const attData =
    data?.attendanceTrend.map((d) => ({
      label: formatEthiopianDayMonth(d.date, t),
      rate: d.ratePercent ?? 0,
    })) ?? [];

  const gradeBars =
    data?.gradeDistribution.flatMap((c) =>
      Object.entries(c.distribution).map(([letter, count]) => ({
        course: c.courseName,
        letter,
        count,
      }))
    ) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('dashboard.title')} subtitle={t('dashboard.teacherSubtitle')} />
      <PageBody fullWidth className="max-w-none space-y-4">
        {isLoading ? (
          <>
            <SkeletonStatGrid cols={4} />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                icon={Users}
                value={data?.totalStudents ?? 0}
                label={t('dashboard.myStudents')}
                hint={t('dashboard.coursesCount', { count: data?.activeCourses ?? 0 })}
              />
              <StatCard
                icon={CalendarDays}
                value={
                  data?.todayAttendanceRatePercent != null
                    ? `${data.todayAttendanceRatePercent}%`
                    : '—'
                }
                label={t('dashboard.todayAttendance')}
                tone="teal"
              />
              <StatCard
                icon={ClipboardList}
                value={data?.pendingGradeEntries ?? 0}
                label={t('dashboard.gradesDue')}
                tone="amber"
              />
              <StatCard
                icon={BookOpen}
                value={data?.activeCourses ?? 0}
                label={t('dashboard.activeCourses')}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t('dashboard.attendanceTrend')}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="#1D9E75" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              {gradeBars.length > 0 ? (
                <ChartCard title={t('dashboard.gradeDistribution')}>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeBars}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                        <XAxis dataKey="letter" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/teacher/attendance/take"
                search={{ medresaId: undefined }}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                {t('dashboard.takeAttendance')}
              </Link>
              <Link
                to="/teacher/grades/entry"
                search={{ medresaCourseId: undefined, examTypeId: undefined }}
                className="rounded-lg border border-cream-dark bg-surface px-4 py-2 text-sm font-medium text-teal-800 hover:bg-cream"
              >
                {t('dashboard.enterGrades')}
              </Link>
              <Link
                to="/teacher/reports"
                search={{}}
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
