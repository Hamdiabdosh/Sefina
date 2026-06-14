import { BookOpen } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useNotifications } from '../../notifications/useNotifications';
import { DashboardAlertCards } from './DashboardAlertCards';

export type MedresaDashboardAlertsProps = {
  medresaId: string;
  outstandingFeesEtb: number;
  attendanceIncomplete: boolean;
};

export const MedresaDashboardAlerts = ({
  medresaId,
  outstandingFeesEtb,
  attendanceIncomplete,
}: MedresaDashboardAlertsProps) => {
  const { pendingGradeEdits } = useNotifications(Boolean(medresaId));

  return (
    <DashboardAlertCards
      medresaId={medresaId}
      pendingGradeEdits={pendingGradeEdits}
      outstandingFeesEtb={outstandingFeesEtb}
      attendanceIncomplete={attendanceIncomplete}
    />
  );
};

type MedresaDashboardCoursesProps = {
  medresaId: string;
  courseStats: Array<{
    medresaCourseId: string;
    courseName: string;
    studentCount: number;
    todayAttendanceRatePercent: number | null;
    averageGradePercent: number | null;
  }>;
};

export const MedresaDashboardCoursesSection = ({
  medresaId,
  courseStats,
}: MedresaDashboardCoursesProps) => {
  const { t } = useTranslation();

  if (courseStats.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t('dashboard.coursesEmptyTitle')}
        body={t('dashboard.coursesEmptyBody')}
        action={
          <Link to="/medresa/courses" search={{ medresaId }} className="btn-primary-inline">
            {t('nav.courses')}
          </Link>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-teal-800">{t('nav.courses')}</h2>
      <div className="overflow-x-auto rounded-xl border border-cream-dark bg-surface">
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
            {courseStats.map((c) => (
              <tr key={c.medresaCourseId} className="border-t border-cream-dark/60">
                <td className="p-2">
                  <Link
                    to="/medresa/courses/$medresaCourseId"
                    params={{ medresaCourseId: c.medresaCourseId }}
                    search={{ medresaId, tab: 'overview' }}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {c.courseName}
                  </Link>
                </td>
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
    </section>
  );
};
