import { Router } from 'express';
import {
  listShops,
  getShopById,
  getMyShopProfile,
  updateMyShopProfile,
  getMyShopProducts,
  createShopProduct,
  updateShopProduct,
  deleteShopProduct,
  createShopInquiry,
  getMyShopInquiries,
} from './shops.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public shop discovery
router.get('/', listShops);
router.post('/inquiries', createShopInquiry);

// Shop Owner Management routes (PRD Standard: /shops/me/*)
router.get('/me', authenticateToken, requireRole('SHOP_OWNER'), getMyShopProfile);
router.patch('/me', authenticateToken, requireRole('SHOP_OWNER'), updateMyShopProfile);

router.get('/me/products', authenticateToken, requireRole('SHOP_OWNER'), getMyShopProducts);
router.post('/me/products', authenticateToken, requireRole('SHOP_OWNER'), createShopProduct);
router.patch('/me/products/:id', authenticateToken, requireRole('SHOP_OWNER'), updateShopProduct);
router.delete('/me/products/:id', authenticateToken, requireRole('SHOP_OWNER'), deleteShopProduct);

router.get('/me/inquiries', authenticateToken, requireRole('SHOP_OWNER'), getMyShopInquiries);

// Legacy aliases for existing frontend (/shops/owner/*)
router.get('/owner/profile', authenticateToken, requireRole('SHOP_OWNER'), getMyShopProfile);
router.patch('/owner/profile', authenticateToken, requireRole('SHOP_OWNER'), updateMyShopProfile);
router.get('/owner/catalog', authenticateToken, requireRole('SHOP_OWNER'), getMyShopProducts);
router.post('/owner/catalog', authenticateToken, requireRole('SHOP_OWNER'), createShopProduct);
router.patch('/owner/catalog/:id', authenticateToken, requireRole('SHOP_OWNER'), updateShopProduct);
router.delete('/owner/catalog/:id', authenticateToken, requireRole('SHOP_OWNER'), deleteShopProduct);
router.get('/owner/inquiries', authenticateToken, requireRole('SHOP_OWNER'), getMyShopInquiries);

// Public inquiries by shop ID & shop details
router.post('/:id/inquiries', createShopInquiry);
router.get('/:id', getShopById);

export default router;
