"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSetting = exports.getSettings = exports.getDashboardAnalytics = void 0;
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
const getDashboardAnalytics = async (req, res) => {
    try {
        // 1. Total Revenue (Sum of finalAmount from COMPLETED/paid orders)
        const revenueAggregate = await db_1.default.order.aggregate({
            where: {
                paymentStatus: client_1.PaymentStatus.COMPLETED,
            },
            _sum: {
                finalAmount: true,
            },
        });
        const totalRevenue = revenueAggregate._sum.finalAmount || 0;
        // 2. Counts
        const ordersCount = await db_1.default.order.count();
        const customersCount = await db_1.default.user.count({ where: { role: 'CUSTOMER' } });
        const reservationsCount = await db_1.default.reservation.count({ where: { status: 'PENDING' } });
        // 3. Low Stock Items count
        const inventoryItems = await db_1.default.inventoryItem.findMany();
        const lowStockCount = inventoryItems.filter((item) => Number(item.quantity) <= Number(item.threshold)).length;
        // 4. Sales Over Time (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        const monthlySalesRaw = await db_1.default.order.findMany({
            where: {
                createdAt: { gte: sixMonthsAgo },
                paymentStatus: client_1.PaymentStatus.COMPLETED,
            },
            select: {
                finalAmount: true,
                createdAt: true,
            },
        });
        // Group sales data by month
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlySalesMap = new Map();
        // Prepopulate map with last 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
            monthlySalesMap.set(label, 0);
        }
        monthlySalesRaw.forEach((order) => {
            const date = new Date(order.createdAt);
            const label = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
            if (monthlySalesMap.has(label)) {
                monthlySalesMap.set(label, (monthlySalesMap.get(label) || 0) + Number(order.finalAmount));
            }
        });
        const salesHistory = Array.from(monthlySalesMap.entries())
            .map(([name, sales]) => ({ name, sales }))
            .reverse();
        // 5. Popular Dishes (Order items aggregated by MenuItem)
        const orderItemsGrouped = await db_1.default.orderItem.groupBy({
            by: ['menuItemId'],
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 5,
        });
        const popularDishes = await Promise.all(orderItemsGrouped.map(async (group) => {
            const item = await db_1.default.menuItem.findUnique({
                where: { id: group.menuItemId },
                select: { name: true, price: true },
            });
            return {
                name: item?.name || 'Unknown Item',
                price: item?.price || 0,
                quantity: group._sum.quantity || 0,
            };
        }));
        return res.status(200).json({
            revenue: totalRevenue,
            orders: ordersCount,
            customers: customersCount,
            pendingReservations: reservationsCount,
            lowStockItems: lowStockCount,
            salesHistory,
            popularDishes,
        });
    }
    catch (error) {
        console.error('Analytics aggregation error:', error);
        return res.status(500).json({ message: 'Error aggregating dashboard analytics', error });
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
// Global Settings
const getSettings = async (req, res) => {
    try {
        const settings = await db_1.default.setting.findMany();
        return res.status(200).json({ settings });
    }
    catch (error) {
        console.error('Fetch settings error:', error);
        return res.status(500).json({ message: 'Error retrieving system settings', error });
    }
};
exports.getSettings = getSettings;
const updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key)
            return res.status(400).json({ message: 'Setting key is required' });
        const setting = await db_1.default.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        return res.status(200).json({ message: 'Setting updated successfully', setting });
    }
    catch (error) {
        console.error('Update setting error:', error);
        return res.status(500).json({ message: 'Error updating system setting', error });
    }
};
exports.updateSetting = updateSetting;
