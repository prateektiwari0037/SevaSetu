import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
} from './auth.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
router.patch('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
