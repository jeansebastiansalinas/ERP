// ========================================
// TIPOS DE AUTENTICACIÓN
// ========================================

export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  COMPRADOR = 'COMPRADOR',
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: RoleName;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: RoleName;
}

export interface LoginData {
  email: string;
  password: string;
}
