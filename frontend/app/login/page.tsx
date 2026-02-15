'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FuturisticGlobe from '@/components/visuals/FuturisticGlobe';
import { RoleSelector } from '@/components/auth/RoleSelector';

import { useAuth } from '@/hooks/useAuth';
import { RoleName } from '@/types/auth';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import '@/styles/animations.css';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, loading, error } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<RoleName | null>(null);
  const [registerNameFocused, setRegisterNameFocused] = useState(false);
  const [registerEmailFocused, setRegisterEmailFocused] = useState(false);
  const [registerPasswordFocused, setRegisterPasswordFocused] = useState(false);

  const [showError, setShowError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowError(false);
    const success = await signIn(email, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setShowError(false);

    if (!registerRole) {
      setShowError(true);
      return;
    }

    const success = await signUp(registerName, registerEmail, registerPassword, registerRole);
    if (success) {
      router.push('/dashboard');
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  }

  return (
    <div className="h-screen w-screen fixed inset-0 overflow-hidden">
      
      <div className="absolute inset-0 w-full h-full">
        <FuturisticGlobe />
      </div>

      {error && showError && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in-right max-w-[calc(100vw-3rem)]">
          <div className="bg-gradient-to-r from-red-500/95 to-red-600/95 backdrop-blur-xl border border-red-400/50 rounded-lg shadow-2xl shadow-red-500/50 p-4 min-w-[280px] max-w-md relative overflow-hidden animate-shake">
            <div className="absolute inset-0 bg-red-500/10 animate-pulse-error" />
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-300 via-red-400 to-red-500" />
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="flex-shrink-0 mt-0.5">
                <div className="relative">
                  <svg className="w-5 h-5 text-red-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm mb-1">
                  {activeTab === 'login' ? '¡Error de autenticación!' : '¡Error al crear cuenta!'}
                </p>
                <p className="text-xs text-red-100/90 leading-relaxed break-words">{error}</p>
              </div>
              
              <button 
                onClick={() => setShowError(false)}
                className="flex-shrink-0 p-1.5 hover:bg-red-400/30 rounded-lg transition-colors group"
              >
                <svg className="w-4 h-4 text-red-100 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-400/30 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-300 to-red-200 animate-progress-bar" />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 h-full w-full grid grid-cols-1 md:grid-cols-2">
        
        <div className="hidden md:flex items-end pb-12 pl-12">
          <div className="space-y-3 max-w-lg">
            <h1 className="text-5xl font-bold text-white drop-shadow-2xl leading-tight">
              ERP Business
            </h1>
            <h2 className="text-3xl font-light text-red-400 drop-shadow-lg">
              Insight
            </h2>
            <p className="text-gray-300 text-sm drop-shadow-lg leading-relaxed">
              Gestión inteligente de transporte y logística en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 overflow-hidden">
          
          {/* 🎯 CARD CON ALTURA FIJA DE 650PX - MÁS ESPACIO PARA REGISTRO */}
          <Card className="w-full max-w-sm h-[650px] flex flex-col backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl relative overflow-hidden hover:shadow-red-500/20 hover:shadow-[0_0_40px] group transition-all duration-300">
            
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
            
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
            
            {/* HEADER FIJO */}
            <CardHeader className="space-y-3 pb-4 pt-6 relative flex-shrink-0">
              <div className="flex justify-center">
                <div className="relative group/logo">
                  <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-spin-slow opacity-50 blur-sm" />
                  
                  <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/50 transform group-hover/logo:scale-110 group-hover/logo:rotate-12 transition-all duration-500">
                    <svg 
                      className="w-9 h-9 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 p-1 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              <p className="text-center text-xs text-gray-300">
                {activeTab === 'login' ? 'Accede a tu panel de control' : 'Crea tu cuenta nueva'}
              </p>
            </CardHeader>

            {/* CONTENIDO CON SCROLL - ALTURA FLEXIBLE */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-4 custom-scrollbar">
              <CardContent className="p-0">
                {activeTab === 'login' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-white font-medium text-sm">Email</Label>
                      <div className="relative group/input">
                        {emailFocused && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md" />
                        )}
                        
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <svg className={`h-4 w-4 transition-all duration-300 ${
                            emailFocused ? 'text-red-400 scale-110' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        
                        <Input
                          type="email"
                          placeholder="usuario@erp.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          required
                          className="relative pl-10 h-11 bg-white/10 border-white/30 text-white placeholder:text-gray-400 text-sm focus:bg-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white font-medium text-sm">Contraseña</Label>
                      <div className="relative group/input">
                        {passwordFocused && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md" />
                        )}
                        
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <svg className={`h-4 w-4 transition-all duration-300 ${
                            passwordFocused ? 'text-red-400 scale-110' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          required
                          className="relative pl-10 h-11 bg-white/10 border-white/30 text-white placeholder:text-gray-400 text-sm focus:bg-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="relative w-full h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-base rounded-lg shadow-2xl shadow-red-500/50 hover:shadow-red-600/60 transform hover:scale-[1.02] transition-all duration-300 mt-6 overflow-hidden group/button"
                      disabled={loading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000" />
                      
                      {loading ? (
                        <span className="flex items-center justify-center gap-2 relative z-10">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Ingresando…
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Ingresar
                          <svg className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      )}
                    </Button>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <button type="button" className="text-gray-300 hover:text-red-400 transition-colors duration-200 whitespace-nowrap">
                          ¿Olvidaste tu contraseña?
                        </button>
                        <button type="button" className="text-gray-300 hover:text-red-400 transition-colors duration-200 whitespace-nowrap">
                          Contactar soporte
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {activeTab === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-white font-medium text-sm">Nombre completo</Label>
                      <div className="relative group/input">
                        {registerNameFocused && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md" />
                        )}
                        
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <svg className={`h-4 w-4 transition-all duration-300 ${
                            registerNameFocused ? 'text-red-400 scale-110' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        
                        <Input
                          type="text"
                          placeholder="Juan Pérez"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          onFocus={() => setRegisterNameFocused(true)}
                          onBlur={() => setRegisterNameFocused(false)}
                          required
                          className="relative pl-10 h-11 bg-white/10 border-white/30 text-white placeholder:text-gray-400 text-sm focus:bg-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white font-medium text-sm">Email</Label>
                      <div className="relative group/input">
                        {registerEmailFocused && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md" />
                        )}
                        
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <svg className={`h-4 w-4 transition-all duration-300 ${
                            registerEmailFocused ? 'text-red-400 scale-110' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        
                        <Input
                          type="email"
                          placeholder="usuario@erp.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          onFocus={() => setRegisterEmailFocused(true)}
                          onBlur={() => setRegisterEmailFocused(false)}
                          required
                          className="relative pl-10 h-11 bg-white/10 border-white/30 text-white placeholder:text-gray-400 text-sm focus:bg-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white font-medium text-sm">Contraseña</Label>
                      <div className="relative group/input">
                        {registerPasswordFocused && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md" />
                        )}
                        
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <svg className={`h-4 w-4 transition-all duration-300 ${
                            registerPasswordFocused ? 'text-red-400 scale-110' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          onFocus={() => setRegisterPasswordFocused(true)}
                          onBlur={() => setRegisterPasswordFocused(false)}
                          required
                          minLength={6}
                          className="relative pl-10 h-11 bg-white/10 border-white/30 text-white placeholder:text-gray-400 text-sm focus:bg-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                        />
                      </div>
                    </div>

                    <RoleSelector 
                      selectedRole={registerRole} 
                      onSelectRole={setRegisterRole} 
                    />

                    <Button
                      type="submit"
                      className="relative w-full h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-base rounded-lg shadow-2xl shadow-red-500/50 hover:shadow-red-600/60 transform hover:scale-[1.02] transition-all duration-300 mt-4 overflow-hidden group/button"
                      disabled={loading || !registerRole}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000" />
                      
                      {loading ? (
                        <span className="flex items-center justify-center gap-2 relative z-10">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creando cuenta…
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Crear cuenta
                          <svg className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </span>
                      )}
                    </Button>

                    <div className="pt-3 border-t border-white/10">
                      <p className="text-center text-xs text-gray-400">
                        Al registrarte, aceptas nuestros{' '}
                        <button type="button" className="text-red-400 hover:text-red-300 transition-colors">
                          Términos y Condiciones
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </CardContent>
            </div>

            {/* FOOTER FIJO */}
            <div className="px-6 py-3 border-t border-white/10 backdrop-blur-sm flex-shrink-0">
              <p className="text-center text-[10px] text-gray-400">
                © 2026 ERP Business Insight. Todos los derechos reservados.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.7);
        }
      `}</style>
    </div>
  );
}