import { Router } from 'express';
import {
  getServices,
  getServiceByIdOrSlug,
  searchServices,
  createService,
  updateService,
  deleteService,
} from './services.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/', getServices);
router.get('/search', searchServices);
router.get('/:id', getServiceByIdOrSlug);

// Admin service management
router.post('/', authenticateToken, requireRole('ADMIN'), createService);
router.patch('/:id', authenticateToken, requireRole('ADMIN'), updateService);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteService);

export default router;
