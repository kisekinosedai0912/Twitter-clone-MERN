import express from 'express';
import { protectedRoute } from '../middleware/protectedRoute.js';
import { comments, createPost, reactions } from '../controllers/post.controller.js';

const router = express.Router();

router.post('/create', protectedRoute, createPost);
router.post('/comments/:id', protectedRoute, comments);
router.post('/likes/:id', protectedRoute, reactions);

export default router;