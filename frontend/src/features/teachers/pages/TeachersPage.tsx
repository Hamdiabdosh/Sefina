import { useMemo, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { CreateTeacherModal } from '../components/CreateTeacherModal';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { useTeachers } from '../hooks/useTeachers';
import { getLocalizedValue } from '../utils/localizedJson';

export const TeachersPage = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    medresaId: search.medresaId,
  };

  const { teachers, isLoading, error, createTeacher, uploadPhoto } = useTeachers(filters);

  const activeCount = useMemo(
    () => teachers.filter((t) => t.status === 'ACTIVE').length,
    [teachers]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title="Teachers" subtitle="Loading..." />
        <div className="p-4">
          <div className="h-24 bg-white rounded-xl animate-pulse border border-cream-dark" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream p-8 text-center text-danger-text">
        Failed to load teachers.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader title="Teachers" subtitle={`Network · ${activeCount} active`} />
      <div className="p-4 pt-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field-input pl-10 h-12"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100" size={18} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
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
              {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
        {teachers.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No teachers found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                onClick={() =>
                  void navigate({
                    to: '/admin/teachers/$teacherId',
                    params: { teacherId: teacher.id },
                  })
                }
                className="bg-white rounded-xl border border-cream-dark p-4 shadow-sm text-left active:scale-[0.98] transition-all w-full"
              >
                <div className="flex gap-4">
                  <TeacherAvatar
                    teacherId={teacher.id}
                    name={teacher.fullName}
                    photoUrl={teacher.photoUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-teal-800">{teacher.fullName}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {getLocalizedValue(teacher.specialization)}
                    </p>
                    <p className="text-xs text-teal-600 mt-1 truncate">
                      {teacher.medresaAssignments.map((a) => a.medresaName).join(' · ') ||
                        'No medresa assignments'}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium uppercase h-fit ${
                      teacher.status === 'ACTIVE' ? 'text-success-text' : 'text-danger-text'
                    }`}
                  >
                    {teacher.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-teal-400 rounded-full shadow-lg flex items-center justify-center text-white z-20"
        aria-label="Add teacher"
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
