import express from 'express';
import { protectedRoute } from '../middleware/protectedRoute.js';
import { 
    comments, 
    createPost, 
    reactions, 
    deletePost, 
    getAllPosts, 
    getCurrentUserLikes, 
    getLikedPosts,
    getFollowingPosts,
    getPostsForYou,
} from '../controllers/post.controller.js';

const router = express.Router();

router.post('/create', protectedRoute, createPost);
router.post('/comments/:postId', protectedRoute, comments);
router.post('/likes/:postId', protectedRoute, reactions);
router.delete('/delete/:postId', protectedRoute, deletePost);
router.get('/', protectedRoute, getAllPosts);
router.get('/user/likes', protectedRoute, getCurrentUserLikes);
router.get('/user/likes/:id', protectedRoute, getLikedPosts);
router.get('/following/posts', protectedRoute, getFollowingPosts);
router.get('/foryou/posts', protectedRoute, getPostsForYou);

export default router;