'use client';

import { useState, useEffect } from 'react';
import { login as loginService, register as registerService, getCurrentUser, logout as logoutService, CurrentUser } from '@/services/auth.service';
import { RoleName } from '@/types/auth';
import { setCookie } from '@/lib/cookies';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // =========================
  // 🔄 CARGAR USUARIO AL INICIAR
  // =========================
  useEffect(() => {
    loadUser();
  }, []);

  // 📖 Función para cargar el usuario actual
  async function loadUser() {
    try {
      setInitializing(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error cargando usuario:', err);
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }

  // =========================
  // 🔐 SIGN IN (LOGIN)
  // =========================
  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);

      const { accessToken, user: userData } = await loginService(email, password);

      // Guardar token
      setCookie('token', accessToken, 7);

      setUser(userData);

      // 📖 NUEVO: Marcar que viene de un login exitoso
      sessionStorage.setItem('just_logged_in', 'true');

      return true;
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 📝 SIGN UP (REGISTRO)
  // =========================
  async function signUp(name: string, email: string, password: string, role: RoleName) {
    try {
      setLoading(true);
      setError(null);

      // Registrar usuario
      await registerService({ name, email, password, role });

      // Auto-login después del registro
      const loginSuccess = await signIn(email, password);
      
      if (loginSuccess) {
        // 📖 NUEVO: Marcar que es un usuario recién registrado
        localStorage.setItem('is_new_user', 'true');
      }
      
      return loginSuccess;

    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 🔓 LOGOUT
  // =========================
  function signOut() {
    logoutService();
    setUser(null);
    
    // 📖 NUEVO: Limpiar sessionStorage al cerrar sesión
    sessionStorage.removeItem('preloader_shown');
    sessionStorage.removeItem('just_logged_in');
  }

  // =========================
  // ✅ RETURN - ESTO FALTABA
  // =========================
  return { 
    signIn, 
    signUp, 
    signOut,
    loading, 
    error,
    user,
    initializing,
  };
}