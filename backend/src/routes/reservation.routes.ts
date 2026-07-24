import { Router } from 'express';
import {
  createReservation,
  getUserReservations,
  getAllReservations,
  updateReservationStatus,
} from '../controllers/reservation.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', protect, createReservation);
router.get('/my-bookings', protect, getUserReservations);
router.get('/admin', protect, restrictTo(Role.ADMIN, Role.MANAGER), getAllReservations);
router.put('/:reservationId/status', protect, restrictTo(Role.ADMIN, Role.MANAGER), updateReservationStatus);

export default router;
