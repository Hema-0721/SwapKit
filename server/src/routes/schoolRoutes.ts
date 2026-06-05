import { Router } from 'express';
import { searchSchools, createSchool, getSchoolChecklist } from '../controllers/schoolController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes for school searching/onboarding
router.get('/search', searchSchools);
router.post('/', createSchool);

// Protected supply checklist
router.get('/:id/checklist', authMiddleware, getSchoolChecklist);

export default router;
