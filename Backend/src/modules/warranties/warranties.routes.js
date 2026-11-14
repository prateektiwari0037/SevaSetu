import { Router } from 'express';
import {
  getWarrantyByBooking,
  createRevisitRequest,
  getRevisits,
  updateRevisitStatus,
} from './warranties.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.get('/warranties/booking/:bookingId', authenticateToken, getWarrantyByBooking);
router.post('/revisits', authenticateToken, createRevisitRequest);
router.get('/revisits', authenticateToken, getRevisits);
router.patch('/revisits/:id/status', authenticateToken, updateRevisitStatus);

export default router;
