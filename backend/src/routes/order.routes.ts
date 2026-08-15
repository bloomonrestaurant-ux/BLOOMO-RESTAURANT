import { Router } from 'express';
import {
  createOrder,
  confirmPayment,
  updateOrderStatus,
  getOrderHistory,
  getOrderById,
  getAdminOrders,
  validateCoupon,
  downloadInvoice,
  cancelUserOrder,
} from '../controllers/order.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', protect, createOrder);
router.post('/confirm-payment', protect, confirmPayment);
router.get('/history', protect, getOrderHistory);
router.get('/admin', protect, restrictTo(Role.ADMIN, Role.MANAGER), getAdminOrders);
router.post('/coupon/validate', validateCoupon);
router.get('/:id', protect, getOrderById);
router.post('/:orderId/cancel', protect, cancelUserOrder);
router.put('/:orderId/status', protect, restrictTo(Role.ADMIN, Role.MANAGER, Role.CHEF, Role.DELIVERY), updateOrderStatus);
router.get('/:id/invoice', protect, downloadInvoice);

export default router;
