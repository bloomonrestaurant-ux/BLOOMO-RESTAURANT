import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ReservationStatus } from '@prisma/client';

// 1. Employee Management
export const getEmployees = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ employees });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return res.status(500).json({ message: 'Error fetching employee list', error });
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      role: z.string().min(1), // chef, waiter, manager, delivery
      email: z.string().email(),
      phone: z.string().optional(),
      salary: z.number().positive(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { name, role, email, phone, salary } = validation.data;

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const employee = await prisma.employee.create({
      data: { name, role, email, phone, salary },
    });

    return res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ message: 'Error creating employee record', error });
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().optional(),
      role: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      salary: z.number().positive().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: validation.data,
    });

    return res.status(200).json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({ message: 'Error updating employee record', error });
  }
};

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({ where: { id } });
    return res.status(200).json({ message: 'Employee record deleted' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({ message: 'Error deleting employee record', error });
  }
};

// 2. Attendance Controllers
export const checkInEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Employee already checked in for today' });
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });

    return res.status(201).json({ message: 'Checked in successfully', record });
  } catch (error) {
    console.error('Employee check-in error:', error);
    return res.status(500).json({ message: 'Error recording attendance check-in', error });
  }
};

export const checkOutEmployee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    if (!record) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: new Date(),
      },
    });

    return res.status(200).json({ message: 'Checked out successfully', record: updated });
  } catch (error) {
    console.error('Employee check-out error:', error);
    return res.status(500).json({ message: 'Error recording attendance check-out', error });
  }
};

export const getEmployeeAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
    return res.status(200).json({ attendance });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return res.status(500).json({ message: 'Error fetching attendance logs', error });
  }
};

// 3. Leaves Controllers
export const applyForLeave = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      employeeId: z.string(),
      startDate: z.string().refine((val) => !isNaN(Date.parse(val))),
      endDate: z.string().refine((val) => !isNaN(Date.parse(val))),
      reason: z.string().min(1),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { employeeId, startDate, endDate, reason } = validation.data;

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: ReservationStatus.PENDING,
      },
    });

    return res.status(201).json({ message: 'Leave request submitted', leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Error submitting leave request', error });
  }
};

export const getLeaveRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leaves = await prisma.leave.findMany({
      include: {
        employee: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ leaves });
  } catch (error) {
    console.error('Fetch leaves error:', error);
    return res.status(500).json({ message: 'Error retrieving leave requests', error });
  }
};

export const updateLeaveStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!Object.values(ReservationStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid leave status code' });
    }

    const leave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status: status as ReservationStatus },
    });

    return res.status(200).json({ message: `Leave status updated to ${status}`, leave });
  } catch (error) {
    console.error('Update leave status error:', error);
    return res.status(500).json({ message: 'Error updating leave request status', error });
  }
};
