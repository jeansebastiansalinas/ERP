'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setClosing(true);

          setTimeout(onComplete, 600); // tiempo de salida premium
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-800
      transition-all duration-700 ease-in-out
      ${closing ? 'opacity-0 scale-[1.03] blur-sm' : 'opacity-100 scale-100 blur-0'}
      `}
    >
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* Loader */}
        <div className="relative w-36 h-36">
          <div className="absolute inset-0 rounded-full border border-white/20" />

          <div className="absolute inset-0 rounded-full animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg" />
          </div>

          <div className="absolute inset-6 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <Truck className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Porcentaje */}
        <span className="text-sm font-medium tracking-wide text-white/80">
          {Math.round(progress)}%
        </span>

        {/* Texto */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            ERP Business Insight
          </h1>
        </div>
      </div>

      {/* Animaciones */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 1.6s linear infinite;
        }
      `}</style>
    </div>
  );
}
