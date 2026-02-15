'use client';

import { useState } from 'react';
import { login, register } from '@/services/auth.service';
import { RoleName } from '@/types/auth';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // SIGN IN (LOGIN)
  // =========================
  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);

      const { accessToken } = await login(email, password);

      localStorage.setItem('token', accessToken);

      return true;
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // SIGN UP (REGISTRO)
  // =========================
  async function signUp(name: string, email: string, password: string, role: RoleName) {
    try {
      setLoading(true);
      setError(null);

      // Registrar usuario
      await register({ name, email, password, role });

      // Auto-login después del registro
      return await signIn(email, password);

    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LOGOUT
  // =========================
  function logout() {
    localStorage.removeItem('token');
  }

  return { signIn, signUp, logout, loading, error };
}
