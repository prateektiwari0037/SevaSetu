import { Router } from 'express';
import {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryByIdOrSlug);

// Admin category management
router.post('/', authenticateToken, requireRole('ADMIN'), createCategory);
router.patch('/:id', authenticateToken, requireRole('ADMIN'), updateCategory);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteCategory);

export default router;
