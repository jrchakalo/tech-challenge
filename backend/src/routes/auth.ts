import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, registerSchema, loginSchema, changePasswordSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), changePassword);

export default router;