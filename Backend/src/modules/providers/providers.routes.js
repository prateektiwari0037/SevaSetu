import { Router } from 'express';
import {
  getNearbyProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  uploadDocument,
  getVerificationStatus,
  getProviderServices,
  addProviderService,
  updateProviderService,
  deleteProviderService,
  updateAvailability,
  getEarnings,
} from './providers.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

// Public discovery
router.get('/nearby', getNearbyProviders);

// Provider authenticated routes
router.use(authenticateToken);
router.get('/profile/me', requireRole('PROVIDER'), getMyProviderProfile);
router.patch('/profile/me', requireRole('PROVIDER'), updateMyProviderProfile);
router.post('/documents', requireRole('PROVIDER'), upload.single('document'), uploadDocument);
router.get('/verification/status', requireRole('PROVIDER'), getVerificationStatus);

router.get('/services/my', requireRole('PROVIDER'), getProviderServices);
router.post('/services/my', requireRole('PROVIDER'), addProviderService);
router.patch('/services/my/:id', requireRole('PROVIDER'), updateProviderService);
router.delete('/services/my/:id', requireRole('PROVIDER'), deleteProviderService);

router.patch('/availability/my', requireRole('PROVIDER'), updateAvailability);
router.get('/earnings/my', requireRole('PROVIDER'), getEarnings);
router.get('/earnings', requireRole('PROVIDER'), getEarnings);

// Public by ID (must be at the end so it doesn't shadow /profile/me or /earnings)
router.get('/:id', getProviderById);

export default router;
