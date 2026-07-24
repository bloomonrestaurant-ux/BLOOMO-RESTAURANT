"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_controller_1 = require("../controllers/menu.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Category Routes
router.get('/categories', menu_controller_1.getCategories);
router.post('/categories', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER), menu_controller_1.createCategory);
router.put('/categories/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER), menu_controller_1.updateCategory);
router.delete('/categories/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER), menu_controller_1.deleteCategory);
// Menu Item Routes
router.get('/items', menu_controller_1.getMenuItems);
router.get('/items/:id', menu_controller_1.getMenuItem);
router.post('/items', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER), menu_controller_1.createMenuItem);
router.put('/items/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER), menu_controller_1.updateMenuItem);
router.delete('/items/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER), menu_controller_1.deleteMenuItem);
// Wishlist
router.get('/wishlist', auth_middleware_1.protect, menu_controller_1.getWishlist);
router.post('/wishlist/toggle', auth_middleware_1.protect, menu_controller_1.toggleWishlist);
// Reviews
router.post('/reviews', auth_middleware_1.protect, menu_controller_1.addReview);
exports.default = router;
