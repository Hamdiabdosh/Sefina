import { useNavigate } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { StudentAvatar } from '../components/StudentAvatar';
import { useTeacherStudents } from '../hooks/useTeacherStudents';

export const TeacherStudentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useTeacherStudents();
  const students = data?.items ?? [];

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

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('students.title')} subtitle={t('students.teacherSubtitle')} />
      <PageBody>
        {students.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{t('students.empty')}</p>
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
                    search: { medresaId: undefined },
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
                    {student.enrolledCourses.map((c) => getLocalizedValue(c.courseName)).join(', ')}
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
