import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  addComplaintMessage,
  updateComplaintStatus,
} from './complaints.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.post('/:id/messages', addComplaintMessage);
router.patch('/:id/status', requireRole('ADMIN'), updateComplaintStatus);

export default router;
