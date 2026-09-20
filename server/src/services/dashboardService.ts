import { Types } from 'mongoose';
import { Project } from '../models/Project';
import { PROJECT_STATUSES, ProjectStatus } from '../models/Project';

interface StatusCountRow {
  _id: ProjectStatus;
  count: number;
}

interface MonthlyRow {
  _id: { year: number; month: number };
  created: number;
  completed: number;
  overdue: number;
}

interface RecentRow {
  _id: Types.ObjectId;
  title: string;
  status: ProjectStatus;
  updatedAt: Date;
  dueDate: Date | null;
}

interface UpcomingDeadlineRow {
  _id: Types.ObjectId;
  title: string;
  status: ProjectStatus;
  dueDate: Date | null;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * All aggregation happens in MongoDB via a single $facet pipeline —
 * we never pull every project into Node and reduce it in JS.
 *
 * NOTE on scope: FlowBoard's data model (per the FRD) is Users + Projects
 * only — there is no billing/subscription/support-ticket data. The
 * "Revenue & MRR" chart from the Figma reference is re-purposed here to
 * plot real project activity (created / completed / overdue per month)
 * rather than fabricating financial data that has no backing collection.
 * This is called out again in the README.
 *
 * `forecastNext` below is still computed (real, derived from actual
 * monthly deltas — never hardcoded) but as of the FRD dashboard pass is no
 * longer rendered by the client: FR-7 asks for "created/completed over
 * time," not a forward projection, so RevenueChart.tsx stopped plotting it.
 * Left computed here rather than removed — dropping a field from the API
 * response is a bigger change than the FRD task asked for, and it's
 * harmless, real data if you want it displayed again later.
 */
export async function getDashboardSummary(ownerId: string) {
  const owner = new Types.ObjectId(ownerId);

  const [result] = await Project.aggregate([
    { $match: { owner } },
    {
      $facet: {
        statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        monthly: [
          {
            $group: {
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              created: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
            },
          },
          // Most recent 12 months: sort newest-first so $limit keeps the
          // right end of the window, then re-sort ascending for charting.
          // (Previously sorted ascending before limiting, which silently
          // kept the OLDEST 12 months — and dropped anything more recent —
          // for any account with over a year of history.)
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],
        recent: [
          { $sort: { updatedAt: -1 } },
          { $limit: 6 },
          { $project: { title: 1, status: 1, updatedAt: 1, dueDate: 1 } },
        ],
        completionDurations: [
          { $match: { status: 'completed' } },
          { $project: { days: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
        ],
        upcomingDeadlines: [
          { $match: { status: { $in: ['todo', 'in_progress'] }, dueDate: { $ne: null } } },
          { $sort: { dueDate: 1 } },
          { $limit: 5 },
          { $project: { title: 1, status: 1, dueDate: 1 } },
        ],
      },
    },
  ]);

  const statusCounts: StatusCountRow[] = result?.statusCounts ?? [];
  const monthly: MonthlyRow[] = result?.monthly ?? [];
  const recent: RecentRow[] = result?.recent ?? [];
  const completionDurations: { days: number }[] = result?.completionDurations ?? [];
  const upcomingDeadlines: UpcomingDeadlineRow[] = result?.upcomingDeadlines ?? [];

  const countByStatus: Record<ProjectStatus, number> = {
    todo: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  };
  for (const row of statusCounts) {
    countByStatus[row._id] = row.count;
  }

  const total = PROJECT_STATUSES.reduce((sum, s) => sum + countByStatus[s], 0);
  const completionRate = total === 0 ? 0 : Math.round((countByStatus.completed / total) * 100);

  // Running cumulative total, so the trend line reads like real growth.
  // Label includes a 2-digit year (not just the month name): with only a
  // month name, an account with activity spanning a year boundary would
  // render two different months as an identical, ambiguous "Jan" tick —
  // this is the "malformed axis label" the chart could produce.
  let cumulative = 0;
  const activity = monthly.map((row) => {
    cumulative += row.created;
    return {
      month: `${MONTH_LABELS[row._id.month - 1]} '${String(row._id.year).slice(-2)}`,
      total: cumulative,
      created: row.created,
      completed: row.completed,
      overdue: row.overdue,
    };
  });

  // Simple, transparent forecast: average delta of the last up-to-3 months,
  // projected one step forward. Computed from real data every request —
  // never a hardcoded number.
  let forecastNext: number | null = null;
  if (activity.length >= 2) {
    const window = activity.slice(-3);
    const deltas: number[] = [];
    for (let i = 1; i < window.length; i++) {
      deltas.push(window[i].total - window[i - 1].total);
    }
    const avgDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    forecastNext = Math.max(0, Math.round(activity[activity.length - 1].total + avgDelta));
  }

  // Previous-month created count, to give the "New" stat card a real delta.
  const prevCreated = activity.length >= 2 ? activity[activity.length - 2].created : 0;
  const lastCreated = activity.length >= 1 ? activity[activity.length - 1].created : 0;
  const createdDeltaPct =
    prevCreated === 0 ? (lastCreated > 0 ? 100 : 0) : Math.round(((lastCreated - prevCreated) / prevCreated) * 100);

  const avgCompletionDays =
    completionDurations.length === 0
      ? null
      : Math.round(
          (completionDurations.reduce((sum, d) => sum + d.days, 0) / completionDurations.length) * 10
        ) / 10;

  return {
    stats: {
      total,
      todo: countByStatus.todo,
      inProgress: countByStatus.in_progress,
      completed: countByStatus.completed,
      overdue: countByStatus.overdue,
      completionRate,
      newThisMonthDeltaPct: createdDeltaPct,
    },
    statusDistribution: PROJECT_STATUSES.map((status) => ({
      status,
      count: countByStatus[status],
    })),
    activity,
    forecastNext,
    avgCompletionDays,
    recentActivity: recent.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      status: r.status,
      updatedAt: r.updatedAt,
      dueDate: r.dueDate,
    })),
    upcomingDeadlines: upcomingDeadlines.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      status: r.status,
      dueDate: r.dueDate,
    })),
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;
