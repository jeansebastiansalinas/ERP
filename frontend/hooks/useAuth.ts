'use client';

import { useState } from 'react';
import { login } from '@/services/auth.service';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);

      const { access_token } = await login(email, password);

      localStorage.setItem('token', access_token);

      return true;
    } catch (err: any) {
      setError('Credenciales inválidas');
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
  }

  return { signIn, logout, loading, error };
}
