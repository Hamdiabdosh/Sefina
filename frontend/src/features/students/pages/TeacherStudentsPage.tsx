import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronRight, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { TeacherMedresaPicker } from '../../courses/components/TeacherMedresaPicker';
import { useTeacherContext } from '../../courses/hooks/useTeacherContext';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { StudentAvatar } from '../components/StudentAvatar';
import { useTeacherStudents } from '../hooks/useTeacherStudents';

export const TeacherStudentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const {
    medresaId,
    medresaName,
    teacherMedresas,
    hasMultipleMedresas,
    hasTeacherMedresa,
    isAdminAtMedresa,
  } = useTeacherContext();

  const { data, isLoading, error } = useTeacherStudents(medresaId, hasTeacherMedresa);
  const students = data?.items ?? [];

  if (!hasTeacherMedresa) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.title')} subtitle={t('attendance.noTeacherMedresa')} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.title')} subtitle={t('students.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.title')} subtitle="" />
        <PageBody>
          <p className="text-center text-danger-text">{t('students.loadError')}</p>
        </PageBody>
      </div>
    );
  }

  const subtitle = isAdminAtMedresa
    ? hasMultipleMedresas
      ? t('students.amirSubtitleMedresa', { name: medresaName, count: students.length })
      : t('students.amirSubtitleCount', { count: students.length })
    : hasMultipleMedresas
      ? t('students.teacherSubtitleMedresa', { name: medresaName, count: students.length })
      : t('students.teacherSubtitleCount', { count: students.length });

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('students.title')} subtitle={subtitle} />
      <PageBody>
        <TeacherMedresaPicker
          medresas={teacherMedresas}
          selectedId={medresaId}
          routeTo="/teacher/students"
        />

        {students.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" aria-hidden />}
            title={t('students.teacherEmpty')}
            body={
              isAdminAtMedresa ? t('students.amirEmptyHint') : t('students.teacherEmptyHint')
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() =>
                  void navigate({
                    to: '/medresa/students/$studentId',
                    params: { studentId: student.id },
                    search: {
                      medresaId: search.medresaId ?? medresaId,
                      tab: undefined,
                    },
                  })
                }
                className="flex w-full items-center gap-3 rounded-xl border border-cream-dark bg-surface p-4 text-left"
              >
                <StudentAvatar
                  studentId={student.id}
                  name={student.fullName}
                  photoUrl={student.photoUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-teal-800">{student.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student.enrolledCourses
                      .map((c) => getLocalizedValue(c.courseName))
                      .join(', ') || t('students.noCourses')}
                  </p>
                </div>
                <ChevronRight className="shrink-0 text-muted-foreground" size={18} />
              </button>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
};
