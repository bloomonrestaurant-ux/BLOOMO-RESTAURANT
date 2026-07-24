"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Apply administrative restriction to all inventory routes
router.use(auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.MANAGER));
// Inventory CRUD
router.get('/', inventory_controller_1.getInventory);
router.get('/low-stock', inventory_controller_1.getLowStockAlerts);
router.post('/', inventory_controller_1.createInventoryItem);
router.put('/:id', inventory_controller_1.updateInventoryItem);
router.delete('/:id', inventory_controller_1.deleteInventoryItem);
// Suppliers CRUD
router.get('/suppliers', inventory_controller_1.getSuppliers);
router.post('/suppliers', inventory_controller_1.createSupplier);
router.put('/suppliers/:id', inventory_controller_1.updateSupplier);
router.delete('/suppliers/:id', inventory_controller_1.deleteSupplier);
exports.default = router;
