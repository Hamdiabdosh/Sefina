import { useMemo, useRef, useState } from 'react';
import { useFocusSearchShortcut } from '../../../hooks/useFocusSearchShortcut';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { ViewModeToggle, type ListTableMode } from '../../../components/ui/ViewModeToggle';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/utils';
import { MedresaPicker } from '../../courses/components/MedresaPicker';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useMedresaCourses } from '../../courses/hooks/useMedresaCourses';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { EnrollStudentModal } from '../components/EnrollStudentModal';
import { StudentAvatar } from '../components/StudentAvatar';
import { useStudents } from '../hooks/useStudents';

export const MedresaStudentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    medresaId?: string;
    medresaCourseId?: string;
  };
  const {
    medresaId,
    medresaName,
    adminMedresas: pickerMedresas,
    hasMultipleMedresas: hasMultiple,
    medresaScopeLoading,
  } = useMedresaContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED'
  >('ALL');
  const [courseFilter, setCourseFilter] = useState(search.medresaCourseId ?? '');
  const [showEnroll, setShowEnroll] = useState(false);
  const [viewMode, setViewMode] = useState<ListTableMode>('list');
  const searchInputRef = useRef<HTMLInputElement>(null);
  useFocusSearchShortcut(searchInputRef);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    medresaCourseId: courseFilter || undefined,
  };

  const { students, isLoading, error, createStudent } = useStudents(medresaId, filters);
  const { courses } = useMedresaCourses(medresaId, { status: 'ACTIVE' }, {
    withAvailable: false,
    withTeachers: false,
  });

  const activeCount = useMemo(
    () => students.filter((s) => s.status === 'ACTIVE').length,
    [students]
  );

  if (medresaScopeLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.title')} subtitle={t('students.loading')} />
        <PageBody>
          <SkeletonTable rows={5} />
        </PageBody>
      </div>
    );
  }

  if (!medresaId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.title')} subtitle="" />
        <PageBody>
          <p className="text-center text-muted-foreground">{t('students.noMedresaAccess')}</p>
        </PageBody>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.title')} subtitle={t('students.loading')} />
        <PageBody>
          <SkeletonTable rows={5} />
        </PageBody>
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
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <PageTopBar
        title={t('students.title')}
        subtitle={t('students.subtitle', { name: medresaName, count: activeCount })}
        actions={
          <>
            <div className="relative hidden min-w-[120px] sm:block sm:min-w-[160px]">
              <input
                ref={searchInputRef}
                type="search"
                placeholder={t('students.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field-input h-10 py-2 pl-9 text-sm"
                aria-label={t('students.searchPlaceholder')}
              />
              <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-teal-200" />
            </div>
            <button type="button" className="btn-primary-inline hidden sm:inline-flex" onClick={() => setShowEnroll(true)}>
              <Plus size={16} />
              {t('students.enroll')}
            </button>
          </>
        }
      />

      <PageBody>
        {hasMultiple && (
          <div className="mb-4">
            <MedresaPicker medresas={pickerMedresas} selectedId={medresaId} />
          </div>
        )}

        <div className="mb-4 sm:hidden">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              placeholder={t('students.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input h-12 pl-10"
              aria-label={t('students.searchPlaceholder')}
            />
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-teal-200" />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            tabs={[
              { value: 'ALL', label: t('students.filter.all') },
              { value: 'ACTIVE', label: t('students.status.active') },
              { value: 'TRANSFERRED', label: t('students.status.transferred') },
              { value: 'WITHDRAWN', label: t('students.status.withdrawn') },
              { value: 'GRADUATED', label: t('students.status.graduated') },
            ]}
          />
          <ViewModeToggle variant="list-table" value={viewMode} onChange={setViewMode} />
        </div>

        {courses.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setCourseFilter('')}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                !courseFilter ? 'border-teal-100 bg-teal-50 text-teal-600' : 'text-muted-foreground'
              }`}
            >
              {t('students.filter.allCourses')}
            </button>
            {courses.map((c) => (
              <button
                key={c.medresaCourseId}
                type="button"
                onClick={() => setCourseFilter(c.medresaCourseId)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                  courseFilter === c.medresaCourseId
                    ? 'border-teal-100 bg-teal-50 text-teal-600'
                    : 'text-muted-foreground'
                }`}
              >
                {getLocalizedValue(c.name)}
              </button>
            ))}
          </div>
        )}

        {students.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{t('students.empty')}</p>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border border-cream-dark bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/80 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-1.5 sm:px-3">{t('students.colName')}</th>
                  <th className="hidden px-2 py-1.5 md:table-cell md:px-3">{t('students.colCourses')}</th>
                  <th className="hidden px-2 py-1.5 lg:table-cell lg:px-3">{t('students.guardian')}</th>
                  <th className="px-2 py-1.5 sm:px-3">{t('students.colStatus')}</th>
                  <th className="w-8 px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="cursor-pointer border-b border-cream-dark/60 last:border-0 hover:bg-cream/50"
                    onClick={() =>
                      void navigate({
                        to: '/medresa/students/$studentId',
                        params: { studentId: student.id },
                        search: { medresaId, tab: undefined },
                      })
                    }
                  >
                    <td className="px-2 py-1.5 sm:px-3">
                      <div className="flex items-center gap-2">
                        <StudentAvatar
                          studentId={student.id}
                          name={student.fullName}
                          photoUrl={student.photoUrl}
                          size="sm"
                        />
                        <span className="font-medium text-teal-800">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-2 py-1.5 text-muted-foreground md:table-cell md:px-3">
                      {student.enrolledCourses
                        .map((c) => getLocalizedValue(c.courseName))
                        .join(', ') || t('students.noCourses')}
                    </td>
                    <td className="hidden truncate px-2 py-1.5 text-muted-foreground lg:table-cell lg:px-3">
                      {student.guardianName}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-[10px]',
                          student.status === 'ACTIVE'
                            ? 'bg-teal-50 text-teal-600'
                            : 'bg-cream-dark text-muted-foreground'
                        )}
                      >
                        {t(`students.status.${student.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    search: { medresaId, tab: undefined },
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
                  <p className="text-xs text-muted-foreground">{student.guardianName}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    student.status === 'ACTIVE'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-cream-dark text-muted-foreground'
                  }`}
                >
                  {t(`students.status.${student.status.toLowerCase()}`)}
                </span>
                <ChevronRight className="shrink-0 text-muted-foreground" size={18} />
              </button>
            ))}
          </div>
        )}
      </PageBody>

      <button
        type="button"
        onClick={() => setShowEnroll(true)}
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-white shadow-lg sm:hidden"
      >
        <Plus size={20} />
        {t('students.enroll')}
      </button>
      <EnrollStudentModal
        open={showEnroll}
        onClose={() => setShowEnroll(false)}
        createStudent={createStudent}
      />
    </div>
  );
};
