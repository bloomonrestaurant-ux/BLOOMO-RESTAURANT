import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. Inventory Controllers
export const getInventory = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    return res.status(500).json({ message: 'Error retrieving inventory items', error });
  }
};

export const createInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Item name is required'),
      quantity: z.number().nonnegative(),
      unit: z.string().min(1, 'Unit (e.g. kg) is required'),
      supplierId: z.string().optional(),
      expiryDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid expiry date',
      }),
      threshold: z.number().nonnegative().default(5.00),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const data = validation.data;
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        supplierId: data.supplierId || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        threshold: data.threshold,
      },
    });

    return res.status(201).json({ message: 'Inventory item created', item });
  } catch (error) {
    console.error('Create inventory item error:', error);
    return res.status(500).json({ message: 'Error creating inventory item', error });
  }
};

export const updateInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().optional(),
      quantity: z.number().nonnegative().optional(),
      unit: z.string().optional(),
      supplierId: z.string().optional(),
      expiryDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid expiry date',
      }),
      threshold: z.number().nonnegative().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const data = validation.data;
    const updateData: any = { ...data };
    if (data.expiryDate) {
      updateData.expiryDate = new Date(data.expiryDate);
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ message: 'Inventory item updated', item });
  } catch (error) {
    console.error('Update inventory item error:', error);
    return res.status(500).json({ message: 'Error updating inventory item', error });
  }
};

export const deleteInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.inventoryItem.delete({ where: { id } });
    return res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    return res.status(500).json({ message: 'Error deleting inventory item', error });
  }
};

export const getLowStockAlerts = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Return all items where quantity is below or equal to the threshold alert value
    const items = await prisma.inventoryItem.findMany({
      include: { supplier: true },
    });

    const lowStock = items.filter((item) => Number(item.quantity) <= Number(item.threshold));

    return res.status(200).json({ lowStock });
  } catch (error) {
    console.error('Low stock query error:', error);
    return res.status(500).json({ message: 'Error querying stock levels', error });
  }
};

// 2. Supplier Controllers
export const getSuppliers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ suppliers });
  } catch (error) {
    console.error('Fetch suppliers error:', error);
    return res.status(500).json({ message: 'Error fetching suppliers', error });
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Supplier name required'),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { name, contactName, phone, email, address } = validation.data;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName,
        phone,
        email: email || null,
        address,
      },
    });

    return res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    return res.status(500).json({ message: 'Error creating supplier records', error });
  }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const data = validation.data;
    if (data.email === '') {
      data.email = undefined;
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    return res.status(200).json({ message: 'Supplier updated successfully', supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
    return res.status(500).json({ message: 'Error updating supplier records', error });
  }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id } });
    return res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return res.status(500).json({ message: 'Error deleting supplier records', error });
  }
};
