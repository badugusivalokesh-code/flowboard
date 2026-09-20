import { apiRequest } from './api';
import type { DashboardSummary } from '@/types';

export function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiRequest('/dashboard/summary', { signal });
}
