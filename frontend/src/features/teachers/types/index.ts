import type { LocalizedString } from '../utils/localizedJson';

export type TeacherStatus = 'ACTIVE' | 'INACTIVE';

export type MedresaAssignment = {
  id: string;
  medresaId: string;
  medresaName: string;
  medresaStatus: TeacherStatus;
  role: 'TEACHER' | 'ADMIN';
  assignedSince: string;
};

export type TeacherListItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  specialization: LocalizedString;
  dateJoined: string;
  photoUrl: string | null;
  status: TeacherStatus;
  medresaAssignments: MedresaAssignment[];
};

export type TeacherDetail = TeacherListItem & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type TeachersListResponse = {
  items: TeacherListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
