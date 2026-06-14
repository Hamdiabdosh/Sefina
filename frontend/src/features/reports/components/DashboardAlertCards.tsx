import { Link } from '@tanstack/react-router';
import { AlertTriangle, CalendarDays, ClipboardList, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageSectionHeader } from '../../../components/layout/PageSectionHeader';
import { ContentCard } from '../../../components/ui/ContentCard';

type DashboardAlertCardsProps = {
  medresaId: string;
  pendingGradeEdits: number;
  outstandingFeesEtb: number;
  attendanceIncomplete: boolean;
};

export const DashboardAlertCards = ({
  medresaId,
  pendingGradeEdits,
  outstandingFeesEtb,
  attendanceIncomplete,
}: DashboardAlertCardsProps) => {
  const { t } = useTranslation();

  const alerts = [
    pendingGradeEdits > 0
      ? {
          key: 'grades',
          icon: ClipboardList,
          title: t('dashboard.alertGradeEdits', { count: pendingGradeEdits }),
          hint: t('dashboard.alertGradeEditsHint'),
          to: '/medresa/grade-edits' as const,
          search: { medresaId },
          tone: 'amber' as const,
        }
      : null,
    outstandingFeesEtb > 0
      ? {
          key: 'fees',
          icon: Coins,
          title: t('dashboard.alertOutstandingFees', { amount: outstandingFeesEtb }),
          hint: t('dashboard.alertOutstandingFeesHint'),
          to: '/medresa/fees' as const,
          search: { medresaId, status: 'UNPAID' as const },
          tone: 'danger' as const,
        }
      : null,
    attendanceIncomplete
      ? {
          key: 'attendance',
          icon: CalendarDays,
          title: t('dashboard.alertAttendanceIncomplete'),
          hint: t('dashboard.alertAttendanceIncompleteHint'),
          to: '/medresa/attendance/take' as const,
          search: { medresaId },
          tone: 'info' as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof ClipboardList;
    title: string;
    hint: string;
    to: string;
    search: Record<string, string>;
    tone: 'amber' | 'danger' | 'info';
  }>;

  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3">
      <PageSectionHeader title={t('dashboard.alertsTitle')} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <Link key={alert.key} to={alert.to} search={alert.search}>
              <ContentCard className="h-full border-l-4 border-l-teal-400 p-4 hover:bg-cream/40">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-teal-900">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{alert.hint}</p>
                  </div>
                  <AlertTriangle className="ml-auto h-4 w-4 shrink-0 text-gold-400 opacity-0" aria-hidden />
                </div>
              </ContentCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
