"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSuppliers = exports.getLowStockAlerts = exports.deleteInventoryItem = exports.updateInventoryItem = exports.createInventoryItem = exports.getInventory = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
// 1. Inventory Controllers
const getInventory = async (_req, res) => {
    try {
        const items = await db_1.default.inventoryItem.findMany({
            include: {
                supplier: { select: { name: true } },
            },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ items });
    }
    catch (error) {
        console.error('Fetch inventory error:', error);
        return res.status(500).json({ message: 'Error retrieving inventory items', error });
    }
};
exports.getInventory = getInventory;
const createInventoryItem = async (req, res) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1, 'Item name is required'),
            quantity: zod_1.z.number().nonnegative(),
            unit: zod_1.z.string().min(1, 'Unit (e.g. kg) is required'),
            supplierId: zod_1.z.string().optional(),
            expiryDate: zod_1.z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
                message: 'Invalid expiry date',
            }),
            threshold: zod_1.z.number().nonnegative().default(5.00),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const data = validation.data;
        const item = await db_1.default.inventoryItem.create({
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
    }
    catch (error) {
        console.error('Create inventory item error:', error);
        return res.status(500).json({ message: 'Error creating inventory item', error });
    }
};
exports.createInventoryItem = createInventoryItem;
const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = zod_1.z.object({
            name: zod_1.z.string().optional(),
            quantity: zod_1.z.number().nonnegative().optional(),
            unit: zod_1.z.string().optional(),
            supplierId: zod_1.z.string().optional(),
            expiryDate: zod_1.z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
                message: 'Invalid expiry date',
            }),
            threshold: zod_1.z.number().nonnegative().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const data = validation.data;
        const updateData = { ...data };
        if (data.expiryDate) {
            updateData.expiryDate = new Date(data.expiryDate);
        }
        const item = await db_1.default.inventoryItem.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json({ message: 'Inventory item updated', item });
    }
    catch (error) {
        console.error('Update inventory item error:', error);
        return res.status(500).json({ message: 'Error updating inventory item', error });
    }
};
exports.updateInventoryItem = updateInventoryItem;
const deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.inventoryItem.delete({ where: { id } });
        return res.status(200).json({ message: 'Inventory item deleted successfully' });
    }
    catch (error) {
        console.error('Delete inventory item error:', error);
        return res.status(500).json({ message: 'Error deleting inventory item', error });
    }
};
exports.deleteInventoryItem = deleteInventoryItem;
const getLowStockAlerts = async (_req, res) => {
    try {
        // Return all items where quantity is below or equal to the threshold alert value
        const items = await db_1.default.inventoryItem.findMany({
            include: { supplier: true },
        });
        const lowStock = items.filter((item) => Number(item.quantity) <= Number(item.threshold));
        return res.status(200).json({ lowStock });
    }
    catch (error) {
        console.error('Low stock query error:', error);
        return res.status(500).json({ message: 'Error querying stock levels', error });
    }
};
exports.getLowStockAlerts = getLowStockAlerts;
// 2. Supplier Controllers
const getSuppliers = async (_req, res) => {
    try {
        const suppliers = await db_1.default.supplier.findMany({
            include: {
                _count: {
                    select: { inventoryItems: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ suppliers });
    }
    catch (error) {
        console.error('Fetch suppliers error:', error);
        return res.status(500).json({ message: 'Error fetching suppliers', error });
    }
};
exports.getSuppliers = getSuppliers;
const createSupplier = async (req, res) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1, 'Supplier name required'),
            contactName: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(),
            email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
            address: zod_1.z.string().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const { name, contactName, phone, email, address } = validation.data;
        const supplier = await db_1.default.supplier.create({
            data: {
                name,
                contactName,
                phone,
                email: email || null,
                address,
            },
        });
        return res.status(201).json({ message: 'Supplier created successfully', supplier });
    }
    catch (error) {
        console.error('Create supplier error:', error);
        return res.status(500).json({ message: 'Error creating supplier records', error });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = zod_1.z.object({
            name: zod_1.z.string().optional(),
            contactName: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(),
            email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
            address: zod_1.z.string().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const data = validation.data;
        if (data.email === '') {
            data.email = undefined;
        }
        const supplier = await db_1.default.supplier.update({
            where: { id },
            data,
        });
        return res.status(200).json({ message: 'Supplier updated successfully', supplier });
    }
    catch (error) {
        console.error('Update supplier error:', error);
        return res.status(500).json({ message: 'Error updating supplier records', error });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.supplier.delete({ where: { id } });
        return res.status(200).json({ message: 'Supplier deleted successfully' });
    }
    catch (error) {
        console.error('Delete supplier error:', error);
        return res.status(500).json({ message: 'Error deleting supplier records', error });
    }
};
exports.deleteSupplier = deleteSupplier;
