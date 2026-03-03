import { getCookie } from '@/lib/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): HeadersInit {
  const token = getCookie('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function getReportes(): Promise<any> {
  const res = await fetch(`${API_URL}/reportes`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener reportes');
  return res.json();
}