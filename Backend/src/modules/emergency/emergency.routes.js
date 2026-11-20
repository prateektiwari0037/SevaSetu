import { Router } from 'express';
import {
  createEmergencyRequest,
  getMyEmergencyRequests,
  respondToEmergencyRequest,
  getEmergencyDetails,
} from './emergency.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createEmergencyRequest);
router.get('/my', getMyEmergencyRequests);
router.get('/', getMyEmergencyRequests);
router.post('/:id/respond', respondToEmergencyRequest);
router.get('/:id', getEmergencyDetails);

export default router;
