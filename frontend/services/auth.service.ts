import { AuthResponse, LoginData, RegisterData } from '@/types/auth';

const API_URL = 'http://localhost:3000/api';

// =========================
// LOGIN
// =========================
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Credenciales inválidas');
  }

  return response.json();
}

// =========================
// REGISTER
// =========================
export async function register(data: RegisterData): Promise<{ id: number; email: string; name: string | null; role: string }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al registrar usuario');
  }

  return response.json();
}
