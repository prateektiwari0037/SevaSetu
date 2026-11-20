import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getProviders,
  approveProvider,
  rejectProvider,
  verifyProvider,
  getPendingVerifications,
  getShops,
  approveShop,
  rejectShop,
  verifyShop,
  getAdminBookings,
  getAdminReports,
  getPlatformSettings,
  updatePlatformSetting,
  getAuditLogs,
} from './admin.controller.js';
import {
  getComplaints,
  updateComplaintStatus,
  addComplaintMessage,
} from '../complaints/complaints.controller.js';
import {
  getAdminSubscriptions,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  approveSubscription,
  getSubscriptionPlans,
} from '../subscriptions/subscriptions.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Strict RBAC: All administrative routes require valid ADMIN session
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// 1. Dashboard
router.get('/dashboard', getDashboardStats);

// 2. User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// 3. Provider Management & KYC
router.get('/providers', getProviders);
router.post('/providers/:id/approve', approveProvider);
router.post('/providers/:id/reject', rejectProvider);
router.patch('/providers/:id/verify', verifyProvider); // Compatibility alias
router.get('/verifications', getPendingVerifications);

// 4. Shop Management & Verification
router.get('/shops', getShops);
router.post('/shops/:id/approve', approveShop);
router.post('/shops/:id/reject', rejectShop);
router.patch('/shops/:id/verify', verifyShop); // Compatibility alias

// 5. Booking Monitoring
router.get('/bookings', getAdminBookings);

// 6. Complaints Resolution Desk
router.get('/complaints', getComplaints);
router.patch('/complaints/:id', updateComplaintStatus);
router.patch('/complaints/:id/status', updateComplaintStatus); // Compatibility alias
router.post('/complaints/:id/messages', addComplaintMessage);

// 7. Subscriptions & Plan Management
router.get('/subscriptions', getAdminSubscriptions);
router.post('/subscriptions/:id/approve', approveSubscription);
router.get('/subscription-plans', getSubscriptionPlans);
router.post('/subscription-plans', createSubscriptionPlan);
router.patch('/subscription-plans/:id', updateSubscriptionPlan);

// 8. Analytics & Reports
router.get('/reports', getAdminReports);

// 9. Platform Configuration
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSetting);

// 10. Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
