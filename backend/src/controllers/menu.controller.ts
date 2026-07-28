import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. Categories Controllers
export const getCategories = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ message: 'Error retrieving categories', error });
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2, 'Category name required'),
      description: z.string().optional(),
      image: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const category = await prisma.category.create({
      data: validation.data,
    });

    return res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Error creating category', error });
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      image: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const category = await prisma.category.update({
      where: { id },
      data: validation.data,
    });

    return res.status(200).json({ message: 'Category updated', category });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Error updating category', error });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Error deleting category', error });
  }
};

// 2. Menu Items Controllers
export const getMenuItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, vegOnly, sortBy, order, maxPrice, minRating } = req.query;

    const where: any = {};

    if (category) {
      where.category = {
        name: {
          equals: category as string,
          mode: 'insensitive',
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { ingredients: { hasSome: [search as string] } },
      ];
    }

    if (vegOnly === 'true') {
      where.categoryId = {
        in: await prisma.category
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
      where.price = { lte: parseFloat(maxPrice as string) };
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating as string) };
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = order === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    return res.status(200).json({ menuItems });
  } catch (error) {
    console.error('Fetch menu items error:', error);
    return res.status(500).json({ message: 'Error retrieving menu items', error });
  }
};

export const getMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const menuItem = await prisma.menuItem.findUnique({
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
  } catch (error) {
    console.error('Fetch menu item error:', error);
    return res.status(500).json({ message: 'Error retrieving menu item details', error });
  }
};

export const createMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string(),
      price: z.number().positive(),
      discount: z.number().nonnegative().default(0),
      availability: z.boolean().default(true),
      imageUrl: z.string().optional(),
      categoryId: z.string(),
      prepTime: z.number().int().positive().default(15),
      calories: z.number().int().positive().optional(),
      ingredients: z.array(z.string()).default([]),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const menuItem = await prisma.menuItem.create({
      data: validation.data,
    });

    return res.status(201).json({ message: 'Menu item created', menuItem });
  } catch (error) {
    console.error('Create menu item error:', error);
    return res.status(500).json({ message: 'Error creating menu item', error });
  }
};

export const updateMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      discount: z.number().nonnegative().optional(),
      availability: z.boolean().optional(),
      imageUrl: z.string().optional(),
      categoryId: z.string().optional(),
      prepTime: z.number().int().positive().optional(),
      calories: z.number().int().positive().optional(),
      ingredients: z.array(z.string()).optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: validation.data,
    });

    return res.status(200).json({ message: 'Menu item updated', menuItem });
  } catch (error) {
    console.error('Update menu item error:', error);
    return res.status(500).json({ message: 'Error updating menu item', error });
  }
};

export const deleteMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    return res.status(200).json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return res.status(500).json({ message: 'Error deleting menu item', error });
  }
};

// 3. Wishlist Controllers
export const toggleWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { menuItemId } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { wishlist: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isWishlisted = user.wishlist.some((item) => item.id === menuItemId);

    if (isWishlisted) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          wishlist: {
            disconnect: { id: menuItemId },
          },
        },
      });
      return res.status(200).json({ message: 'Removed from wishlist', isWishlisted: false });
    } else {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          wishlist: {
            connect: { id: menuItemId },
          },
        },
      });
      return res.status(200).json({ message: 'Added to wishlist', isWishlisted: true });
    }
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    return res.status(500).json({ message: 'Error processing wishlist update', error });
  }
};

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        wishlist: {
          include: { category: { select: { name: true } } },
        },
      },
    });

    return res.status(200).json({ wishlist: user?.wishlist || [] });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    return res.status(500).json({ message: 'Error fetching wishlist', error });
  }
};

// 4. Reviews Controllers
export const addReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const schema = z.object({
      menuItemId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { menuItemId, rating, comment } = validation.data;

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        menuItemId,
        rating,
        comment,
      },
    });

    // Update menuItem overall rating
    const aggregate = await prisma.review.aggregate({
      where: { menuItemId },
      _avg: { rating: true },
    });

    const newRating = aggregate._avg.rating || rating;

    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { rating: newRating },
    });

    return res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ message: 'Error adding review', error });
  }
};
