import express from 'express';
import { getUserProfile,login,logout } from '../controller/authController.js';
import { protectRoute } from '../middleware/protectRoutes.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/profile',protectRoute,getUserProfile);

export default router;
