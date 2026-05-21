import { useMemo, useRef, useState } from 'react';
import { useFocusSearchShortcut } from '../../../hooks/useFocusSearchShortcut';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Building2, GraduationCap, Plus, Search, Users } from 'lucide-react';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { StatCard } from '../../../components/ui/StatCard';
import { useMedresas } from '../hooks/useMedresas';
import { MedresaList } from '../components/MedresaList';
import { CreateMedresaModal } from '../components/CreateMedresaModal';
import { EditMedresaModal } from '../components/EditMedresaModal';
import type { MedresaListItem, MedresaStatus } from '../types';

type StatusFilter = 'ALL' | MedresaStatus;

export const MedresasPage = () => {
  const navigate = useNavigate();
  const { medresas, isLoading, error, createMedresa, updateMedresa } = useMedresas();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editMedresa, setEditMedresa] = useState<MedresaListItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useFocusSearchShortcut(searchInputRef);

  const filteredMedresas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return medresas.filter((medresa) => {
      const matchesStatus = statusFilter === 'ALL' || medresa.status === statusFilter;
      const matchesSearch =
        !query ||
        medresa.name.toLowerCase().includes(query) ||
        medresa.location.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [medresas, searchQuery, statusFilter]);

  const activeCount = medresas.filter((m) => m.status === 'ACTIVE').length;
  const inactiveCount = medresas.filter((m) => m.status === 'INACTIVE').length;

  const { totalStudents, totalTeacherSlots } = useMemo(() => {
    let students = 0;
    let slots = 0;
    for (const m of medresas) {
      students += m._count?.students ?? 0;
      slots += m._count?.teacher_medresas ?? 0;
    }
    return { totalStudents: students, totalTeacherSlots: slots };
  }, [medresas]);

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title="Medresas" subtitle="Loading network data..." />
        <PageBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border border-cream-dark bg-surface" />
            ))}
          </div>
        </PageBody>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title="Medresas" subtitle="Error loading data" />
        <PageBody>
          <p className="text-center text-danger-text">Failed to load medresas. Please check your connection.</p>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <PageTopBar
        title="Medresas"
        subtitle={`Network · ${activeCount} active`}
        actions={
          <>
            <div className="relative hidden min-w-[140px] sm:block sm:min-w-[180px]">
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search medresas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field-input h-10 py-2 pl-9 text-sm"
                aria-label="Search medresas"
              />
              <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-teal-200" />
            </div>
            <button type="button" className="btn-primary-inline" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Add medresa
            </button>
          </>
        }
      />

      <PageBody>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Building2} value={activeCount} label="Active medresas" tone="green" />
          <StatCard
            icon={Users}
            value={totalStudents}
            label="Students (reported)"
            hint={<span className="text-teal-600">Across network</span>}
            tone="teal"
          />
          <StatCard
            icon={GraduationCap}
            value={totalTeacherSlots}
            label="Teacher assignments"
            tone="amber"
          />
          <StatCard
            icon={BookOpen}
            value={inactiveCount}
            label="Inactive sites"
            tone="blue"
          />
        </div>

        <div className="mb-4 sm:hidden">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search medresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input h-12 pl-10"
              aria-label="Search medresas"
            />
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-teal-200" />
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-foreground">All institutions</h2>
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            tabs={[
              { value: 'ALL', label: 'All' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </div>

        <MedresaList
          medresas={filteredMedresas}
          onAddMedresa={() => setShowCreate(true)}
          onEditMedresa={setEditMedresa}
          onViewMedresa={(medresa) =>
            void navigate({
              to: '/admin/medresas/$medresaId',
              params: { medresaId: medresa.id },
            })
          }
        />
      </PageBody>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal-400 text-white shadow-lg transition-transform active:scale-90"
        aria-label="Add medresa"
      >
        <Plus size={28} />
      </button>

      <CreateMedresaModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        createMedresa={createMedresa}
      />
      <EditMedresaModal
        medresa={editMedresa}
        onClose={() => setEditMedresa(null)}
        updateMedresa={updateMedresa}
      />
    </div>
  );
};
