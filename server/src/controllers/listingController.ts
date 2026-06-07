import { Request, Response, NextFunction } from 'express';
import { Listing } from '../models/Listing';
import { uploadToCloudinary } from '../middleware/uploadMiddleware';
import { scanForBarterMatches } from '../services/barterService';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user.schoolId) {
      throw new BadRequestError('You must link your profile to a school before creating listings');
    }

    const {
      title,
      category,
      subject,
      description,
      condition,
      mode,
      pricePaise,
      barterWantCategory,
      barterWantSubject,
      barterWantGrade,
    } = req.body;

    if (!title || !category || !condition || !mode) {
      throw new BadRequestError('Title, Category, Condition, and Mode are required fields');
    }

    // Custom validations based on mode
    let cleanPrice: number | undefined;
    if (mode === 'sell') {
      if (pricePaise === undefined || pricePaise === null) {
        throw new BadRequestError('Price is required for sell mode');
      }
      cleanPrice = Number(pricePaise);
      if (isNaN(cleanPrice) || cleanPrice < 0) {
        throw new BadRequestError('Price must be a valid non-negative number');
      }
    }

    if (mode === 'barter') {
      if (!barterWantCategory) {
        throw new BadRequestError('Desired barter category is required');
      }
    }

    // Process image uploads
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      logger.info(`[Listings] Uploading ${req.files.length} images to Cloudinary...`);
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    // Expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const listing = await Listing.create({
      sellerId: user._id,
      schoolId: user.schoolId,
      grade: user.defaultGrade || 1, // Fallback to 1 if defaultGrade is not set
      category,
      subject,
      title,
      description,
      condition,
      mode,
      pricePaise: mode === 'sell' ? cleanPrice : undefined,
      barterWantCategory: mode === 'barter' ? barterWantCategory : undefined,
      barterWantSubject: mode === 'barter' ? barterWantSubject : undefined,
      barterWantGrade: mode === 'barter' && barterWantGrade ? Number(barterWantGrade) : undefined,
      images: imageUrls,
      isActive: true,
      isBoosted: false,
      expiresAt,
    });

    logger.info(`[Listings] Listing created successfully: ${listing._id}`);

    // If barter, trigger barter scanning asynchronously
    if (mode === 'barter') {
      scanForBarterMatches(listing._id.toString()).catch((err) => {
        logger.error(`[Listings] Failed to run barter scan for listing ${listing._id}: ${err.message}`);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { schoolId, grade, category, mode, search, sellerId, page = 1, limit = 20 } = req.query;

    const query: any = { isActive: true };

    if (sellerId) {
      query.sellerId = sellerId;
    } else {
      // Filter by school. If not specified, default to user's school
      query.schoolId = schoolId ? schoolId : user.schoolId;

      if (!query.schoolId) {
        throw new BadRequestError('School ID must be provided either in query params or set on user profile');
      }
    }

    if (grade) {
      query.grade = Number(grade);
    }
    if (category) {
      query.category = category;
    }
    if (mode) {
      query.mode = mode;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Load listings (boosted listings rank first)
    const listings = await Listing.find(query)
      .sort({ isBoosted: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('sellerId', 'displayName avatarUrl ratingAvg');

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getListingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Find listing, populate seller profile
    const listing = await Listing.findById(id).populate(
      'sellerId',
      'displayName avatarUrl ratingAvg ratingCount isPro'
    );

    if (!listing || !listing.isActive) {
      throw new NotFoundError('Listing not found or has expired');
    }

    // Increment views asynchronously
    listing.viewCount += 1;
    await listing.save();

    res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sellerId = req.userId;

    const listing = await Listing.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You do not have permission to modify this listing');
    }

    const { title, description, pricePaise, condition, isActive } = req.body;

    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (condition !== undefined) listing.condition = condition;
    if (isActive !== undefined) listing.isActive = isActive;

    if (listing.mode === 'sell' && pricePaise !== undefined) {
      const cleanPrice = Number(pricePaise);
      if (isNaN(cleanPrice) || cleanPrice < 0) {
        throw new BadRequestError('Price must be a valid non-negative number');
      }
      listing.pricePaise = cleanPrice;
    }

    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sellerId = req.userId;

    const listing = await Listing.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You do not have permission to delete this listing');
    }

    // Perform logical delete (archive)
    listing.isActive = false;
    listing.soldAt = new Date();
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing archived successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Mock Razorpay Listing Boost Checkout
export const boostListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sellerId = req.userId;

    const listing = await Listing.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.sellerId.toString() !== sellerId) {
      throw new ForbiddenError('You do not have permission to boost this listing');
    }

    // In a real application, you would invoke the Razorpay SDK to create an order:
    // const order = await razorpay.orders.create({ amount: 50000, currency: "INR" });
    // For now we return a mock success response, updating boosted state directly or returning mock order metadata.
    listing.isBoosted = true;
    await listing.save();

    logger.info(`[Payments] Successfully boosted listing ${listing._id} (Mock Payment Verified)`);

    res.status(200).json({
      success: true,
      message: 'Listing boosted successfully (Mock Payment)',
      listing,
    });
  } catch (error) {
    next(error);
  }
};
