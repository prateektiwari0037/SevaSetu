import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerCustomer,
  registerProvider,
  registerShopOwner,
  registerUnified,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  me,
} from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Strict rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Explicit registration endpoints
router.post('/register/customer', authLimiter, registerCustomer);
router.post('/register/provider', authLimiter, registerProvider);
router.post('/register/shop-owner', authLimiter, registerShopOwner);

// Unified registration endpoint (for existing frontend compatibility)
router.post('/register', authLimiter, registerUnified);

// Authentication & Session
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);

// Password Management
router.post('/forgot-password', passwordLimiter, forgotPassword);
router.post('/reset-password', passwordLimiter, resetPassword);
router.post('/change-password', authenticate, changePassword);
router.patch('/change-password', authenticate, changePassword); // Alias for backwards compatibility

// Email Verification
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Current User Profile
router.get('/me', authenticate, me);

export default router;
