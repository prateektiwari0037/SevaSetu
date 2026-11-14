import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from './users.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.delete('/account', deleteAccount);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
