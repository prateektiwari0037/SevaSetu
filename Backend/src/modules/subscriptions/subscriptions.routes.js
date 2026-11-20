import { Router } from 'express';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  subscribeToPlan,
  getMySubscriptions,
  cancelSubscription,
  getAdminSubscriptions,
  approveSubscription,
} from './subscriptions.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public plan browsing
router.get('/plans', getSubscriptionPlans);
router.get('/subscription-plans', getSubscriptionPlans);
router.get('/subscriptions/plans', getSubscriptionPlans);

// Protected routes
router.post('/plans', authenticateToken, requireRole('ADMIN'), createSubscriptionPlan);
router.patch('/plans/:id', authenticateToken, requireRole('ADMIN'), updateSubscriptionPlan);
router.post('/subscription-plans', authenticateToken, requireRole('ADMIN'), createSubscriptionPlan);
router.patch('/subscription-plans/:id', authenticateToken, requireRole('ADMIN'), updateSubscriptionPlan);

// Customer subscriptions
router.get('/subscriptions', authenticateToken, getMySubscriptions);
router.post('/subscriptions', authenticateToken, requireRole('CUSTOMER'), subscribeToPlan);
router.patch('/subscriptions/:id/cancel', authenticateToken, cancelSubscription);

// Admin-specific subscription management
router.get('/admin/subscriptions', authenticateToken, requireRole('ADMIN'), getAdminSubscriptions);
router.post('/admin/subscriptions/:id/approve', authenticateToken, requireRole('ADMIN'), approveSubscription);

export default router;
