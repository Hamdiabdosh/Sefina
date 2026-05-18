import { MedresaListItem } from "../types";
import { Building2, Plus, MapPin, Users, GraduationCap, ChevronRight } from "lucide-react";

interface MedresaListProps {
  medresas: MedresaListItem[];
  onEditMedresa: (medresa: MedresaListItem) => void;
  onDeleteMedresa: (id: string) => void;
  onViewMedresa: (medresa: MedresaListItem) => void;
}

export const MedresaList = ({
  medresas,
  onEditMedresa,
  onDeleteMedresa: _onDeleteMedresa,
  onViewMedresa,
}: MedresaListProps) => {
  if (medresas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-200 mb-4">
          <Building2 size={32} />
        </div>
        <h3 className="text-lg font-medium text-teal-800 mb-1">No medresas found</h3>
        <p className="text-sm text-muted-foreground mb-6">Enroll the first medresa in the network</p>
        <button className="btn-primary w-auto px-6">
          <Plus size={18} />
          Add medresa
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {medresas.map((medresa) => (
        <div
          key={medresa.id}
          onClick={() => onViewMedresa(medresa)}
          className="bg-white rounded-xl border border-cream-dark p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 flex-shrink-0">
              <Building2 size={24} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-teal-800">{medresa.name}</h3>
                <ChevronRight size={18} className="text-teal-100 group-hover:text-teal-400 transition-colors" />
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <MapPin size={12} />
                {medresa.location}
              </div>

              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                  <Users size={12} />
                  {medresa._count?.students ?? 0} students
                </div>
                <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                  <GraduationCap size={12} />
                  {medresa._count?.teacher_medresas ?? 0} teachers
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${medresa.status === 'ACTIVE' ? 'bg-success-text' : 'bg-danger-text'}`} />
                  <span className={`text-[11px] font-medium uppercase tracking-wider ${medresa.status === 'ACTIVE' ? 'text-success-text' : 'text-danger-text'}`}>
                    {medresa.status}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMedresa(medresa);
                    }}
                    className="text-xs text-teal-600 font-medium hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
