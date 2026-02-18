'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, TrendingUp, Shield, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeModalProps {
  userName: string;
  onClose: () => void;
}

export default function WelcomeModal({ userName, onClose }: WelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 320);
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Análisis en Tiempo Real',
      description: 'Monitorea tus envíos y flota con datos actualizados al instante',
    },
    {
      icon: Shield,
      title: 'Seguridad Garantizada',
      description: 'Tus datos están protegidos con encriptación de nivel empresarial',
    },
    {
      icon: Zap,
      title: 'Rendimiento Optimizado',
      description: 'Gestiona tu operación logística de manera eficiente y rápida',
    },
  ];

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        transition-opacity duration-300
        ${isVisible && !isClosing ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl
          transform transition-all duration-500 ease-out
          ${
            isVisible && !isClosing
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }
        `}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 px-6 py-6 text-white overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-red-400 rounded-full blur-3xl" />
          </div>

          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-xl mb-3 shadow-xl">
              <Sparkles className="w-7 h-7 text-red-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-1">
              ¡Bienvenido, {userName}! 🎉
            </h2>
            <p className="text-red-100 text-sm">
              Tu panel de control está listo para revolucionar tu logística
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Todo lo que necesitas en un solo lugar
            </h3>
            <p className="text-sm text-gray-600">
              Descubre las características que potenciarán tu operación
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-2">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600">
                  {feature.description}
                </p>
                <CheckCircle className="w-4 h-4 text-green-500 mt-1.5" />
              </div>
            ))}
          </div>

          {/* Info adicional */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-4">
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              ¿Qué puedes hacer ahora?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              <span>• Ver reportes de envíos en tiempo real</span>
              <span>• Gestionar flota y conductores</span>
              <span>• Crear y administrar envíos</span>
              <span>• Generar facturas y controlar ingresos</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleClose}
            className="w-full h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all"
          >
            Comenzar a Explorar
          </Button>

          <p className="text-center text-xs text-gray-500 mt-2">
            Este mensaje no se volverá a mostrar
          </p>
        </div>
      </div>
    </div>
  );
}
