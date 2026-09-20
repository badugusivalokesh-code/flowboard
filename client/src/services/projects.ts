import { apiRequest } from './api';
import type { Project, ProjectListResponse, ProjectStatus } from '@/types';

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string | null;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export function listProjects(params: ListProjectsParams = {}, signal?: AbortSignal): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiRequest(`/projects${qs ? `?${qs}` : ''}`, { signal });
}

export function createProject(payload: CreateProjectPayload): Promise<{ project: Project }> {
  return apiRequest('/projects', { method: 'POST', body: payload });
}

export function updateProject(id: string, payload: UpdateProjectPayload): Promise<{ project: Project }> {
  return apiRequest(`/projects/${id}`, { method: 'PATCH', body: payload });
}

export function deleteProject(id: string): Promise<void> {
  return apiRequest(`/projects/${id}`, { method: 'DELETE' });
}
