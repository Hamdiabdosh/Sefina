import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
import { ActivateCourseModal } from '../components/ActivateCourseModal';
import { AssignTeacherModal } from '../components/AssignTeacherModal';
import { MedresaPicker } from '../components/MedresaPicker';
import { useMedresaContext } from '../hooks/useMedresaContext';
import { useMedresaCourses } from '../hooks/useMedresaCourses';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import type { MedresaCourseListItem } from '../types';

export const MedresaCoursesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { medresaId, medresaName, adminMedresas, hasMultipleMedresas } = useMedresaContext();
  const [showActivate, setShowActivate] = useState(false);
  const [assignCourse, setAssignCourse] = useState<MedresaCourseListItem | null>(null);

  const {
    courses,
    availableCourses,
    teachers,
    isLoading,
    error,
    activateCourse,
    assignTeacher,
  } = useMedresaCourses(medresaId);

  const activeCount = courses.filter((c) => c.status === 'ACTIVE').length;

  if (!medresaId) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center text-muted-foreground">
        {t('courses.noMedresaAccess')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title={t('courses.medresaTitle')} subtitle={t('courses.loading')} />
        <div className="p-4">
          <div className="h-24 bg-white rounded-xl animate-pulse border border-cream-dark" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center text-danger-text">
        {t('courses.loadError')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader
        title={t('courses.medresaTitle')}
        subtitle={t('courses.medresaSubtitle', { name: medresaName, count: activeCount })}
      />
      <div className="p-4 pt-6 space-y-4">
        {hasMultipleMedresas && (
          <MedresaPicker medresas={adminMedresas} selectedId={medresaId} />
        )}
        <button
          type="button"
          onClick={() => setShowActivate(true)}
          className="btn-secondary w-full"
        >
          {t('courses.activateCourse')}
        </button>
        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t('courses.medresaEmpty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => (
              <div
                key={course.medresaCourseId}
                className="bg-white rounded-xl border border-cream-dark p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: '/medresa/courses/$medresaCourseId',
                      params: { medresaCourseId: course.medresaCourseId },
                      search: { medresaId },
                    })
                  }
                  className="w-full text-left flex gap-3 items-start"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-teal-800">
                      {getLocalizedValue(course.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`courses.level.${course.level.toLowerCase()}`)}
                    </p>
                    {course.assignedTeacher ? (
                      <p className="text-xs text-teal-600 mt-1">
                        {course.assignedTeacher.fullName}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700 mt-1">{t('courses.noTeacher')}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('courses.studentCount', { count: course.studentCount })}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground shrink-0 mt-1" size={18} />
                </button>
                {!course.assignedTeacher && course.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setAssignCourse(course)}
                    className="btn-primary text-sm w-full mt-3"
                  >
                    {t('courses.assignTeacher')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ActivateCourseModal
        open={showActivate}
        onClose={() => setShowActivate(false)}
        availableCourses={availableCourses}
        activateCourse={activateCourse}
      />
      <AssignTeacherModal
        open={Boolean(assignCourse)}
        onClose={() => setAssignCourse(null)}
        course={assignCourse}
        teachers={teachers}
        assignTeacher={assignTeacher}
      />
    </div>
  );
};
