import { useMemo, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRANSFERRED'>('ALL');
  const [courseFilter, setCourseFilter] = useState(search.medresaCourseId ?? '');
  const [showEnroll, setShowEnroll] = useState(false);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    medresaCourseId: courseFilter || undefined,
  };

  const { students, isLoading, error, createStudent } = useStudents(medresaId, filters);
  const { courses } = useMedresaCourses(medresaId, { status: 'ACTIVE' });

  const activeCount = useMemo(
    () => students.filter((s) => s.status === 'ACTIVE').length,
    [students]
  );

  if (medresaScopeLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title={t('students.title')} subtitle={t('students.loading')} />
      </div>
    );
  }

  if (!medresaId) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center text-muted-foreground">
        {t('students.noMedresaAccess')}
      </div>
    );
  }

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
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader
        title={t('students.title')}
        subtitle={t('students.subtitle', { name: medresaName, count: activeCount })}
      />
      <div className="p-4 pt-6 space-y-4">
        {hasMultiple && (
          <MedresaPicker medresas={pickerMedresas} selectedId={medresaId} />
        )}
        <div className="relative">
          <input
            type="text"
            placeholder={t('students.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field-input pl-10 h-12"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100" size={18} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['ALL', 'ACTIVE', 'TRANSFERRED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                statusFilter === f
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : 'text-muted-foreground border-transparent'
              }`}
            >
              {f === 'ALL' ? t('students.filter.all') : t(`students.status.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>
        {courses.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setCourseFilter('')}
              className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${
                !courseFilter ? 'bg-teal-50 text-teal-600 border-teal-100' : 'text-muted-foreground'
              }`}
            >
              {t('students.filter.allCourses')}
            </button>
            {courses.map((c) => (
              <button
                key={c.medresaCourseId}
                type="button"
                onClick={() => setCourseFilter(c.medresaCourseId)}
                className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${
                  courseFilter === c.medresaCourseId
                    ? 'bg-teal-50 text-teal-600 border-teal-100'
                    : 'text-muted-foreground'
                }`}
              >
                {getLocalizedValue(c.name)}
              </button>
            ))}
          </div>
        )}
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
                    search: { medresaId },
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
                      .join(', ') || t('students.noCourses')}
                  </p>
                  <p className="text-xs text-muted-foreground">{student.guardianName}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    student.status === 'ACTIVE'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-cream-dark text-muted-foreground'
                  }`}
                >
                  {t(`students.status.${student.status.toLowerCase()}`)}
                </span>
                <ChevronRight className="text-muted-foreground shrink-0" size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowEnroll(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-full shadow-lg"
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
