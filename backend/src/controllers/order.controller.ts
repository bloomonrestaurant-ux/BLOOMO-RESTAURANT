import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import PDFDocument from 'pdfkit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key_123', {
  apiVersion: '2023-10-16' as any,
});

// Validator schema for placing order
const orderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'Order must contain at least one item'),
  paymentMethod: z.string(), // STRIPE, RAZORPAY, UPI, COD
  orderType: z.enum(['DELIVERY', 'DINE_IN', 'TAKEAWAY']).optional().default('DELIVERY'),
  addressId: z.string().optional(),
  tableNumber: z.string().optional(),
  pickupNotes: z.string().optional(),
  couponCode: z.string().optional(),
});

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const validation = orderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { items, paymentMethod, orderType = 'DELIVERY', addressId, tableNumber, pickupNotes, couponCode } = validation.data;

    // 0. Check if restaurant is currently OPEN
    const storeStatus = await prisma.setting.findUnique({ where: { key: 'is_open' } });
    if (storeStatus && storeStatus.value === 'false') {
      const openingSetting = await prisma.setting.findUnique({ where: { key: 'opening_time' } });
      const openTime = openingSetting?.value || '11:00 AM';
      return res.status(403).json({
        message: `Restaurant is currently closed! You cannot place orders right now. Please come tomorrow morning at ${openTime}.`,
        isClosed: true,
      });
    }

    // 1. Fetch / Build Address based on Order Type
    let fullAddressString = '';
    if (orderType === 'DELIVERY') {
      if (!addressId) {
        return res.status(400).json({ message: 'Delivery address is required for online delivery' });
      }
      const addressRecord = await prisma.address.findUnique({ where: { id: addressId } });
      if (!addressRecord || addressRecord.userId !== req.user.id) {
        return res.status(400).json({ message: 'Invalid address selected' });
      }
      fullAddressString = `Delivery: ${addressRecord.street}, ${addressRecord.city}, ${addressRecord.state} - ${addressRecord.postalCode}`;
    } else if (orderType === 'DINE_IN') {
      fullAddressString = `Dine-In: ${tableNumber ? (tableNumber.toLowerCase().includes('table') ? tableNumber : `Table ${tableNumber}`) : 'Table Seating'}`;
    } else if (orderType === 'TAKEAWAY') {
      fullAddressString = `Takeaway / Parcel: ${pickupNotes || 'Counter Pickup'}`;
    }

    // 2. Calculate Pricing
    let subtotal = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      // Extract base UUID if size suffix is appended (e.g. uuid-half, uuid-single, uuid-family)
      const parts = item.menuItemId.split('-');
      let baseId = item.menuItemId;
      let sizeSuffix: string | null = null;
      if (parts.length > 5) {
        sizeSuffix = parts[parts.length - 1];
        baseId = parts.slice(0, 5).join('-');
      }

      let menuItem = await prisma.menuItem.findUnique({ where: { id: baseId } });
      if (!menuItem) {
        menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      }

      if (!menuItem || !menuItem.availability) {
        return res.status(404).json({ message: `Menu item not found or unavailable: ${item.menuItemId}` });
      }

      // Determine size-based price if applicable
      let itemPrice = Number(menuItem.price) - Number(menuItem.discount);
      if (sizeSuffix) {
        if (sizeSuffix === 'half' && menuItem.halfPrice) {
          itemPrice = Number(menuItem.halfPrice);
        } else if (sizeSuffix === 'family' && menuItem.familyPrice) {
          itemPrice = Number(menuItem.familyPrice);
        }
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsToCreate.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    // 3. Process Coupon Discount
    let discount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findFirst({
        where: { code: { equals: cleanCode, mode: 'insensitive' } }
      });
      if (coupon && coupon.active && new Date() < coupon.expiryDate && subtotal >= Number(coupon.minOrderAmount)) {
        couponId = coupon.id;
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * Number(coupon.value)) / 100;
        } else {
          discount = Number(coupon.value);
        }
      }
    }

    // 4. Calculate Taxes & Delivery (GST 5% + Delivery if applicable)
    const gstRate = 0.05;
    const tax = subtotal * gstRate;
    const deliveryCharges = orderType === 'DELIVERY' ? (subtotal > 1000 ? 0.00 : 40.00) : 0.00; // Free delivery for Dine-In/Takeaway or >1000 INR
    const finalAmount = subtotal - discount + tax + deliveryCharges;

    // 5. Create Order
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount: subtotal,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
        address: fullAddressString,
        couponId,
        discountAmount: discount,
        deliveryCharges,
        tax,
        finalAmount,
        items: {
          create: orderItemsToCreate,
        },
        tracking: {
          create: {
            status: OrderStatus.PENDING,
            description: 'Order placed, awaiting payment confirmation.',
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        tracking: true,
      },
    });

    // 6. Handle Payment Intent generation (Stripe Integration)
    let paymentIntentClientSecret = '';
    if (paymentMethod === 'STRIPE') {
      try {
        const amountInPaise = Math.round(finalAmount * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInPaise,
          currency: 'inr',
          metadata: { orderId: order.id, userId: req.user.id },
        });
        paymentIntentClientSecret = paymentIntent.client_secret || '';

        // Add payment transaction record
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: finalAmount,
            paymentMethod: 'Stripe',
            transactionId: paymentIntent.id,
            status: 'PENDING',
          },
        });
      } catch (stripeErr) {
        console.error('Stripe Integration Failed:', stripeErr);
        // Add a mock transaction ID for fallback simulation
        const mockTransactionId = `mock_stripe_${Date.now()}`;
        paymentIntentClientSecret = `mock_secret_for_order_${order.id}`;

        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: finalAmount,
            paymentMethod: 'Stripe (Mock)',
            transactionId: mockTransactionId,
            status: 'PENDING',
          },
        });
      }
    } else {
      // Create transaction for COD / UPI
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: finalAmount,
          paymentMethod,
          transactionId: `${paymentMethod.toLowerCase()}_${Date.now()}`,
          status: paymentMethod === 'COD' ? 'PENDING' : 'SUCCESS', // Mock Instant success for UPI
        },
      });

      if (paymentMethod !== 'COD') {
        // Auto transition to PAID and PREPARING
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            status: OrderStatus.PREPARING,
          },
        });
        await prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: OrderStatus.PREPARING,
            description: 'Payment successful. Kitchen has started preparing your order.',
          },
        });
      }
    }

    // Award Loyalty Points (1 point for every 10 INR spent)
    const pointsEarned = Math.floor(finalAmount / 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        loyaltyPoints: { increment: pointsEarned },
      },
    });

    return res.status(201).json({
      message: 'Order created successfully',
      orderId: order.id,
      finalAmount,
      paymentIntentClientSecret,
      order,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ message: 'Error processing order placement', error });
  }
};

// Confirm/Complete payment simulation (useful for Stripe Webhooks or manual confirmation)
export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, transactionId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Order ID required' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        status: OrderStatus.PREPARING,
      },
    });

    await prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: 'SUCCESS',
        transactionId: transactionId || 'simulated_success',
      },
    });

    await prisma.orderTracking.create({
      data: {
        orderId,
        status: OrderStatus.PREPARING,
        description: 'Payment verified. Chef is heating up the kitchen!',
      },
    });

    return res.status(200).json({ message: 'Payment confirmed successfully.' });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return res.status(500).json({ message: 'Error confirming payment', error });
  }
};

// Tracking and Status updates (Admin/Staff role required)
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, description } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    await prisma.orderTracking.create({
      data: {
        orderId,
        status: status as OrderStatus,
        description: description || `Status updated to ${status}`,
      },
    });

    return res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Error updating order status', error });
  }
};

// Fetch orders
export const getOrderHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { menuItem: { select: { name: true, imageUrl: true } } },
        },
        tracking: { orderBy: { updatedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Order history error:', error);
    return res.status(500).json({ message: 'Error fetching order history', error });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
        tracking: { orderBy: { updatedAt: 'asc' } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Restrict access to order creator or admins/staff
    if (req.user?.role === 'CUSTOMER' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Fetch order error:', error);
    return res.status(500).json({ message: 'Error fetching order details', error });
  }
};

export const getAdminOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, date, month, year } = req.query;
    const where: any = {};
    if (status) {
      where.status = status as OrderStatus;
    }

    // Date filtering
    if (date) {
      // Specific date: YYYY-MM-DD
      const d = new Date(date as string);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
      where.createdAt = { gte: startOfDay, lt: endOfDay };
    } else if (month !== undefined && year) {
      // Month + Year filter (month is 0-indexed)
      const m = parseInt(month as string, 10);
      const y = parseInt(year as string, 10);
      const startDate = new Date(y, m, 1);
      const endDate = new Date(y, m + 1, 1);
      where.createdAt = { gte: startDate, lt: endDate };
    } else {
      // Default: today's orders
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      where.createdAt = { gte: startOfDay, lt: endOfDay };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, phone: true, email: true } },
        items: {
          include: {
            menuItem: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Admin order fetch error:', error);
    return res.status(500).json({ message: 'Error fetching orders for admin', error });
  }
};

// Validate Coupons
export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) {
      return res.status(400).json({ message: 'Coupon code and order amount are required' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const coupon = await prisma.coupon.findFirst({
      where: { code: { equals: cleanCode, mode: 'insensitive' } },
    });

    if (!coupon || !coupon.active || new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: 'Coupon code is invalid or expired' });
    }

    if (Number(amount) < Number(coupon.minOrderAmount)) {
      return res.status(400).json({
        message: `Min order amount of INR ${coupon.minOrderAmount} required for this coupon`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (Number(amount) * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discount,
      message: 'Coupon code applied successfully',
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ message: 'Error validating coupon code', error });
  }
};

// Download Invoice PDF
export const downloadInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user?.role === 'CUSTOMER' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);

    doc.pipe(res);

    // Document Header
    doc
      .fillColor('#D4AF37')
      .fontSize(20)
      .text('BLOOMON FAMILY RESTAURANT', 50, 50, { align: 'left' })
      .fillColor('#333333')
      .fontSize(10)
      .text('Geesukonda Main Road, Dharmaram, Warangal', 50, 75)
      .text('Phone: +91 93920 54442 | Support: contact@bloomon.com', 50, 90)
      .moveDown();

    // Invoice Meta
    doc
      .fontSize(16)
      .text('INVOICE', 50, 130)
      .fontSize(10)
      .text(`Invoice ID: ${order.id}`, 50, 150)
      .text(`Date: ${order.createdAt.toLocaleDateString()}`, 50, 165)
      .text(`Customer Name: ${order.user.name}`, 50, 180)
      .text(`Shipping Address: ${order.address}`, 50, 195)
      .moveDown(2);

    // Table Header
    const tableTop = 230;
    doc.font('Helvetica-Bold');
    doc.text('Item Description', 50, tableTop);
    doc.text('Quantity', 250, tableTop, { width: 50, align: 'right' });
    doc.text('Price (INR)', 350, tableTop, { width: 80, align: 'right' });
    doc.text('Total (INR)', 450, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();

    // Table Body
    let y = tableTop + 25;
    doc.font('Helvetica');
    for (const item of order.items) {
      const itemTotal = Number(item.price) * item.quantity;
      doc.text(item.menuItem.name, 50, y);
      doc.text(item.quantity.toString(), 250, y, { width: 50, align: 'right' });
      doc.text(Number(item.price).toFixed(2), 350, y, { width: 80, align: 'right' });
      doc.text(itemTotal.toFixed(2), 450, y, { width: 80, align: 'right' });
      y += 20;
    }

    doc.moveTo(50, y).lineTo(530, y).stroke();
    y += 10;

    // Totals
    doc.text('Subtotal:', 350, y, { width: 80, align: 'right' });
    doc.text(Number(order.totalAmount).toFixed(2), 450, y, { width: 80, align: 'right' });
    y += 15;

    doc.text('Discount:', 350, y, { width: 80, align: 'right' });
    doc.text(`-${Number(order.discountAmount).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
    y += 15;

    doc.text('GST Tax (5%):', 350, y, { width: 80, align: 'right' });
    doc.text(Number(order.tax).toFixed(2), 450, y, { width: 80, align: 'right' });
    y += 15;

    doc.text('Delivery Fee:', 350, y, { width: 80, align: 'right' });
    doc.text(Number(order.deliveryCharges).toFixed(2), 450, y, { width: 80, align: 'right' });
    y += 15;

    doc.font('Helvetica-Bold');
    doc.text('Final Amount:', 350, y, { width: 80, align: 'right' });
    doc.text(Number(order.finalAmount).toFixed(2), 450, y, { width: 80, align: 'right' });

    // Footer
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#999999')
      .text('Thank you for dining with Bloomon Family Restaurant!', 50, 700, { align: 'center' });

    doc.end();
    return;
  } catch (error) {
    console.error('Invoice print error:', error);
    return res.status(500).json({ message: 'Error generating PDF invoice', error });
  }
};

// Customer Cancel Order
export const cancelUserOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership (unless admin/manager)
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    }

    // Cannot cancel if already DELIVERED or CANCELLED
    if (order.status === OrderStatus.DELIVERED) {
      return res.status(400).json({ message: 'Order has already been delivered and cannot be cancelled.' });
    }
    if (order.status === OrderStatus.CANCELLED) {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    // Refund if already paid
    let refundIssued = false;
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          walletBalance: { increment: order.finalAmount },
        },
      });
      await prisma.walletTransaction.create({
        data: {
          userId: order.userId,
          amount: order.finalAmount,
          type: 'CREDIT',
          description: `Refund for cancelled Order #${order.id.slice(-6).toUpperCase()}`,
        },
      });
      refundIssued = true;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: refundIssued ? PaymentStatus.REFUNDED : order.paymentStatus,
      },
    });

    await prisma.orderTracking.create({
      data: {
        orderId,
        status: OrderStatus.CANCELLED,
        description: reason || 'Order cancelled by customer. Refund processed if applicable.',
      },
    });

    return res.status(200).json({
      message: 'Order cancelled successfully',
      refundIssued,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: 'Error cancelling order', error });
  }
};
