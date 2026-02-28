// src/lib/get-current-user-id.ts
// Lee el userId directamente del JWT en la cookie — sin ningún request HTTP
// El JWT tiene payload: { sub: userId, email, role, iat, exp }

import { getCookie } from '@/lib/cookies';

export function getCurrentUserId(): number | null {
  try {
    const token = getCookie('token');
    if (!token) return null;

    // El JWT tiene 3 partes separadas por "."
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decodificar el payload (parte del medio) — es base64url
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    // Tu JWT usa { sub: userId }
    return payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}