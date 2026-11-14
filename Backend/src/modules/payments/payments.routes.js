import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentById,
  getPaymentHistory,
  requestRefund,
} from './payments.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/:id', getPaymentById);
router.post('/refund', requestRefund);

export default router;
