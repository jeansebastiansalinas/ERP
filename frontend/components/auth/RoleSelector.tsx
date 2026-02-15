'use client';

import { RoleName } from '@/types/auth';

interface RoleSelectorProps {
  selectedRole: RoleName | null;
  onSelectRole: (role: RoleName) => void;
}

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  const roles = [
    {
      value: RoleName.VENDEDOR,
      label: 'Vendedor',
      icon: '🛒',
      description: 'Vender productos',
      color: 'blue',
    },
    {
      value: RoleName.COMPRADOR,
      label: 'Comprador',
      icon: '🛍️',
      description: 'Comprar productos',
      color: 'green',
    },
  ];

  return (
    <div className="space-y-2">
      <label className="text-white font-medium text-sm">Selecciona tu rol</label>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onSelectRole(role.value)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-300
              ${
                selectedRole === role.value
                  ? `border-white bg-gradient-to-br ${
                      role.color === 'blue' ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'
                    } shadow-lg scale-105`
                  : 'border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50'
              }
            `}
          >
            {/* Icono */}
            <div className="text-3xl mb-2">{role.icon}</div>
            
            {/* Título */}
            <div className="text-white font-bold text-sm mb-1">
              {role.label}
            </div>
            
            {/* Descripción */}
            <div className="text-white/70 text-xs">
              {role.description}
            </div>

            {/* Check mark cuando está seleccionado */}
            {selectedRole === role.value && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
