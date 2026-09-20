import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getDashboardSummary } from '../services/dashboardService';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.userId as string;
  const summary = await getDashboardSummary(ownerId);
  res.status(200).json(summary);
});
