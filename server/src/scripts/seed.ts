/**
 * Database seed script — creates one demo user and a realistic, varied set
 * of sample projects owned by that user, so a fresh database has real data
 * for the dashboard's stats, activity chart, status breakdown, recent
 * activity, and upcoming deadlines to render (all of that is still computed
 * live from the database by dashboardService — this script only inserts
 * rows, it never fabricates dashboard numbers).
 *
 * Usage (from server/):
 *   npm run seed
 *
 * Demo account (see README > Demo account for details):
 *   email:    SEED_DEMO_EMAIL    env var, default demo@pulseboard.dev
 *   password: SEED_DEMO_PASSWORD env var, default DemoPass123!
 * Both are safe, non-production placeholder values — override them via
 * server/.env if you don't want the defaults.
 *
 * Safe to run more than once:
 *   - The demo user is looked up by email and upserted (name/password are
 *     refreshed deterministically; a pre-existing user's _id and original
 *     createdAt are preserved) — never a second demo user.
 *   - Only projects already owned by that demo user are removed and
 *     replaced with this run's fixed sample set — no duplicates accumulate,
 *     and no other user's projects are ever read, deleted, or touched.
 */
import dotenv from 'dotenv';
dotenv.config();

import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Project, ProjectStatus } from '../models/Project';
import { hashPassword } from '../services/authService';

const DEMO_EMAIL = (process.env.SEED_DEMO_EMAIL || 'demo@pulseboard.dev').trim().toLowerCase();
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'DemoPass123!';
const DEMO_NAME = 'Demo User';

/** Noon local time N days ago (or in the future for negative n), so seeded
 * timestamps don't collide with a midnight boundary in any timezone. */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

interface SeedProjectDef {
  title: string;
  description: string;
  status: ProjectStatus;
  /** How many days ago the project was created. */
  createdAgoDays: number;
  /** How many days ago it was last updated (<= createdAgoDays). */
  updatedAgoDays: number;
  /** Days from today the project is/was due; negative = past, null = no due date set. */
  dueOffsetDays: number | null;
}

/**
 * Fixed, hand-written sample set (not randomly generated) so the demo
 * account looks the same and is easy to reason about on every seed run.
 * createdAgoDays spans ~5 months so the dashboard's monthly activity chart
 * has more than one bucket to plot, and every required status
 * (todo / in_progress / completed / overdue) is represented more than once.
 */
const SEED_PROJECTS: SeedProjectDef[] = [
  {
    title: 'Customer Onboarding Flow Redesign',
    description:
      'Simplify the first-run signup and setup experience to reduce drop-off before users reach the dashboard.',
    status: 'todo',
    createdAgoDays: 2,
    updatedAgoDays: 2,
    dueOffsetDays: 12,
  },
  {
    title: 'Mobile App Performance Audit',
    description: 'Profile load times and re-render costs on the mobile client and file fixes for the worst offenders.',
    status: 'in_progress',
    createdAgoDays: 10,
    updatedAgoDays: 1,
    dueOffsetDays: 5,
  },
  {
    title: 'Q3 Marketing Campaign Launch',
    description: "Coordinate the Q3 product launch campaign across email, social, and the landing page.",
    status: 'completed',
    createdAgoDays: 70,
    updatedAgoDays: 52,
    dueOffsetDays: -50,
  },
  {
    title: 'API Rate Limiting Implementation',
    description: 'Add per-user rate limiting to the public API to protect against abusive traffic spikes.',
    status: 'in_progress',
    createdAgoDays: 25,
    updatedAgoDays: 3,
    dueOffsetDays: 7,
  },
  {
    title: 'Internal Wiki Migration to Notion',
    description: 'Move engineering runbooks and onboarding docs out of the old wiki and into Notion.',
    status: 'todo',
    createdAgoDays: 5,
    updatedAgoDays: 5,
    dueOffsetDays: 30,
  },
  {
    title: 'Security Penetration Test Remediation',
    description: "Work through the findings from last quarter's third-party pentest and close out the high-severity items.",
    status: 'overdue',
    createdAgoDays: 55,
    updatedAgoDays: 20,
    dueOffsetDays: -10,
  },
  {
    title: 'Payment Gateway Integration (Stripe)',
    description: 'Replace the legacy billing provider with Stripe, including webhook handling and invoice history.',
    status: 'completed',
    createdAgoDays: 130,
    updatedAgoDays: 108,
    dueOffsetDays: -105,
  },
  {
    title: 'Support Ticket Backlog Cleanup',
    description: 'Triage and close out the backlog of unanswered support tickets from the last release.',
    status: 'in_progress',
    createdAgoDays: 18,
    updatedAgoDays: 2,
    dueOffsetDays: 3,
  },
  {
    title: 'Website Accessibility Compliance Pass',
    description: 'Audit the marketing site against WCAG 2.1 AA and fix the flagged contrast and keyboard-navigation issues.',
    status: 'completed',
    createdAgoDays: 40,
    updatedAgoDays: 24,
    dueOffsetDays: -25,
  },
  {
    title: 'Data Warehouse Migration to PostgreSQL',
    description: 'Migrate the analytics warehouse off the legacy MySQL instance and onto managed PostgreSQL.',
    status: 'overdue',
    createdAgoDays: 95,
    updatedAgoDays: 60,
    dueOffsetDays: -25,
  },
  {
    title: 'Employee Onboarding Portal Revamp',
    description: 'Rebuild the internal new-hire portal with a clearer checklist and self-serve IT provisioning.',
    status: 'todo',
    createdAgoDays: 1,
    updatedAgoDays: 1,
    dueOffsetDays: 45,
  },
  {
    title: 'Holiday Season Load Testing',
    description: 'Load-test checkout and the dashboard ahead of the holiday traffic spike; scope and dates still being finalized.',
    status: 'todo',
    createdAgoDays: 8,
    updatedAgoDays: 8,
    dueOffsetDays: null,
  },
  {
    title: 'User Research: Churn Interviews Round 2',
    description: "Run a second round of exit interviews with churned customers to validate last quarter's findings.",
    status: 'in_progress',
    createdAgoDays: 33,
    updatedAgoDays: 6,
    dueOffsetDays: 14,
  },
  {
    title: 'Dashboard Widget Library v2',
    description: 'Rebuild the shared dashboard widget components with the new design tokens and theme support.',
    status: 'overdue',
    createdAgoDays: 150,
    updatedAgoDays: 100,
    dueOffsetDays: -60,
  },
];

async function upsertDemoUser(): Promise<InstanceType<typeof User>> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  // Upsert by email: creates the demo user on first run, and deterministically
  // refreshes name/passwordHash (without touching _id or original createdAt)
  // on every later run — never a second demo user.
  const user = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    { $set: { name: DEMO_NAME, passwordHash }, $setOnInsert: { email: DEMO_EMAIL } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (!user) {
    throw new Error('Failed to upsert demo user');
  }
  return user;
}

async function reseedDemoProjects(ownerId: Types.ObjectId) {
  // Scoped strictly to this owner's _id — never touches any other user's
  // projects. Deleting-then-reinserting the demo user's own projects each
  // run is what keeps the seed idempotent (a fixed set, not an accumulating
  // one) without needing an extra "is this a seed record" marker field on
  // the existing Project schema.
  const { deletedCount } = await Project.deleteMany({ owner: ownerId });

  const docs = SEED_PROJECTS.map((p) => ({
    owner: ownerId,
    title: p.title,
    description: p.description,
    status: p.status,
    dueDate: p.dueOffsetDays === null ? null : daysFromNow(p.dueOffsetDays),
    // Explicit createdAt/updatedAt on a *new* document are respected by
    // Mongoose's `timestamps` plugin (it only auto-fills a timestamp field
    // that isn't already set), so these seed dates stick instead of being
    // overwritten with "now" — this is what gives the dashboard's monthly
    // activity chart and completion-duration stats real historical spread.
    createdAt: daysAgo(p.createdAgoDays),
    updatedAt: daysAgo(p.updatedAgoDays),
  }));

  const created = await Project.create(docs);
  return { deletedCount, createdCount: created.length };
}

async function main() {
  await connectDB();

  try {
    const user = await upsertDemoUser();
    const { deletedCount, createdCount } = await reseedDemoProjects(user._id);

    const statusCounts = SEED_PROJECTS.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});

    console.log('\n[seed] Demo data ready:');
    console.log(`[seed]   user:  ${user.email} (id ${user._id})`);
    console.log(`[seed]   projects: removed ${deletedCount} previous demo project(s), inserted ${createdCount}`);
    console.log(`[seed]   status breakdown: ${JSON.stringify(statusCounts)}`);
    console.log(`[seed]   demo login -> email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}\n`);
  } finally {
    await disconnectDB();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
