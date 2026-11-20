import { Router } from 'express';
import {
  submitReview,
  getProviderReviews,
  getMyReviews,
  replyToReview,
} from './reviews.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/provider/:id', getProviderReviews);

router.use(authenticateToken);
router.post('/', requireRole('CUSTOMER'), submitReview);
router.get('/my', getMyReviews);
router.get('/my-reviews', getMyReviews);
router.patch('/:id/reply', requireRole('PROVIDER'), replyToReview);

export default router;
