import express from 'express'
import { protectedRoute } from '../middleware/protectedRoute.js';
import { getUserProfile, followUnfollowUser } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/userProfile/:username', protectedRoute, getUserProfile);
router.post('/followUser/:id', protectedRoute, followUnfollowUser);

export default router;
