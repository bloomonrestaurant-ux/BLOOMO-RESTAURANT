import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { PaymentStatus } from '@prisma/client';

export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const monthParam = req.query.month as string | undefined;
    const yearParam = req.query.year as string | undefined;
    const todayParam = req.query.today as string | undefined;

    // Build date filter if month/year are provided
    let dateFilter: { gte: Date; lt: Date } | undefined;
    let filterMonth: number | undefined;
    let filterYear: number | undefined;

    if (todayParam === 'true') {
      // Filter for today only
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      dateFilter = { gte: startOfDay, lt: endOfDay };
    } else if (monthParam && yearParam) {
      filterMonth = parseInt(monthParam, 10); // 0-indexed (0 = Jan)
      filterYear = parseInt(yearParam, 10);
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 1);
      dateFilter = { gte: startDate, lt: endDate };
    }

    // 1. Total Revenue (Sum of finalAmount from COMPLETED/paid orders)
    const revenueAggregate = await prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _sum: {
        finalAmount: true,
      },
    });
    const totalRevenue = revenueAggregate._sum.finalAmount || 0;

    // 2. Counts
    const ordersCount = await prisma.order.count({
      where: {
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    });
    const customersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });

    // 3. Sales Over Time (Last 6 Months or month context)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let salesHistory: { name: string; sales: number }[] = [];

    if (dateFilter && filterMonth !== undefined && filterYear !== undefined) {
      // When a specific month is selected, show daily breakdown for that month
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const dailySalesMap = new Map<number, number>();
      for (let d = 1; d <= daysInMonth; d++) {
        dailySalesMap.set(d, 0);
      }

      const dailySalesRaw = await prisma.order.findMany({
        where: {
          createdAt: dateFilter,
          paymentStatus: PaymentStatus.COMPLETED,
        },
        select: {
          finalAmount: true,
          createdAt: true,
        },
      });

      dailySalesRaw.forEach((order) => {
        const day = new Date(order.createdAt).getDate();
        dailySalesMap.set(day, (dailySalesMap.get(day) || 0) + Number(order.finalAmount));
      });

      salesHistory = Array.from(dailySalesMap.entries()).map(([day, sales]) => ({
        name: `${day}`,
        sales,
      }));
    } else {
      // Default: last 6 months overview
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const monthlySalesRaw = await prisma.order.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          paymentStatus: PaymentStatus.COMPLETED,
        },
        select: {
          finalAmount: true,
          createdAt: true,
        },
      });

      const monthlySalesMap = new Map<string, number>();
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

      salesHistory = Array.from(monthlySalesMap.entries())
        .map(([name, sales]) => ({ name, sales }))
        .reverse();
    }

    // 4. Popular Dishes (Order items aggregated by MenuItem)
    // When filtering by month, we need to join through orders
    let popularDishes;
    if (dateFilter) {
      const orderIds = await prisma.order.findMany({
        where: {
          paymentStatus: PaymentStatus.COMPLETED,
          createdAt: dateFilter,
        },
        select: { id: true },
      });
      const ids = orderIds.map((o) => o.id);

      const orderItemsGrouped = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: { orderId: { in: ids } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      });

      popularDishes = await Promise.all(
        orderItemsGrouped.map(async (group) => {
          const item = await prisma.menuItem.findUnique({
            where: { id: group.menuItemId },
            select: { name: true, price: true },
          });
          return {
            name: item?.name || 'Unknown Item',
            price: item?.price || 0,
            quantity: group._sum.quantity || 0,
          };
        })
      );
    } else {
      const orderItemsGrouped = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      });

      popularDishes = await Promise.all(
        orderItemsGrouped.map(async (group) => {
          const item = await prisma.menuItem.findUnique({
            where: { id: group.menuItemId },
            select: { name: true, price: true },
          });
          return {
            name: item?.name || 'Unknown Item',
            price: item?.price || 0,
            quantity: group._sum.quantity || 0,
          };
        })
      );
    }

    return res.status(200).json({
      revenue: totalRevenue,
      orders: ordersCount,
      customers: customersCount,
      salesHistory,
      popularDishes,
      selectedMonth: filterMonth !== undefined ? filterMonth : null,
      selectedYear: filterYear !== undefined ? filterYear : null,
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    return res.status(500).json({ message: 'Error aggregating dashboard analytics', error });
  }
};

// Get today's orders list
export const getTodayOrders = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Today orders error:', error);
    return res.status(500).json({ message: 'Error fetching today orders', error });
  }
};

// Global Settings
export const getSettings = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ message: 'Error retrieving system settings', error });
  }
};

export const updateSetting = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'Setting key is required' });

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return res.status(200).json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    console.error('Update setting error:', error);
    return res.status(500).json({ message: 'Error updating system setting', error });
  }
};

// ─── Coupon CRUD ─────────────────────

export const getCoupons = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return res.status(500).json({ message: 'Error fetching coupons', error });
  }
};

export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountType, value, minOrderAmount, expiryDate } = req.body;
    if (!code || !value || !expiryDate) {
      return res.status(400).json({ message: 'Code, value, and expiry date are required' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType: discountType || 'PERCENTAGE',
        value,
        minOrderAmount: minOrderAmount || 0,
        expiryDate: new Date(expiryDate),
      },
    });

    return res.status(201).json({ message: 'Coupon created', coupon });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    console.error('Create coupon error:', error);
    return res.status(500).json({ message: 'Error creating coupon', error });
  }
};

export const updateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: req.body,
    });
    return res.status(200).json({ message: 'Coupon updated', coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    return res.status(500).json({ message: 'Error updating coupon', error });
  }
};

export const deleteCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    return res.status(200).json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ message: 'Error deleting coupon', error });
  }
};

// ─── Daily Useful Items CRUD ─────────────────────

export const getDailyItems = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.dailyItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Fetch daily items error:', error);
    return res.status(500).json({ message: 'Error fetching daily items', error });
  }
};

export const createDailyItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, quantity, unit } = req.body;
    if (!name || quantity === undefined) {
      return res.status(400).json({ message: 'Name and quantity are required' });
    }

    const item = await prisma.dailyItem.create({
      data: {
        name,
        quantity,
        unit: unit || 'kg',
      },
    });

    return res.status(201).json({ message: 'Daily item added', item });
  } catch (error) {
    console.error('Create daily item error:', error);
    return res.status(500).json({ message: 'Error creating daily item', error });
  }
};

export const deleteDailyItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dailyItem.delete({ where: { id } });
    return res.status(200).json({ message: 'Daily item removed' });
  } catch (error) {
    console.error('Delete daily item error:', error);
    return res.status(500).json({ message: 'Error deleting daily item', error });
  }
};
