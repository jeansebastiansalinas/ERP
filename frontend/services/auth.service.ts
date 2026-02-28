import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';
import { getCookie, deleteCookie } from '@/lib/cookies';

// 📖 TIPOS: Definimos la estructura de datos

// Datos que recibimos al hacer login
interface LoginResponse {
  accessToken: string;
  user: {
    id: number;        // ← CAMBIO: number en lugar de string
    email: string;
    name: string;
    role: RoleName;
  };
}

// Datos para registrarse
interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: RoleName;
}

// Datos del usuario actual
export interface CurrentUser {
  id: number;          // ← CAMBIO: number en lugar de string
  email: string;
  name: string;
  role: RoleName;
}

// =========================
// 🔐 LOGIN
// =========================
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
  }
}

// =========================
// 📝 REGISTER
// =========================
export async function register(userData: RegisterData): Promise<void> {
  try {
    await api.post('/auth/register', userData);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al registrarse');
  }
}

// =========================
// 👤 GET CURRENT USER
// =========================
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const token = getCookie('token');

    if (!token) {
      return null;
    }

    const { data } = await api.get<CurrentUser>('/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

// =========================
// 👤 GET USER DATA (Alias para getCurrentUser)
// =========================
// 📖 Esta función es un alias de getCurrentUser()
// La usamos en negociaciones para obtener el ID del usuario actual
export async function getUserData(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  return user;
}

// =========================
// 🔓 LOGOUT
// =========================
export function logout(): void {
  deleteCookie('token');
}