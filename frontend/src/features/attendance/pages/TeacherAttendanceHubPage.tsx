import { Link, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';

export const TeacherAttendanceHubPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useCurrentUser();
  const search = useSearch({ strict: false }) as { medresaId?: string };

  const teacherMedresas = useMemo(() => {
    return (currentUser?.medresaRoles ?? []).filter((r) => r.role === 'TEACHER');
  }, [currentUser?.medresaRoles]);

  const scoped = useMemo(() => {
    if (search.medresaId) {
      return teacherMedresas.filter((m) => m.medresaId === search.medresaId);
    }
    return teacherMedresas;
  }, [teacherMedresas, search.medresaId]);

  if (teacherMedresas.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('attendance.title')} subtitle={t('attendance.noTeacherMedresa')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('attendance.title')} subtitle={t('attendance.teacherSubtitleDaily')} />
      <PageBody>
        <section className="rounded-xl border border-cream-dark bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-teal-800">{t('attendance.myMedresas')}</h2>
          <ul className="space-y-2">
            {scoped.map((m) => (
              <li key={m.medresaId}>
                <Link
                  to="/teacher/attendance/take"
                  search={{ medresaId: m.medresaId }}
                  className="block rounded-lg border border-cream-dark p-3 hover:bg-teal-50"
                >
                  <span className="font-medium text-teal-800">{m.medresaName}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t('attendance.takeDailyRoll')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageBody>
    </div>
  );
};
