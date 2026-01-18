import express from 'express'
import { protectedRoute } from '../middleware/protectedRoute.js';
import { 
    getUserProfile, 
    getSuggestedUsers, 
    followUnfollowUser, 
    changePassword, 
    updateUserInfo 
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/userProfile/:username', protectedRoute, getUserProfile);
router.get('/suggested', protectedRoute, getSuggestedUsers);
router.post('/followUser/:id', protectedRoute, followUnfollowUser);
router.put('/changePassword', protectedRoute, changePassword);
router.post('/updateInfo', protectedRoute, updateUserInfo);

export default router;
