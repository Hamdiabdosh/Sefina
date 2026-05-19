import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title="Medresas" subtitle="Loading network data..." />
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-cream-dark" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream">
        <PageHeader title="Medresas" subtitle="Error loading data" />
        <div className="p-8 text-center text-danger-text">
          Failed to load medresas. Please check your connection.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader title="Medresas" subtitle={`Network · ${activeCount} active`} />

      <div className="p-4 pt-6">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search medresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field-input pl-10 h-12"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100"
            size={18}
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : 'text-muted-foreground border-transparent'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
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
      </div>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-teal-400 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform z-20"
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
