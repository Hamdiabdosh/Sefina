import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
import { AssignTeacherModal } from '../components/AssignTeacherModal';
import { useMedresaContext } from '../hooks/useMedresaContext';
import { useMedresaCourseDetail, useMedresaCourses } from '../hooks/useMedresaCourses';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useState } from 'react';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';

export const MedresaCourseDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { medresaCourseId } = useParams({ strict: false }) as { medresaCourseId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const { currentUser } = useCurrentUser();
  const { medresaId: contextMedresaId, adminMedresas } = useMedresaContext();
  const teacherMedresaId = currentUser?.medresaRoles.find((r) => r.role === 'TEACHER')?.medresaId;
  const medresaId = search.medresaId ?? contextMedresaId ?? teacherMedresaId ?? '';
  const [showAssign, setShowAssign] = useState(false);

  const { data: course, isLoading, error } = useMedresaCourseDetail(medresaId, medresaCourseId);
  const { teachers, assignTeacher } = useMedresaCourses(medresaId);

  const isMedresaAdmin =
    currentUser?.isSuperAdmin ||
    adminMedresas.some((m) => m.medresaId === medresaId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title={t('courses.detailTitle')} subtitle={t('courses.loading')} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center text-danger-text">
        {t('courses.loadError')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-12">
      <PageHeader
        title={getLocalizedValue(course.name)}
        subtitle={course.medresaName}
        onBack={() =>
          void navigate({ to: '/medresa/courses', search: { medresaId } })
        }
      />
      <div className="p-4 space-y-4">
        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <p className="text-sm text-muted-foreground">{getLocalizedValue(course.description)}</p>
          <p className="text-sm text-teal-600 mt-2">
            {t(`courses.level.${course.level.toLowerCase()}`)} ·{' '}
            {t(`courses.status.${course.status.toLowerCase()}`)}
          </p>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-2">
            {t('courses.assignedTeacher')}
          </h2>
          {course.assignedTeacher ? (
            <p className="font-medium text-teal-800">{course.assignedTeacher.fullName}</p>
          ) : (
            <p className="text-amber-700 text-sm">{t('courses.noTeacher')}</p>
          )}
          {isMedresaAdmin && course.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setShowAssign(true)}
              className="btn-secondary text-sm mt-3 w-full"
            >
              {course.assignedTeacher ? t('courses.changeTeacher') : t('courses.assignTeacher')}
            </button>
          )}
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-2">
            {t('courses.enrolledStudents')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('courses.studentCount', { count: course.studentCount })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{t('courses.m05Placeholder')}</p>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4 opacity-60">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-1">
            {t('courses.attendancePlaceholder')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('courses.comingM06')}</p>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4 opacity-60">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-1">
            {t('courses.gradesPlaceholder')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('courses.comingM07')}</p>
        </section>

        <Link
          to="/medresa/courses"
          search={{ medresaId }}
          className="text-sm text-teal-600 underline"
        >
          {t('courses.backToList')}
        </Link>
      </div>

      {isMedresaAdmin && (
        <AssignTeacherModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          course={course}
          teachers={teachers}
          assignTeacher={assignTeacher}
        />
      )}
    </div>
  );
};
