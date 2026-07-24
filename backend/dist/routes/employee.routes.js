"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Apply administrative restriction
router.use(auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER));
// Employee CRUD
router.get('/', employee_controller_1.getEmployees);
router.post('/', employee_controller_1.createEmployee);
router.put('/:id', employee_controller_1.updateEmployee);
router.delete('/:id', employee_controller_1.deleteEmployee);
// Attendance logs
router.post('/check-in', employee_controller_1.checkInEmployee);
router.post('/check-out', employee_controller_1.checkOutEmployee);
router.get('/:employeeId/attendance', employee_controller_1.getEmployeeAttendance);
// Leaves logs
router.post('/leaves', employee_controller_1.applyForLeave);
router.get('/leaves/requests', employee_controller_1.getLeaveRequests);
router.put('/leaves/:leaveId/status', employee_controller_1.updateLeaveStatus);
exports.default = router;
