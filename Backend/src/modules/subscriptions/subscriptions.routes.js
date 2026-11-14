import { Router } from 'express';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  subscribeToPlan,
  getMySubscriptions,
  cancelSubscription,
} from './subscriptions.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public plan browsing
router.get('/plans', getSubscriptionPlans);
router.get('/subscription-plans', getSubscriptionPlans);
router.get('/subscriptions/plans', getSubscriptionPlans);

// Protected routes
router.post('/plans', authenticateToken, requireRole('ADMIN'), createSubscriptionPlan);
router.post('/subscription-plans', authenticateToken, requireRole('ADMIN'), createSubscriptionPlan);
router.get('/subscriptions', authenticateToken, getMySubscriptions);
router.post('/subscriptions', authenticateToken, requireRole('CUSTOMER'), subscribeToPlan);
router.patch('/subscriptions/:id/cancel', authenticateToken, cancelSubscription);

export default router;
