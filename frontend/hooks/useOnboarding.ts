'use client';

import { useState, useEffect } from 'react';

export function useOnboarding(userId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    if (!userId) return;

    checkOnboarding();
  }, [userId]);

  const checkOnboarding = () => {
    if (!userId) return;

    // 📖 CLAVE 1: Verificar si ACABA de hacer login
    const justLoggedIn = sessionStorage.getItem('just_logged_in') === 'true';
    
    // 📖 CLAVE 2: Verificar si ya vio el preloader en esta sesión
    const hasSeenPreloaderThisSession = sessionStorage.getItem('preloader_shown') === 'true';

    console.log('🔍 Verificando onboarding:', {
      justLoggedIn,
      hasSeenPreloaderThisSession,
      userId
    });

    if (justLoggedIn && !hasSeenPreloaderThisSession) {
      // ✅ ACABA de hacer login Y no ha visto el preloader → MOSTRAR
      console.log('🎬 Recién logueado - Mostrando preloader');
      setIsLoading(true);
      setShowWelcome(false);
      setIsReady(false);
      
      // 📖 Limpiar la bandera de "just_logged_in" inmediatamente
      sessionStorage.removeItem('just_logged_in');
    } else {
      // ✅ NO viene de login O ya vio el preloader → SALTAR
      console.log('⏭️ No viene de login o ya vio preloader - Saltando');
      setIsLoading(false);
      setShowWelcome(false);
      setIsReady(true);
    }
  };

  const handlePreloaderComplete = () => {
    console.log('🎯 Preloader completado');
    
    // 📖 Marcar que ya vio el preloader en ESTA sesión
    sessionStorage.setItem('preloader_shown', 'true');
    
    setIsLoading(false);
    
    // 📖 Verificar si debe mostrar el welcome (solo usuarios NUEVOS)
    const isNewUser = localStorage.getItem('is_new_user') === 'true';
    
    if (isNewUser) {
      console.log('🆕 Usuario nuevo - Mostrando welcome modal');
      setShowWelcome(true);
    } else {
      console.log('👤 Usuario existente - Saltando welcome modal');
      setShowWelcome(false);
      setIsReady(true);
    }
  };

  const completeWelcome = () => {
    console.log('✅ Cerrando welcome modal');
    
    // 📖 Limpiar la bandera de usuario nuevo
    localStorage.removeItem('is_new_user');
    
    setShowWelcome(false);
    setIsReady(true);
  };

  return {
    isLoading,
    showWelcome,
    isReady,
    handlePreloaderComplete,
    completeWelcome,
  };
}