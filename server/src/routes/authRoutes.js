import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getProfile);
router.patch('/profile', requireAuth, updateProfile);
export default router;
