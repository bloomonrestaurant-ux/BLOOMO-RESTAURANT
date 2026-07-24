"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveStatus = exports.getLeaveRequests = exports.applyForLeave = exports.getEmployeeAttendance = exports.checkOutEmployee = exports.checkInEmployee = exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployees = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
// 1. Employee Management
const getEmployees = async (req, res) => {
    try {
        const employees = await db_1.default.employee.findMany({
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ employees });
    }
    catch (error) {
        console.error('Fetch employees error:', error);
        return res.status(500).json({ message: 'Error fetching employee list', error });
    }
};
exports.getEmployees = getEmployees;
const createEmployee = async (req, res) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1),
            role: zod_1.z.string().min(1), // chef, waiter, manager, delivery
            email: zod_1.z.string().email(),
            phone: zod_1.z.string().optional(),
            salary: zod_1.z.number().positive(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const { name, role, email, phone, salary } = validation.data;
        const existing = await db_1.default.employee.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Employee with this email already exists' });
        }
        const employee = await db_1.default.employee.create({
            data: { name, role, email, phone, salary },
        });
        return res.status(201).json({ message: 'Employee created successfully', employee });
    }
    catch (error) {
        console.error('Create employee error:', error);
        return res.status(500).json({ message: 'Error creating employee record', error });
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = zod_1.z.object({
            name: zod_1.z.string().optional(),
            role: zod_1.z.string().optional(),
            email: zod_1.z.string().email().optional(),
            phone: zod_1.z.string().optional(),
            salary: zod_1.z.number().positive().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const employee = await db_1.default.employee.update({
            where: { id },
            data: validation.data,
        });
        return res.status(200).json({ message: 'Employee updated successfully', employee });
    }
    catch (error) {
        console.error('Update employee error:', error);
        return res.status(500).json({ message: 'Error updating employee record', error });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.employee.delete({ where: { id } });
        return res.status(200).json({ message: 'Employee record deleted' });
    }
    catch (error) {
        console.error('Delete employee error:', error);
        return res.status(500).json({ message: 'Error deleting employee record', error });
    }
};
exports.deleteEmployee = deleteEmployee;
// 2. Attendance Controllers
const checkInEmployee = async (req, res) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId)
            return res.status(400).json({ message: 'Employee ID is required' });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await db_1.default.attendance.findFirst({
            where: {
                employeeId,
                date: today,
            },
        });
        if (existing) {
            return res.status(400).json({ message: 'Employee already checked in for today' });
        }
        const record = await db_1.default.attendance.create({
            data: {
                employeeId,
                date: today,
                checkIn: new Date(),
                status: 'PRESENT',
            },
        });
        return res.status(201).json({ message: 'Checked in successfully', record });
    }
    catch (error) {
        console.error('Employee check-in error:', error);
        return res.status(500).json({ message: 'Error recording attendance check-in', error });
    }
};
exports.checkInEmployee = checkInEmployee;
const checkOutEmployee = async (req, res) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId)
            return res.status(400).json({ message: 'Employee ID is required' });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const record = await db_1.default.attendance.findFirst({
            where: {
                employeeId,
                date: today,
            },
        });
        if (!record) {
            return res.status(400).json({ message: 'No check-in record found for today' });
        }
        const updated = await db_1.default.attendance.update({
            where: { id: record.id },
            data: {
                checkOut: new Date(),
            },
        });
        return res.status(200).json({ message: 'Checked out successfully', record: updated });
    }
    catch (error) {
        console.error('Employee check-out error:', error);
        return res.status(500).json({ message: 'Error recording attendance check-out', error });
    }
};
exports.checkOutEmployee = checkOutEmployee;
const getEmployeeAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const attendance = await db_1.default.attendance.findMany({
            where: { employeeId },
            orderBy: { date: 'desc' },
        });
        return res.status(200).json({ attendance });
    }
    catch (error) {
        console.error('Fetch attendance error:', error);
        return res.status(500).json({ message: 'Error fetching attendance logs', error });
    }
};
exports.getEmployeeAttendance = getEmployeeAttendance;
// 3. Leaves Controllers
const applyForLeave = async (req, res) => {
    try {
        const schema = zod_1.z.object({
            employeeId: zod_1.z.string(),
            startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val))),
            endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val))),
            reason: zod_1.z.string().min(1),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const { employeeId, startDate, endDate, reason } = validation.data;
        const leave = await db_1.default.leave.create({
            data: {
                employeeId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: client_1.ReservationStatus.PENDING,
            },
        });
        return res.status(201).json({ message: 'Leave request submitted', leave });
    }
    catch (error) {
        console.error('Apply leave error:', error);
        return res.status(500).json({ message: 'Error submitting leave request', error });
    }
};
exports.applyForLeave = applyForLeave;
const getLeaveRequests = async (req, res) => {
    try {
        const leaves = await db_1.default.leave.findMany({
            include: {
                employee: { select: { name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ leaves });
    }
    catch (error) {
        console.error('Fetch leaves error:', error);
        return res.status(500).json({ message: 'Error retrieving leave requests', error });
    }
};
exports.getLeaveRequests = getLeaveRequests;
const updateLeaveStatus = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { status } = req.body;
        if (!Object.values(client_1.ReservationStatus).includes(status)) {
            return res.status(400).json({ message: 'Invalid leave status code' });
        }
        const leave = await db_1.default.leave.update({
            where: { id: leaveId },
            data: { status: status },
        });
        return res.status(200).json({ message: `Leave status updated to ${status}`, leave });
    }
    catch (error) {
        console.error('Update leave status error:', error);
        return res.status(500).json({ message: 'Error updating leave request status', error });
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
