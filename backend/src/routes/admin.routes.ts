import { Router } from 'express';
import { 
  getDashboardAnalytics, getTodayOrders, getSettings, updateSetting,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  getDailyItems, createDailyItem, deleteDailyItem
} from '../controllers/admin.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect, restrictTo(Role.ADMIN, Role.MANAGER));

// Analytics & Settings
router.get('/analytics', getDashboardAnalytics);
router.get('/analytics/today-orders', getTodayOrders);
router.get('/settings', getSettings);
router.post('/settings', updateSetting);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Daily Items
router.get('/daily-items', getDailyItems);
router.post('/daily-items', createDailyItem);
router.delete('/daily-items/:id', deleteDailyItem);

export default router;
