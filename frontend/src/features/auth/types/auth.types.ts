export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type MedresaRoleEntry = {
  medresaId: string;
  medresaName: string;
  role: 'TEACHER' | 'ADMIN';
};

export type User = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: UserStatus;
  isSuperAdmin: boolean;
  medresaRoles: MedresaRoleEntry[];
};

export type CurrentUser = User & {
  isMedresaAdmin: boolean;
  isTeacher: boolean;
  hasAppAccess: boolean;
};

export type AuthLoginResponse = {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
};

export type UserListItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: UserStatus;
  isSuperAdmin: boolean;
  medresaRoles: MedresaRoleEntry[];
};

export type UsersListResponse = {
  success: boolean;
  data: {
    items: UserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};
