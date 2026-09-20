import { Types } from 'mongoose';
import { Project, IProject, PROJECT_STATUSES, ProjectStatus } from '../models/Project';
import { ApiError } from '../utils/ApiError';

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string | null;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string | null;
}

export interface ListProjectsQuery {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
}

function validateStatus(status?: string): asserts status is ProjectStatus | undefined {
  if (status !== undefined && !PROJECT_STATUSES.includes(status as ProjectStatus)) {
    throw ApiError.badRequest(`status must be one of: ${PROJECT_STATUSES.join(', ')}`);
  }
}

/** Escapes regex special characters so a search string is always treated as
 * literal text, never as a regex pattern — without this, a user's search
 * input would flow straight into `new RegExp()`, which is both a
 * regex-injection risk and a potential ReDoS vector (e.g. searching for
 * "(a+)+$" could otherwise be interpreted as a pathological pattern). */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateCreateInput(input: CreateProjectInput) {
  if (!input.title || !input.title.trim()) {
    throw ApiError.badRequest('Title is required');
  }
  if (input.title.trim().length > 140) {
    throw ApiError.badRequest('Title must be 140 characters or fewer');
  }
  validateStatus(input.status);
  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    throw ApiError.badRequest('dueDate must be a valid date');
  }
}

export async function listProjects(ownerId: string, query: ListProjectsQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  // Always starts from the owner scope — search/status are additional
  // constraints layered on top, never a replacement for it, so a search
  // can never surface another user's projects.
  const filter: Record<string, unknown> = { owner: new Types.ObjectId(ownerId) };

  if (query.status) {
    validateStatus(query.status);
    filter.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const raw = query.search.trim();
    if (raw.length > 200) {
      throw ApiError.badRequest('Search query must be 200 characters or fewer');
    }
    const pattern = new RegExp(escapeRegex(raw), 'i'); // case-insensitive, literal match
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createProject(ownerId: string, input: CreateProjectInput): Promise<IProject> {
  validateCreateInput(input);

  return Project.create({
    owner: ownerId,
    title: input.title.trim(),
    description: (input.description ?? '').trim(),
    status: input.status ?? 'todo',
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
  });
}

/**
 * Ownership-scoped lookup. Every mutation goes through this so a user can
 * never read/update/delete another user's project — the id alone is not
 * enough, it must also match the authenticated owner.
 */
async function findOwnedProjectOrThrow(ownerId: string, projectId: string): Promise<IProject> {
  if (!Types.ObjectId.isValid(projectId)) {
    throw ApiError.badRequest('Invalid project id');
  }
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) {
    // 404, not 403 — avoid confirming the id exists at all for another user.
    throw ApiError.notFound('Project not found');
  }
  return project;
}

export async function updateProject(
  ownerId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<IProject> {
  const project = await findOwnedProjectOrThrow(ownerId, projectId);

  if (input.title !== undefined) {
    if (!input.title.trim()) throw ApiError.badRequest('Title cannot be empty');
    project.title = input.title.trim();
  }
  if (input.description !== undefined) {
    project.description = input.description.trim();
  }
  if (input.status !== undefined) {
    validateStatus(input.status);
    project.status = input.status;
  }
  if (input.dueDate !== undefined) {
    if (input.dueDate === null) {
      project.dueDate = null;
    } else {
      if (Number.isNaN(Date.parse(input.dueDate))) {
        throw ApiError.badRequest('dueDate must be a valid date');
      }
      project.dueDate = new Date(input.dueDate);
    }
  }

  await project.save();
  return project;
}

export async function deleteProject(ownerId: string, projectId: string): Promise<void> {
  const project = await findOwnedProjectOrThrow(ownerId, projectId);
  await project.deleteOne();
}
