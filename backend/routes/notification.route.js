import express from 'express'
import { protectedRoute } from '../middleware/protectedRoute.js';
import { deleteNotification, getNotifications, deleteOneNotif } from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', protectedRoute, getNotifications)
router.delete('/', protectedRoute, deleteNotification)
router.delete('/:id', protectedRoute, deleteOneNotif)

export default router;