import { Router } from 'express';
import { sendOtp, verifyOtp, refresh, logout, getMe, updateMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);

export default router;
