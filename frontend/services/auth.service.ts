import { api } from '@/lib/api';

export interface LoginResponse {
  access_token: string;
}

export async function login(email: string, password: string) {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });

  return response.data;
}
