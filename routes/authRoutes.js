import express from 'express';
import { getUserProfile, login, logout, signup, deleteUser, getAllUsers, updatePassword } from '../controller/authController.js';
import { protectRoute } from '../middleware/protectRoutes.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/all', protectRoute, getAllUsers);
router.get('/profile', protectRoute, getUserProfile);
router.put('/update-password', protectRoute, updatePassword);
router.delete('/:username', protectRoute, deleteUser);


export default router;
