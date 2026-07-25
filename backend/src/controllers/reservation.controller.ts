import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ReservationStatus } from '@prisma/client';

const reservationSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date string',
  }),
  time: z.string().min(1, 'Time is required'),
  guestsCount: z.number().int().positive('Guests count must be positive'),
  occasion: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export const createReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const validation = reservationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { date, time, guestsCount, occasion, specialInstructions } = validation.data;

    const reservation = await prisma.reservation.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        time,
        guestsCount,
        occasion,
        specialInstructions,
        status: ReservationStatus.PENDING,
      },
    });

    // Create a mock email notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'EMAIL',
        title: 'Table Reservation Received',
        message: `Your reservation request at Bloomon Family Restaurant for ${guestsCount} guests on ${new Date(
          date
        ).toLocaleDateString()} at ${time} is under review. We will notify you once approved.`,
      },
    });

    return res.status(201).json({
      message: 'Reservation request submitted successfully. Awaiting manager approval.',
      reservation,
    });
  } catch (error) {
    console.error('Reservation creation error:', error);
    return res.status(500).json({ message: 'Error submitting table reservation request', error });
  }
};

export const getUserReservations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({ reservations });
  } catch (error) {
    console.error('Fetch reservations error:', error);
    return res.status(500).json({ message: 'Error retrieving your reservations list', error });
  }
};

export const getAllReservations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as ReservationStatus;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({ reservations });
  } catch (error) {
    console.error('Admin fetch reservations error:', error);
    return res.status(500).json({ message: 'Error retrieving reservations for admin', error });
  }
};

export const updateReservationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { status, adminNotes } = req.body;

    if (!Object.values(ReservationStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status code' });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: status as ReservationStatus,
        adminNotes,
      },
    });

    // Notify Customer of Approval/Rejection
    const emailSubject = status === 'APPROVED' ? 'Reservation Approved!' : 'Reservation Update';
    const emailMessage =
      status === 'APPROVED'
        ? `Dear ${reservation.user.name}, your reservation for ${reservation.guestsCount} guests on ${reservation.date.toLocaleDateString()} at ${reservation.time} has been APPROVED. We look forward to hosting you! Notes: ${adminNotes || 'None'}`
        : `Dear ${reservation.user.name}, we regret to inform you that your reservation request has been declined. Reason/Notes: ${adminNotes || 'None'}`;

    await prisma.notification.create({
      data: {
        userId: reservation.userId,
        type: 'EMAIL',
        title: emailSubject,
        message: emailMessage,
      },
    });

    console.log(`[Notification Sent to ${reservation.user.email}]: ${emailMessage}`);

    return res.status(200).json({
      message: `Reservation status changed to ${status}`,
      reservation: updated,
    });
  } catch (error) {
    console.error('Reservation update status error:', error);
    return res.status(500).json({ message: 'Error updating reservation status', error });
  }
};
