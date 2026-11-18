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
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Profile endpoints
router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.delete('/account', deleteAccount);

// Address endpoints
router.get('/me/addresses', getAddresses);
router.post('/me/addresses', addAddress);
router.patch('/me/addresses/:id', updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

// Aliases for backwards compatibility with existing UI
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
