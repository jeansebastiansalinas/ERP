import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';
import { getCookie } from '@/lib/cookies';
import { deleteCookie } from '@/lib/cookies';

// 📖 TIPOS: Definimos la estructura de datos

// Datos que recibimos al hacer login
interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
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
  id: string;
  email: string;
  name: string;
  role: RoleName;
}

// =========================
// 🔐 LOGIN
// =========================
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    // 📖 axios.post() hace una petición POST al backend
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    // 📖 Retornamos el accessToken y los datos del usuario
    return data;
  } catch (error: any) {
    // 📖 Si hay error, lo lanzamos para que useAuth lo capture
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
    // 📖 CAMBIO: Obtenemos el token de las cookies
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
// 🔓 LOGOUT
// =========================
export function logout(): void {
  // 📖 CAMBIO: Eliminamos de cookies en lugar de localStorage
  deleteCookie('token');
}