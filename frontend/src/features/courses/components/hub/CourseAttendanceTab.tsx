import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { getTodayCalendarEt } from '../../../attendance/utils/ethiopiaDate';
import type { MedresaCourseDetail } from '../../types';

type Props = {
  course: MedresaCourseDetail;
  medresaId: string;
  isMedresaAdmin: boolean;
  canTakeAttendance: boolean;
};

export const CourseAttendanceTab = ({
  course,
  medresaId,
  isMedresaAdmin,
  canTakeAttendance,
}: Props) => {
  const { t } = useTranslation();
  const todayEt = getTodayCalendarEt();

  return (
    <section className="space-y-3 rounded-xl border border-cream-dark bg-surface p-4">
      <p className="text-sm text-muted-foreground">{t('courses.attendancePlaceholder')}</p>
      <div className="flex flex-col gap-2 text-sm">
        {canTakeAttendance ? (
          <Link
            to="/teacher/attendance/take"
            search={{ medresaId }}
            className="text-teal-600 underline"
          >
            {t('attendance.openTakeAttendance')}
          </Link>
        ) : null}
        {isMedresaAdmin ? (
          <Link
            to="/medresa/attendance/take"
            search={{ medresaId }}
            className="text-teal-600 underline"
          >
            {t('attendance.openTakeAttendanceAmir')}
          </Link>
        ) : null}
        {isMedresaAdmin ? (
          <Link
            to="/medresa/attendance"
            search={{ medresaId, date: todayEt }}
            className="text-teal-600 underline"
          >
            {t('attendance.openMedresaOverview')}
          </Link>
        ) : null}
        {!canTakeAttendance && !isMedresaAdmin ? (
          <p className="text-xs text-muted-foreground">{t('courses.attendanceReadOnlyHint')}</p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {t('courses.studentCount', { count: course.studentCount })}
      </p>
    </section>
  );
};
