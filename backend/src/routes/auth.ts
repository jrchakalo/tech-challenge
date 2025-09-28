import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword, requestPasswordReset, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), requestPasswordReset);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateRequest(updateProfileSchema), updateProfile);
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), changePassword);

export default router;