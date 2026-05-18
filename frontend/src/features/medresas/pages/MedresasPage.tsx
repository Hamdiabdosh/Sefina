import { useMedresas } from "../hooks/useMedresas";
import { MedresaList } from "../components/MedresaList";
import { PageHeader } from "../../../components/PageHeader";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export const MedresasPage = () => {
  const {
    medresas,
    isLoading,
    error,
    deleteMedresa,
  } = useMedresas();
  
  const [searchQuery, setSearchQuery] = useState("");

  const activeCount = medresas.filter(m => m.status === 'ACTIVE').length;

  if (isLoading) return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Medresas" subtitle="Loading network data..." />
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-cream-dark" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Medresas" subtitle="Error loading data" />
      <div className="p-8 text-center text-danger-text">
        Failed to load medresas. Please check your connection.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader 
        title="Medresas" 
        subtitle={`Network · ${activeCount} active`}
      />

      <div className="p-4 pt-6">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search medresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field-input pl-10 h-12"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100" size={18} />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <button className="px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-medium border border-teal-100">All</button>
          <button className="px-4 py-1.5 rounded-full text-muted-foreground text-xs font-medium border border-transparent">Active</button>
          <button className="px-4 py-1.5 rounded-full text-muted-foreground text-xs font-medium border border-transparent">Inactive</button>
        </div>

        <MedresaList
          medresas={medresas}
          onEditMedresa={(medresa) => console.log('Edit', medresa)}
          onDeleteMedresa={(id) => deleteMedresa.mutate(id)}
          onViewMedresa={(medresa) => console.log('View', medresa)}
        />
      </div>

      <button className="fixed bottom-8 right-6 w-14 h-14 bg-teal-400 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform z-20">
        <Plus size={28} />
      </button>
    </div>
  );
};
