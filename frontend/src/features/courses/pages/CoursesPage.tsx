import { useMemo, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
import { CreateCourseModal } from '../components/CreateCourseModal';
import { DeactivateCourseDialog } from '../components/DeactivateCourseDialog';
import { EditCourseModal } from '../components/EditCourseModal';
import { useCourses } from '../hooks/useCourses';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import type { CourseListItem } from '../types';

export const CoursesPage = () => {
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(
    'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CourseListItem | null>(null);

  const filters = {
    level: levelFilter === 'ALL' ? undefined : levelFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 50,
  };

  const { courses, isLoading, error, createCourse, updateCourse, deactivateCourse } =
    useCourses(filters);

  const activeCount = useMemo(
    () => courses.filter((c) => c.status === 'ACTIVE').length,
    [courses]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title={t('courses.masterTitle')} subtitle={t('courses.loading')} />
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
        title={t('courses.masterTitle')}
        subtitle={t('courses.masterSubtitle', { count: activeCount })}
      />
      <div className="p-4 pt-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setLevelFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                levelFilter === f
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : 'text-muted-foreground border-transparent'
              }`}
            >
              {f === 'ALL' ? t('courses.filter.allLevels') : t(`courses.level.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border ${
                statusFilter === f
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : 'text-muted-foreground border-transparent'
              }`}
            >
              {f === 'ALL'
                ? t('courses.filter.allStatus')
                : t(`courses.status.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>
        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t('courses.empty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-cream-dark p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-teal-800">
                      {getLocalizedValue(course.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getLocalizedValue(course.description)}
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      {t(`courses.level.${course.level.toLowerCase()}`)} ·{' '}
                      {t('courses.usedBy', { count: course.usedByCount })}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium uppercase h-fit ${
                      course.status === 'ACTIVE' ? 'text-success-text' : 'text-danger-text'
                    }`}
                  >
                    {t(`courses.status.${course.status.toLowerCase()}`)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setEditCourse(course)}
                    className="btn-secondary text-sm flex-1"
                  >
                    {t('courses.edit')}
                  </button>
                  {course.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setDeactivateTarget(course)}
                      className="flex-1 text-sm text-white rounded-md py-2 bg-danger-text hover:opacity-90 font-medium"
                    >
                      {t('courses.deactivate')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-teal-400 rounded-full shadow-lg flex items-center justify-center text-white z-20"
        aria-label={t('courses.createTitle')}
      >
        <Plus size={28} />
      </button>
      <CreateCourseModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        createCourse={createCourse}
      />
      <EditCourseModal
        open={Boolean(editCourse)}
        course={editCourse}
        onClose={() => setEditCourse(null)}
        updateCourse={updateCourse}
      />
      <DeactivateCourseDialog
        course={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        deactivateCourse={deactivateCourse}
      />
    </div>
  );
};
