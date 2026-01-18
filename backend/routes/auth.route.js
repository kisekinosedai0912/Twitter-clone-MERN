import express from "express";
import {signup, login, logout, validateAccess} from '../controllers/auth.controller.js'
import { protectedRoute } from "../middleware/protectedRoute.js";

const router = express.Router();

router.get('/validate', protectedRoute, validateAccess);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

export default router;