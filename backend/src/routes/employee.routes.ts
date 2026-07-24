import { Router } from 'express';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  checkInEmployee,
  checkOutEmployee,
  getEmployeeAttendance,
  applyForLeave,
  getLeaveRequests,
  updateLeaveStatus,
} from '../controllers/employee.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply administrative restriction
router.use(protect, restrictTo(Role.ADMIN, Role.MANAGER));

// Employee CRUD
router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// Attendance logs
router.post('/check-in', checkInEmployee);
router.post('/check-out', checkOutEmployee);
router.get('/:employeeId/attendance', getEmployeeAttendance);

// Leaves logs
router.post('/leaves', applyForLeave);
router.get('/leaves/requests', getLeaveRequests);
router.put('/leaves/:leaveId/status', updateLeaveStatus);

export default router;
