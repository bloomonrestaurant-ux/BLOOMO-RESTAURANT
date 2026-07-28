import { Router } from 'express';
import authRouter from './auth.routes';
import menuRouter from './menu.routes';
import orderRouter from './order.routes';
import reservationRouter from './reservation.routes';
import inventoryRouter from './inventory.routes';
import employeeRouter from './employee.routes';
import adminRouter from './admin.routes';
import uploadRouter from './upload.routes';
const router = Router();

router.use('/auth', authRouter);
router.use('/menu', menuRouter);
router.use('/orders', orderRouter);
router.use('/reservations', reservationRouter);
router.use('/inventory', inventoryRouter);
router.use('/employees', employeeRouter);
router.use('/admin', adminRouter);
router.use('/upload', uploadRouter);

export default router;
