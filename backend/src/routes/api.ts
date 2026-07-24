import { Router } from 'express';
import authRouter from './auth.routes';
import menuRouter from './menu.routes';
import orderRouter from './order.routes';
import reservationRouter from './reservation.routes';
import inventoryRouter from './inventory.routes';
import employeeRouter from './employee.routes';
import adminRouter from './admin.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/menu', menuRouter);
router.use('/orders', orderRouter);
router.use('/reservations', reservationRouter);
router.use('/inventory', inventoryRouter);
router.use('/employees', employeeRouter);
router.use('/admin', adminRouter);

export default router;
