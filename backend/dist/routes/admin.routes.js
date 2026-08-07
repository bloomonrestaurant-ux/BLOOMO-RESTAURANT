"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER));
// Analytics & Settings
router.get('/analytics', admin_controller_1.getDashboardAnalytics);
router.get('/analytics/today-orders', admin_controller_1.getTodayOrders);
router.get('/settings', admin_controller_1.getSettings);
router.post('/settings', admin_controller_1.updateSetting);
// Coupons
router.get('/coupons', admin_controller_1.getCoupons);
router.post('/coupons', admin_controller_1.createCoupon);
router.put('/coupons/:id', admin_controller_1.updateCoupon);
router.delete('/coupons/:id', admin_controller_1.deleteCoupon);
// Daily Items
router.get('/daily-items', admin_controller_1.getDailyItems);
router.post('/daily-items', admin_controller_1.createDailyItem);
router.delete('/daily-items/:id', admin_controller_1.deleteDailyItem);
exports.default = router;
