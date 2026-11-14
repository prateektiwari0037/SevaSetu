import { Router } from 'express';
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  submitQuotation,
  getQuotationById,
  selectQuotation,
  getProviderQuotations,
} from './quotations.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

// Service requests
router.post('/service-requests', authenticateToken, createServiceRequest);
router.get('/service-requests', authenticateToken, getServiceRequests);
router.get('/service-requests/:id', authenticateToken, getServiceRequestById);
router.get('/service-requests/:id/quotations', authenticateToken, getServiceRequestById);

// Quotations
router.post('/quotations', authenticateToken, requireRole('PROVIDER'), submitQuotation);
router.get('/quotations/:id', authenticateToken, getQuotationById);
router.patch('/quotations/:id/select', authenticateToken, selectQuotation);
router.get('/provider/quotations', authenticateToken, requireRole('PROVIDER'), getProviderQuotations);

export default router;
