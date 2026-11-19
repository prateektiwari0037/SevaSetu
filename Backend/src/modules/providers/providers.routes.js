import { Router } from 'express';
import {
  getMyProviderProfile,
  updateMyProviderProfile,
  getVerificationStatus,
  submitVerification,
  getProviderServices,
  addProviderService,
  updateProviderService,
  deleteProviderService,
  getAvailability,
  updateAvailability,
  getMyBookings,
  getEarnings,
  getProviderReviews,
  getDashboardStats,
  uploadPortfolioImage,
  deletePortfolioImage,
  getNearbyProviders,
  getProviderById,
} from './providers.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

// Conditional upload middleware that supports both multipart/form-data and JSON
const uploadIfMultipart = (fieldName) => (req, res, next) => {
  if (req.is && req.is('multipart/form-data')) {
    return upload.single(fieldName)(req, res, next);
  }
  next();
};

// Public discovery
router.get('/nearby', getNearbyProviders);

// Provider authenticated routes
router.use(authenticateToken);
router.use(requireRole('PROVIDER'));

// PRD Section 14: Provider Profile (/api/v1/providers/me)
router.get('/me', getMyProviderProfile);
router.patch('/me', updateMyProviderProfile);
router.get('/profile/me', getMyProviderProfile);
router.patch('/profile/me', updateMyProviderProfile);

// PRD Section 14: KYC Verification (/api/v1/providers/me/verification)
router.get('/me/verification', getVerificationStatus);
router.post('/me/verification', uploadIfMultipart('document'), submitVerification);
router.get('/verification/status', getVerificationStatus);
router.post('/documents', uploadIfMultipart('document'), submitVerification);

// PRD Section 14: Provider Services (/api/v1/providers/me/services)
router.get('/me/services', getProviderServices);
router.post('/me/services', addProviderService);
router.patch('/me/services/:id', updateProviderService);
router.delete('/me/services/:id', deleteProviderService);
router.get('/services/my', getProviderServices);
router.post('/services/my', addProviderService);
router.patch('/services/my/:id', updateProviderService);
router.delete('/services/my/:id', deleteProviderService);

// PRD Section 14: Availability Management (/api/v1/providers/me/availability)
router.get('/me/availability', getAvailability);
router.put('/me/availability', updateAvailability);
router.patch('/me/availability', updateAvailability);
router.patch('/availability/my', updateAvailability);

// PRD Section 14: Provider Bookings (/api/v1/providers/me/bookings)
router.get('/me/bookings', getMyBookings);
router.get('/bookings/my', getMyBookings);

// PRD Section 14: Earnings & Reviews (/api/v1/providers/me/earnings, /me/reviews)
router.get('/me/earnings', getEarnings);
router.get('/earnings/my', getEarnings);
router.get('/earnings', getEarnings);
router.get('/me/reviews', getProviderReviews);
router.get('/reviews/my', getProviderReviews);

// Dashboard & Portfolio
router.get('/me/dashboard', getDashboardStats);
router.get('/dashboard', getDashboardStats);
router.post('/me/portfolio', uploadIfMultipart('image'), uploadPortfolioImage);
router.delete('/me/portfolio/:id', deletePortfolioImage);

// Public by ID (must be at the end)
router.get('/:id', getProviderById);

export default router;
