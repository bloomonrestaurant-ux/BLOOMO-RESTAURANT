import { Router } from 'express';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockAlerts,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/inventory.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply administrative restriction to all inventory routes
router.use(protect, restrictTo(Role.ADMIN, Role.MANAGER));

// Inventory CRUD
router.get('/', getInventory);
router.get('/low-stock', getLowStockAlerts);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

// Suppliers CRUD
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

export default router;
