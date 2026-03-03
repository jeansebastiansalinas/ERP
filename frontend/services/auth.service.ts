import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';
import { getCookie, deleteCookie } from '@/lib/cookies';

interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: RoleName;
  };
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: RoleName;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  role: RoleName;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
  }
}

export async function register(userData: RegisterData): Promise<void> {
  try {
    await api.post('/auth/register', userData);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al registrarse');
  }
}

// ════════════════════════════════════════════════
// getCurrentUser — ahora el backend retorna
// { id, email, name, role } correctamente desde getMe()
// ════════════════════════════════════════════════
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const token = getCookie('token');
    if (!token) return null;

    const { data } = await api.get<CurrentUser>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Normalización defensiva por si el backend retorna role como objeto
    return {
      id:    Number(data.id),
      email: data.email,
      name:  data.name,
      role:  (typeof data.role === 'object' ? (data.role as any).name : data.role) as RoleName,
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

export async function getUserData(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return user;
}

export function logout(): void {
  deleteCookie('token');
}