import { useMemo, useRef, useState } from 'react';
import { useFocusSearchShortcut } from '../../../hooks/useFocusSearchShortcut';
import { useSearch } from '@tanstack/react-router';
import { GraduationCap, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { ViewModeToggle } from '../../../components/ui/ViewModeToggle';
import { cn } from '../../../lib/utils';
import { TeacherListCard } from '../components/TeacherListCard';
import { CreateTeacherModal } from '../components/CreateTeacherModal';
import { useTeachers } from '../hooks/useTeachers';
import { getLocalizedValue } from '../utils/localizedJson';

export const TeachersPage = () => {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const searchInputRef = useRef<HTMLInputElement>(null);
  useFocusSearchShortcut(searchInputRef);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    medresaId: search.medresaId,
  };

  const { teachers, pagination, isLoading, error, createTeacher, uploadPhoto } =
    useTeachers(filters);

  const activeCount = useMemo(
    () => teachers.filter((x) => x.status === 'ACTIVE').length,
    [teachers]
  );

  const stats = useMemo(() => {
    const total = pagination?.total ?? teachers.length;
    const specLabels = teachers.map((x) => getLocalizedValue(x.specialization)).filter(Boolean);
    const uniqueSubjects = new Set(specLabels).size;
    const medresaIds = new Set<string>();
    teachers.forEach((x) => x.medresaAssignments.forEach((a) => medresaIds.add(a.medresaId)));
    const sumAssign = teachers.reduce((s, x) => s + x.medresaAssignments.length, 0);
    const avg = teachers.length ? Math.round((sumAssign / teachers.length) * 10) / 10 : 0;
    return {
      total,
      subjects: uniqueSubjects,
      medresas: medresaIds.size,
      avg,
    };
  }, [teachers, pagination?.total]);

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('nav.teachers')} subtitle={t('courses.loading')} />
        <PageBody>
          <SkeletonTable rows={5} />
        </PageBody>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('nav.teachers')} subtitle="" />
        <PageBody>
          <p className="text-center text-danger-text">Failed to load teachers.</p>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <PageTopBar
        title={t('nav.teachers')}
        subtitle={t('teacherDirectory.subtitle', { count: activeCount })}
        actions={
          <>
            <div className="relative hidden min-w-[140px] sm:block sm:min-w-[180px]">
              <input
                ref={searchInputRef}
                type="search"
                placeholder={t('teacherDirectory.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field-input h-10 py-2 pl-9 text-sm"
                aria-label={t('teacherDirectory.searchPlaceholder')}
              />
              <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-teal-200" />
            </div>
            <button type="button" className="btn-primary-inline" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              {t('teacherDirectory.addTeacher')}
            </button>
          </>
        }
      />

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-cream-dark bg-surface px-4 py-3.5 lg:grid-cols-4 lg:px-6">
        <div className="rounded-md bg-cream px-3 py-2.5">
          <p className="text-xl font-medium leading-none text-foreground">{stats.total}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('teacherDirectory.statsTotal')}</p>
        </div>
        <div className="rounded-md bg-cream px-3 py-2.5">
          <p className="text-xl font-medium leading-none text-foreground">{stats.subjects}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('teacherDirectory.statsSubjects')}</p>
        </div>
        <div className="rounded-md bg-cream px-3 py-2.5">
          <p className="text-xl font-medium leading-none text-foreground">{stats.medresas}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('teacherDirectory.statsMedresas')}</p>
        </div>
        <div className="col-span-2 rounded-md bg-cream px-3 py-2.5 lg:col-span-1">
          <p className="text-xl font-medium leading-none text-foreground">{stats.avg}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t('teacherDirectory.statsAvg')}</p>
        </div>
      </div>

      <PageBody>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            tabs={[
              { value: 'ALL', label: t('teacherDirectory.filterAll') },
              { value: 'ACTIVE', label: t('teacherDirectory.filterActive') },
              { value: 'INACTIVE', label: t('teacherDirectory.filterInactive') },
            ]}
          />
          <ViewModeToggle variant="list-grid" value={viewMode} onChange={setViewMode} />
        </div>

        <div className="mb-4 sm:hidden">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              placeholder={t('teacherDirectory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input h-12 pl-10"
              aria-label={t('teacherDirectory.searchPlaceholder')}
            />
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-teal-200" />
          </div>
        </div>

        {teachers.length === 0 ? (
          <EmptyState icon={GraduationCap} title={t('teacherDirectory.empty')} />
        ) : (
          <div
            className={cn(
              'gap-2',
              viewMode === 'list' ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-2'
            )}
          >
            {teachers.map((teacher) => (
              <TeacherListCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}
      </PageBody>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal-400 text-white shadow-lg md:right-8"
        aria-label={t('teacherDirectory.addTeacher')}
      >
        <Plus size={28} />
      </button>
      <CreateTeacherModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        createTeacher={createTeacher}
        uploadPhoto={uploadPhoto}
      />
    </div>
  );
};
