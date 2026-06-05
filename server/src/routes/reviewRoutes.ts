import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protected rating submissions
router.post('/', authMiddleware, createReview);

// Public profile reviews
router.get('/user/:userId', getUserReviews);

export default router;
