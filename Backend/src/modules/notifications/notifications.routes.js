import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from './notifications.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
