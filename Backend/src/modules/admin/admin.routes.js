import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getProviders,
  verifyProvider,
  getPendingVerifications,
  getShops,
  verifyShop,
  getPlatformSettings,
  updatePlatformSetting,
} from './admin.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/providers', getProviders);
router.patch('/providers/:id/verify', verifyProvider);
router.get('/verifications', getPendingVerifications);
router.get('/shops', getShops);
router.patch('/shops/:id/verify', verifyShop);
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSetting);

export default router;
