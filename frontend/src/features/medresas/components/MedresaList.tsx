import { MedresaListItem } from "../types";
import { Building2, Plus, MapPin, Users, GraduationCap, ChevronRight } from "lucide-react";
import { ContentCard } from "../../../components/ui/ContentCard";

interface MedresaListProps {
  medresas: MedresaListItem[];
  onAddMedresa: () => void;
  onEditMedresa: (medresa: MedresaListItem) => void;
  onViewMedresa: (medresa: MedresaListItem) => void;
}

export const MedresaList = ({
  medresas,
  onAddMedresa,
  onEditMedresa,
  onViewMedresa,
}: MedresaListProps) => {
  if (medresas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-200">
          <Building2 size={32} />
        </div>
        <h3 className="mb-1 text-lg font-medium text-teal-800">No medresas found</h3>
        <p className="mb-6 text-sm text-muted-foreground">Enroll the first medresa in the network</p>
        <button type="button" onClick={onAddMedresa} className="btn-primary-inline px-6">
          <Plus size={18} />
          Add medresa
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {medresas.map((medresa) => (
        <ContentCard key={medresa.id} onClick={() => onViewMedresa(medresa)}>
          <div className="p-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Building2 size={24} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-medium text-teal-800">{medresa.name}</h3>
                  <ChevronRight size={18} className="shrink-0 text-teal-200 transition-colors group-hover:text-teal-400" />
                </div>

                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  {medresa.location}
                </div>

                <div className="mb-3 flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-teal-600">
                    <Users size={12} />
                    {medresa._count?.students ?? 0} students
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-teal-600">
                    <GraduationCap size={12} />
                    {medresa._count?.teacher_medresas ?? 0} teachers
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-2 w-2 rounded-full ${medresa.status === 'ACTIVE' ? 'bg-success-text' : 'bg-danger-text'}`}
                    />
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wider ${medresa.status === 'ACTIVE' ? 'text-success-text' : 'text-danger-text'}`}
                    >
                      {medresa.status}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMedresa(medresa);
                    }}
                    className="text-xs font-medium text-teal-600 hover:underline"
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ContentCard>
      ))}
    </div>
  );
};
