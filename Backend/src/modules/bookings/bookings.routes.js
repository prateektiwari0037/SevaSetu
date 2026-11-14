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
router.patch('/:id/accept', acceptBooking);
router.patch('/:id/reject', rejectBooking);
router.patch('/:id/start', startBookingWork);
router.patch('/:id/complete', completeBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
