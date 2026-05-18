export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  medresaRoles: Array<{
    medresaId: string;
    role: 'TEACHER' | 'ADMIN';
  }>;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
