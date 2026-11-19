import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  startBookingWork,
  completeBooking,
  cancelBooking,
} from './bookings.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);

// Support both POST (PRD requirement) and PATCH (legacy frontend)
router.post('/:id/accept', acceptBooking);
router.patch('/:id/accept', acceptBooking);

router.post('/:id/reject', rejectBooking);
router.patch('/:id/reject', rejectBooking);

router.post('/:id/start', startBookingWork);
router.patch('/:id/start', startBookingWork);

router.post('/:id/complete', completeBooking);
router.patch('/:id/complete', completeBooking);

router.post('/:id/cancel', cancelBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
