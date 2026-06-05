import { Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Listing } from '../models/Listing';
import { BadRequestError, NotFoundError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reviewerId = req.userId!;
    const { revieweeId, listingId, rating, comment } = req.body;

    if (!revieweeId || !listingId || !rating) {
      throw new BadRequestError('Reviewee ID, Listing ID, and Rating are required');
    }

    if (reviewerId === revieweeId) {
      throw new BadRequestError('You cannot review yourself');
    }

    // Verify reviewee exists
    const reviewee = await User.findById(revieweeId);
    if (!reviewee) {
      throw new NotFoundError('Reviewee user not found');
    }

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ reviewerId, listingId });
    if (existingReview) {
      throw new BadRequestError('You have already submitted a review for this transaction');
    }

    // Create review
    const review = await Review.create({
      revieweeId,
      reviewerId,
      listingId,
      rating: Number(rating),
      comment,
    });

    // Update user average rating
    const reviews = await Review.find({ revieweeId });
    const count = reviews.length;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;

    reviewee.ratingCount = count;
    reviewee.ratingAvg = avg;
    await reviewee.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
      updatedRating: {
        ratingAvg: avg,
        ratingCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'displayName avatarUrl')
      .populate('listingId', 'title mode');

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
