import { apiRequest } from './api';
import type { User } from '@/types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<{ user: User }> {
  return apiRequest('/auth/register', { method: 'POST', body: payload });
}

export function login(payload: LoginPayload): Promise<{ user: User }> {
  return apiRequest('/auth/login', { method: 'POST', body: payload });
}

export function logout(): Promise<{ message: string }> {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export function fetchCurrentUser(): Promise<{ user: User }> {
  return apiRequest('/auth/me', { method: 'GET' });
}
