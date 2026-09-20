import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as projectService from '../services/projectService';
import type { ProjectStatus } from '../models/Project';

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.userId as string;
  const { page, limit, status, search } = req.query;
  const result = await projectService.listProjects(ownerId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status: status as ProjectStatus | undefined,
    search: typeof search === 'string' ? search : undefined,
  });
  res.status(200).json(result);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.userId as string;
  const project = await projectService.createProject(ownerId, req.body ?? {});
  res.status(201).json({ project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.userId as string;
  const project = await projectService.updateProject(ownerId, req.params.id, req.body ?? {});
  res.status(200).json({ project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.userId as string;
  await projectService.deleteProject(ownerId, req.params.id);
  res.status(204).send();
});
