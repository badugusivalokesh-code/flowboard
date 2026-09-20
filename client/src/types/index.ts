export type ProjectStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';

export const PROJECT_STATUSES: ProjectStatus[] = ['todo', 'in_progress', 'completed', 'overdue'];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  owner: string;
  title: string;
  description: string;
  status: ProjectStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProjectListResponse {
  items: Project[];
  pagination: Pagination;
}

/**
 * One point on the dashboard activity chart. Named/shaped to match the
 * Recharts ComposedChart visual language from the design reference
 * (purple trend line / dashed forecast / green "new" bars / red
 * "at risk" bars), but driven by real project-count aggregates rather
 * than fabricated financial data — see server/dashboardService.ts.
 */
export interface ProjectActivityPoint {
  month: string;
  total: number;
  created: number;
  completed: number;
  overdue: number;
}

export interface DashboardStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
  newThisMonthDeltaPct: number;
}

export interface StatusDistributionEntry {
  status: ProjectStatus;
  count: number;
}

export interface RecentActivityEntry {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: string;
  dueDate: string | null;
}

/** Distinct from RecentActivityEntry — no `updatedAt`, since the backend's
 * upcoming-deadlines aggregation only ever projects title/status/dueDate
 * (an "upcoming deadline" isn't about recency of edits). Kept as a
 * separate type instead of force-fitting RecentActivityEntry's shape,
 * which used to claim a field that was actually always undefined here. */
export interface UpcomingDeadlineEntry {
  id: string;
  title: string;
  status: ProjectStatus;
  dueDate: string | null;
}

export interface DashboardSummary {
  stats: DashboardStats;
  statusDistribution: StatusDistributionEntry[];
  activity: ProjectActivityPoint[];
  forecastNext: number | null;
  avgCompletionDays: number | null;
  recentActivity: RecentActivityEntry[];
  upcomingDeadlines: UpcomingDeadlineEntry[];
}

export interface ApiErrorBody {
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

/** Shared status contract for any dashboard section that will eventually be
 * backed by a real fetch (stat cards, activity chart, status mix, recent
 * activity). Mock-data sections in Phase 3 default to 'success'. */
export type DataStatus = 'loading' | 'error' | 'success';
