import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingDetails,
  updateListing,
  deleteListing,
  boostListing,
} from '../controllers/listingController';
import { authMiddleware } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { listingLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public listing details
router.get('/:id', getListingDetails);

// Protected routes (require auth)
router.use(authMiddleware);

router.post('/', listingLimiter, upload.array('images', 4), createListing);
router.get('/', getListings);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);
router.post('/:id/boost', boostListing);

export default router;
