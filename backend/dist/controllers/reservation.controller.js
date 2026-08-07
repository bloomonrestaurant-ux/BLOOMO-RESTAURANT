"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReservationStatus = exports.getAllReservations = exports.getUserReservations = exports.createReservation = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
const reservationSchema = zod_1.z.object({
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date string',
    }),
    time: zod_1.z.string().min(1, 'Time is required'),
    guestsCount: zod_1.z.number().int().positive('Guests count must be positive'),
    occasion: zod_1.z.string().optional(),
    specialInstructions: zod_1.z.string().optional(),
});
const createReservation = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const validation = reservationSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const { date, time, guestsCount, occasion, specialInstructions } = validation.data;
        const reservation = await db_1.default.reservation.create({
            data: {
                userId: req.user.id,
                date: new Date(date),
                time,
                guestsCount,
                occasion,
                specialInstructions,
                status: client_1.ReservationStatus.PENDING,
            },
        });
        // Create a mock email notification
        await db_1.default.notification.create({
            data: {
                userId: req.user.id,
                type: 'EMAIL',
                title: 'Table Reservation Received',
                message: `Your reservation request at Bloomon Family Restaurant for ${guestsCount} guests on ${new Date(date).toLocaleDateString()} at ${time} is under review. We will notify you once approved.`,
            },
        });
        return res.status(201).json({
            message: 'Reservation request submitted successfully. Awaiting manager approval.',
            reservation,
        });
    }
    catch (error) {
        console.error('Reservation creation error:', error);
        return res.status(500).json({ message: 'Error submitting table reservation request', error });
    }
};
exports.createReservation = createReservation;
const getUserReservations = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const reservations = await db_1.default.reservation.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' },
        });
        return res.status(200).json({ reservations });
    }
    catch (error) {
        console.error('Fetch reservations error:', error);
        return res.status(500).json({ message: 'Error retrieving your reservations list', error });
    }
};
exports.getUserReservations = getUserReservations;
const getAllReservations = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        const reservations = await db_1.default.reservation.findMany({
            where,
            include: {
                user: { select: { name: true, email: true, phone: true } },
            },
            orderBy: { date: 'desc' },
        });
        return res.status(200).json({ reservations });
    }
    catch (error) {
        console.error('Admin fetch reservations error:', error);
        return res.status(500).json({ message: 'Error retrieving reservations for admin', error });
    }
};
exports.getAllReservations = getAllReservations;
const updateReservationStatus = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { status, adminNotes } = req.body;
        if (!Object.values(client_1.ReservationStatus).includes(status)) {
            return res.status(400).json({ message: 'Invalid status code' });
        }
        const reservation = await db_1.default.reservation.findUnique({
            where: { id: reservationId },
            include: { user: { select: { name: true, email: true } } },
        });
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        const updated = await db_1.default.reservation.update({
            where: { id: reservationId },
            data: {
                status: status,
                adminNotes,
            },
        });
        // Notify Customer of Approval/Rejection
        const emailSubject = status === 'APPROVED' ? 'Reservation Approved!' : 'Reservation Update';
        const emailMessage = status === 'APPROVED'
            ? `Dear ${reservation.user.name}, your reservation for ${reservation.guestsCount} guests on ${reservation.date.toLocaleDateString()} at ${reservation.time} has been APPROVED. We look forward to hosting you! Notes: ${adminNotes || 'None'}`
            : `Dear ${reservation.user.name}, we regret to inform you that your reservation request has been declined. Reason/Notes: ${adminNotes || 'None'}`;
        await db_1.default.notification.create({
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
    }
    catch (error) {
        console.error('Reservation update status error:', error);
        return res.status(500).json({ message: 'Error updating reservation status', error });
    }
};
exports.updateReservationStatus = updateReservationStatus;
