import { useMemo, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FilterTabs } from '../../../components/ui/FilterTabs';
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
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('courses.masterTitle')} subtitle={t('courses.loading')} />
        <PageBody>
          <div className="h-24 animate-pulse rounded-xl border border-cream-dark bg-surface" />
        </PageBody>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('courses.masterTitle')} subtitle="" />
        <PageBody>
          <p className="text-center text-danger-text">{t('courses.loadError')}</p>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <PageTopBar
        title={t('courses.masterTitle')}
        subtitle={t('courses.masterSubtitle', { count: activeCount })}
      />

      <PageBody>
        <div className="mb-3">
          <FilterTabs
            value={levelFilter}
            onChange={setLevelFilter}
            tabs={[
              { value: 'ALL', label: t('courses.filter.allLevels') },
              { value: 'BEGINNER', label: t('courses.level.beginner') },
              { value: 'INTERMEDIATE', label: t('courses.level.intermediate') },
              { value: 'ADVANCED', label: t('courses.level.advanced') },
            ]}
          />
        </div>
        <div className="mb-6">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            tabs={[
              { value: 'ALL', label: t('courses.filter.allStatus') },
              { value: 'ACTIVE', label: t('courses.status.active') },
              { value: 'INACTIVE', label: t('courses.status.inactive') },
            ]}
          />
        </div>

        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} title={t('courses.empty')} />
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border border-cream-dark bg-surface p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-teal-800">{getLocalizedValue(course.name)}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {getLocalizedValue(course.description)}
                    </p>
                    <p className="mt-1 text-xs text-teal-600">
                      {t(`courses.level.${course.level.toLowerCase()}`)} ·{' '}
                      {t('courses.usedBy', { count: course.usedByCount })}
                    </p>
                  </div>
                  <span
                    className={`h-fit text-[11px] font-medium uppercase ${
                      course.status === 'ACTIVE' ? 'text-success-text' : 'text-danger-text'
                    }`}
                  >
                    {t(`courses.status.${course.status.toLowerCase()}`)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCourse(course)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    {t('courses.edit')}
                  </button>
                  {course.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setDeactivateTarget(course)}
                      className="hover:opacity-90 flex-1 rounded-md bg-danger-text py-2 text-sm font-medium text-white"
                    >
                      {t('courses.deactivate')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal-400 text-white shadow-lg"
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
