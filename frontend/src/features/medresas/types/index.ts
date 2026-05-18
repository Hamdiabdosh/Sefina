export type MedresaStatus = 'ACTIVE' | 'INACTIVE';

export interface MedresaListItem {
  id: string;
  name: string;
  location: string;
  phone: string | null;
  status: MedresaStatus;
  created_at: string;
  updated_at: string;
  _count?: {
    students: number;
    teacher_medresas: number;
  };
}

export interface MedresaDetail extends MedresaListItem {
  students?: Array<{ id: string }>;
  teacher_medresas?: Array<{
    id: string;
    role: 'TEACHER' | 'ADMIN';
    teacher: { id: string; full_name: string };
  }>;
  medresa_courses?: Array<{ id: string }>;
}
