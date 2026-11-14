import { Router } from 'express';
import {
  listShops,
  getShopById,
  getMyShopProfile,
  updateMyShopProfile,
  getShopCatalog,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  createInquiry,
  getShopInquiries,
} from './shops.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public shop discovery
router.get('/', listShops);
router.post('/inquiries', createInquiry);

// Shop Owner Management routes (explicit auth)
router.get('/owner/profile', authenticateToken, requireRole('SHOP_OWNER'), getMyShopProfile);
router.patch('/owner/profile', authenticateToken, requireRole('SHOP_OWNER'), updateMyShopProfile);
router.get('/owner/catalog', authenticateToken, requireRole('SHOP_OWNER'), getShopCatalog);
router.post('/owner/catalog', authenticateToken, requireRole('SHOP_OWNER'), addCatalogItem);
router.patch('/owner/catalog/:id', authenticateToken, requireRole('SHOP_OWNER'), updateCatalogItem);
router.delete('/owner/catalog/:id', authenticateToken, requireRole('SHOP_OWNER'), deleteCatalogItem);
router.get('/owner/inquiries', authenticateToken, requireRole('SHOP_OWNER'), getShopInquiries);

// Public by ID (must be at the end)
router.get('/:id', getShopById);

export default router;
