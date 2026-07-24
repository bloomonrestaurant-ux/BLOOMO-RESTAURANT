import { Router } from 'express';
import { getDashboardAnalytics, getSettings, updateSetting } from '../controllers/admin.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect, restrictTo(Role.ADMIN, Role.MANAGER));

router.get('/analytics', getDashboardAnalytics);
router.get('/settings', getSettings);
router.post('/settings', updateSetting);

export default router;
