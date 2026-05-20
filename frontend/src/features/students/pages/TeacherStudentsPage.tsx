import { useNavigate } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
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
      <div className="min-h-screen bg-cream">
        <PageHeader title={t('students.title')} subtitle={t('students.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center text-danger-text">
        {t('students.loadError')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-12">
      <PageHeader title={t('students.title')} subtitle={t('students.teacherSubtitle')} />
      <div className="p-4 pt-6">
        {students.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t('students.empty')}</p>
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
                className="bg-white rounded-xl border border-cream-dark p-4 flex items-center gap-3 text-left w-full"
              >
                <StudentAvatar
                  studentId={student.id}
                  name={student.fullName}
                  photoUrl={student.photoUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-teal-800 truncate">{student.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.enrolledCourses
                      .map((c) => getLocalizedValue(c.courseName))
                      .join(', ')}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground shrink-0" size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
