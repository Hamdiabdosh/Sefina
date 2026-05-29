import { useTranslation } from 'react-i18next';
import { ContentCard } from '../../../../components/ui/ContentCard';
import { AttendanceDateLabel } from '../../../attendance/components/AttendanceDateLabel';
import { useStudentAttendance } from '../../../attendance/hooks/useAttendance';
import type { AttendanceStatus } from '../../../attendance/types';

type Props = {
  studentId: string;
};

const statusClass = (status: AttendanceStatus) => {
  switch (status) {
    case 'PRESENT':
      return 'bg-teal-50 text-teal-800';
    case 'ABSENT':
      return 'bg-[#FCEBEB] text-danger-text';
    case 'LATE':
      return 'bg-gold-50 text-[#8a6914]';
    case 'EXCUSED':
      return 'bg-info-bg text-info-text';
    default:
      return 'bg-cream-dark text-muted-foreground';
  }
};

export const StudentAttendanceTab = ({ studentId }: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useStudentAttendance(studentId, Boolean(studentId));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('attendance.loading')}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">{t('students.hub.noAttendance')}</p>;
  }

  if (data.totalSessions === 0) {
    return <p className="text-sm text-muted-foreground">{t('students.hub.noAttendance')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ContentCard className="p-3">
          <p className="text-xs text-muted-foreground">{t('students.hub.attendanceRate')}</p>
          <p className="text-lg font-medium text-teal-800">{data.attendanceRatePct}%</p>
        </ContentCard>
        <ContentCard className="p-3">
          <p className="text-xs text-muted-foreground">{t('students.hub.sessions')}</p>
          <p className="text-lg font-medium text-foreground">{data.totalSessions}</p>
        </ContentCard>
        <ContentCard className="p-3">
          <p className="text-xs text-muted-foreground">{t('students.hub.presentCount')}</p>
          <p className="text-lg font-medium text-teal-800">{data.countedAsPresent}</p>
        </ContentCard>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          {t('attendance.status.absent')}: {data.absent}
        </span>
        <span>
          {t('attendance.status.late')}: {data.late}
        </span>
        <span>
          {t('attendance.status.excused')}: {data.excused}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-cream-dark bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-dark text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">{t('attendance.date')}</th>
              <th className="p-3">{t('students.hub.status')}</th>
              <th className="p-3">{t('attendance.notePlaceholder')}</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => (
              <tr key={`${entry.date}-${entry.medresaId}`} className="border-b border-cream-dark/60">
                <td className="p-3">
                  <AttendanceDateLabel ymd={entry.date} />
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusClass(entry.status)}`}
                  >
                    {t(`attendance.status.${entry.status.toLowerCase()}`)}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{entry.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
