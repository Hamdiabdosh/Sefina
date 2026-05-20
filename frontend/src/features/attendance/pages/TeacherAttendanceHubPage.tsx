import { Link, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import { useMedresaCourses } from '../../courses/hooks/useMedresaCourses';
import type { MedresaCourseListItem } from '../../courses/types';
import { useTeacherMe } from '../../teachers/hooks/useTeachers';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';

export const TeacherAttendanceHubPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useCurrentUser();
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const teacherMedresaId = currentUser?.medresaRoles.find((r) => r.role === 'TEACHER')?.medresaId;
  const medresaId = search.medresaId ?? teacherMedresaId ?? '';
  const { data: me } = useTeacherMe(Boolean(currentUser?.isTeacher));
  const { courses, isLoading } = useMedresaCourses(medresaId, {
    status: 'ACTIVE',
    teacherId: me?.id,
  });

  const myCourses = useMemo(() => {
    if (!me?.id) return [];
    return courses.filter(
      (c: MedresaCourseListItem) => c.assignedTeacher?.id === me.id
    );
  }, [courses, me?.id]);

  if (!medresaId) {
    return (
      <div className="min-h-screen bg-cream p-4">
        <PageHeader title={t('attendance.title')} subtitle={t('attendance.noMedresa')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-12">
      <PageHeader title={t('attendance.title')} subtitle={t('attendance.teacherSubtitle')} />
      <div className="p-4 space-y-4">
        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <h2 className="text-sm font-medium text-teal-800 mb-3">{t('attendance.myCourses')}</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('attendance.loading')}</p>
          ) : myCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('attendance.noAssignedCourses')}</p>
          ) : (
            <ul className="space-y-2">
              {myCourses.map((c: MedresaCourseListItem) => (
                <li key={c.medresaCourseId}>
                  <Link
                    to="/teacher/attendance/$medresaCourseId"
                    params={{ medresaCourseId: c.medresaCourseId }}
                    search={{ medresaId }}
                    className="block p-3 rounded-lg border border-cream-dark hover:bg-teal-50"
                  >
                    <span className="font-medium text-teal-800">{getLocalizedValue(c.name)}</span>
                    <span className="text-xs text-muted-foreground block">
                      {t('attendance.studentsEnrolled', { count: c.studentCount })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
