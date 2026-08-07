"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReview = exports.getWishlist = exports.toggleWishlist = exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.getMenuItem = exports.getMenuItems = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
// 1. Categories Controllers
const getCategories = async (_req, res) => {
    try {
        const categories = await db_1.default.category.findMany({
            include: {
                _count: {
                    select: { menuItems: true },
                },
            },
        });
        return res.status(200).json({ categories });
    }
    catch (error) {
        console.error('Fetch categories error:', error);
        return res.status(500).json({ message: 'Error retrieving categories', error });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2, 'Category name required'),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const category = await db_1.default.category.create({
            data: validation.data,
        });
        return res.status(201).json({ message: 'Category created', category });
    }
    catch (error) {
        console.error('Create category error:', error);
        return res.status(500).json({ message: 'Error creating category', error });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const category = await db_1.default.category.update({
            where: { id },
            data: validation.data,
        });
        return res.status(200).json({ message: 'Category updated', category });
    }
    catch (error) {
        console.error('Update category error:', error);
        return res.status(500).json({ message: 'Error updating category', error });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.category.delete({ where: { id } });
        return res.status(200).json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({ message: 'Error deleting category', error });
    }
};
exports.deleteCategory = deleteCategory;
// 2. Menu Items Controllers
const getMenuItems = async (req, res) => {
    try {
        const { category, search, vegOnly, sortBy, order, maxPrice, minRating } = req.query;
        const where = {};
        if (category) {
            where.category = {
                name: {
                    equals: category,
                    mode: 'insensitive',
                },
            };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { ingredients: { hasSome: [search] } },
            ];
        }
        if (vegOnly === 'true') {
            where.categoryId = {
                in: await db_1.default.category
                    .findMany({
                    where: {
                        name: {
                            in: ['Veg', 'Desserts', 'Beverages', 'South Indian', 'Ice Cream'],
                        },
                    },
                    select: { id: true },
                })
                    .then((cats) => cats.map((c) => c.id)),
            };
        }
        if (maxPrice) {
            where.price = { lte: parseFloat(maxPrice) };
        }
        if (minRating) {
            where.rating = { gte: parseFloat(minRating) };
        }
        const orderBy = {};
        if (sortBy) {
            orderBy[sortBy] = order === 'desc' ? 'desc' : 'asc';
        }
        else {
            orderBy.createdAt = 'desc';
        }
        const menuItems = await db_1.default.menuItem.findMany({
            where,
            orderBy,
            include: {
                category: {
                    select: { name: true },
                },
            },
        });
        return res.status(200).json({ menuItems });
    }
    catch (error) {
        console.error('Fetch menu items error:', error);
        return res.status(500).json({ message: 'Error retrieving menu items', error });
    }
};
exports.getMenuItems = getMenuItems;
const getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await db_1.default.menuItem.findUnique({
            where: { id },
            include: {
                category: true,
                reviews: {
                    include: {
                        user: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        return res.status(200).json({ menuItem });
    }
    catch (error) {
        console.error('Fetch menu item error:', error);
        return res.status(500).json({ message: 'Error retrieving menu item details', error });
    }
};
exports.getMenuItem = getMenuItem;
const createMenuItem = async (req, res) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2),
            description: zod_1.z.string(),
            price: zod_1.z.number().positive(),
            discount: zod_1.z.number().nonnegative().default(0),
            availability: zod_1.z.boolean().default(true),
            imageUrl: zod_1.z.string().optional(),
            categoryId: zod_1.z.string(),
            prepTime: zod_1.z.number().int().positive().default(15),
            calories: zod_1.z.number().int().positive().optional(),
            ingredients: zod_1.z.array(zod_1.z.string()).default([]),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const menuItem = await db_1.default.menuItem.create({
            data: validation.data,
        });
        return res.status(201).json({ message: 'Menu item created', menuItem });
    }
    catch (error) {
        console.error('Create menu item error:', error);
        return res.status(500).json({ message: 'Error creating menu item', error });
    }
};
exports.createMenuItem = createMenuItem;
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            description: zod_1.z.string().optional(),
            price: zod_1.z.number().positive().optional(),
            discount: zod_1.z.number().nonnegative().optional(),
            availability: zod_1.z.boolean().optional(),
            imageUrl: zod_1.z.string().optional(),
            categoryId: zod_1.z.string().optional(),
            prepTime: zod_1.z.number().int().positive().optional(),
            calories: zod_1.z.number().int().positive().optional(),
            ingredients: zod_1.z.array(zod_1.z.string()).optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const menuItem = await db_1.default.menuItem.update({
            where: { id },
            data: validation.data,
        });
        return res.status(200).json({ message: 'Menu item updated', menuItem });
    }
    catch (error) {
        console.error('Update menu item error:', error);
        return res.status(500).json({ message: 'Error updating menu item', error });
    }
};
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.menuItem.delete({ where: { id } });
        return res.status(200).json({ message: 'Menu item deleted' });
    }
    catch (error) {
        console.error('Delete menu item error:', error);
        return res.status(500).json({ message: 'Error deleting menu item', error });
    }
};
exports.deleteMenuItem = deleteMenuItem;
// 3. Wishlist Controllers
const toggleWishlist = async (req, res) => {
    try {
        const { menuItemId } = req.body;
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            include: { wishlist: true },
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const isWishlisted = user.wishlist.some((item) => item.id === menuItemId);
        if (isWishlisted) {
            await db_1.default.user.update({
                where: { id: req.user.id },
                data: {
                    wishlist: {
                        disconnect: { id: menuItemId },
                    },
                },
            });
            return res.status(200).json({ message: 'Removed from wishlist', isWishlisted: false });
        }
        else {
            await db_1.default.user.update({
                where: { id: req.user.id },
                data: {
                    wishlist: {
                        connect: { id: menuItemId },
                    },
                },
            });
            return res.status(200).json({ message: 'Added to wishlist', isWishlisted: true });
        }
    }
    catch (error) {
        console.error('Wishlist toggle error:', error);
        return res.status(500).json({ message: 'Error processing wishlist update', error });
    }
};
exports.toggleWishlist = toggleWishlist;
const getWishlist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                wishlist: {
                    include: { category: { select: { name: true } } },
                },
            },
        });
        return res.status(200).json({ wishlist: user?.wishlist || [] });
    }
    catch (error) {
        console.error('Fetch wishlist error:', error);
        return res.status(500).json({ message: 'Error fetching wishlist', error });
    }
};
exports.getWishlist = getWishlist;
// 4. Reviews Controllers
const addReview = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const schema = zod_1.z.object({
            menuItemId: zod_1.z.string(),
            rating: zod_1.z.number().min(1).max(5),
            comment: zod_1.z.string().optional(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.format() });
        }
        const { menuItemId, rating, comment } = validation.data;
        const review = await db_1.default.review.create({
            data: {
                userId: req.user.id,
                menuItemId,
                rating,
                comment,
            },
        });
        // Update menuItem overall rating
        const aggregate = await db_1.default.review.aggregate({
            where: { menuItemId },
            _avg: { rating: true },
        });
        const newRating = aggregate._avg.rating || rating;
        await db_1.default.menuItem.update({
            where: { id: menuItemId },
            data: { rating: newRating },
        });
        return res.status(201).json({ message: 'Review added successfully', review });
    }
    catch (error) {
        console.error('Add review error:', error);
        return res.status(500).json({ message: 'Error adding review', error });
    }
};
exports.addReview = addReview;
