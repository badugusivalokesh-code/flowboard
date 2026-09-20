import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
