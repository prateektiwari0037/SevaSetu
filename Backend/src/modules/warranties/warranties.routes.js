import { Router } from 'express';
import {
  getMyWarranties,
  createRevisitRequest,
  getWarrantyByBooking,
  updateRevisitStatus,
} from './warranties.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// PRD standard routes
router.get('/warranties/my', getMyWarranties);
router.post('/warranties/:id/revisits', createRevisitRequest);
router.get('/warranties/booking/:bookingId', getWarrantyByBooking);

// Legacy routes for backwards compatibility
router.post('/revisits', (req, res, next) => {
  // If bookingId passed in body, treat as revisit for that booking/warranty
  req.params.id = req.body.warrantyId || req.body.bookingId;
  return createRevisitRequest(req, res, next);
});
router.get('/revisits', getMyWarranties);
router.patch('/revisits/:id/status', updateRevisitStatus);

export default router;
