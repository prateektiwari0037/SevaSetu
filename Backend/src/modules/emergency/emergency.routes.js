import { Router } from 'express';
import {
  createEmergencyRequest,
  getEmergencyRequests,
  getEmergencyDetails,
} from './emergency.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createEmergencyRequest);
router.get('/', getEmergencyRequests);
router.get('/:id', getEmergencyDetails);

export default router;
