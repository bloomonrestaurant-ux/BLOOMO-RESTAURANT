import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleWishlist,
  getWishlist,
  addReview,
} from '../controllers/menu.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Category Routes
router.get('/categories', getCategories);
router.post('/categories', protect, restrictTo(Role.ADMIN, Role.MANAGER), createCategory);
router.put('/categories/:id', protect, restrictTo(Role.ADMIN, Role.MANAGER), updateCategory);
router.delete('/categories/:id', protect, restrictTo(Role.ADMIN, Role.MANAGER), deleteCategory);

// Menu Item Routes
router.get('/items', getMenuItems);
router.get('/items/:id', getMenuItem);
router.post('/items', protect, restrictTo(Role.ADMIN, Role.MANAGER), createMenuItem);
router.put('/items/:id', protect, restrictTo(Role.ADMIN, Role.MANAGER), updateMenuItem);
router.delete('/items/:id', protect, restrictTo(Role.ADMIN, Role.MANAGER), deleteMenuItem);

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/toggle', protect, toggleWishlist);

// Reviews
router.post('/reviews', protect, addReview);

export default router;
