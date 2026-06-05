import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError } from '../utils/apiError';
import { logger } from '../utils/logger';

// In-memory cache for OTPs (Key: phoneHash, Value: { otp, expires })
const otpCache = new Map<string, { otp: string; expires: number }>();

// Helper to hash phone numbers using SHA-256
export const hashPhoneNumber = (phone: string): string => {
  const normalizedPhone = phone.trim().replace(/[^\d+]/g, ''); // strip non-numeric characters except +
  return crypto.createHash('sha256').update(normalizedPhone).digest('hex');
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestError('Valid phone number is required');
    }

    const phoneHash = hashPhoneNumber(phone);
    
    // Generate 6-digit OTP
    const otp = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_SMS === 'true'
      ? '123456' // Static OTP for mock/dev environment
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    otpCache.set(phoneHash, { otp, expires: expiryTime });

    logger.info(`[Auth] OTP for phone hash ${phoneHash.substring(0, 10)}...: ${otp} (Expires in 5 mins)`);

    // In a real production deployment, you would trigger MSG91/Firebase SMS API here:
    // if (process.env.USE_MOCK_SMS !== 'true') { await smsService.send(phone, otp); }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expires_in: 300, // 5 minutes in seconds
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      throw new BadRequestError('Phone number and OTP are required');
    }

    const phoneHash = hashPhoneNumber(phone);
    const cachedData = otpCache.get(phoneHash);

    if (!cachedData) {
      throw new BadRequestError('OTP has not been requested or has expired', 'AUTH_INVALID_OTP');
    }

    if (Date.now() > cachedData.expires) {
      otpCache.delete(phoneHash);
      throw new BadRequestError('OTP has expired', 'AUTH_OTP_EXPIRED');
    }

    if (cachedData.otp !== otp) {
      throw new BadRequestError('Invalid OTP provided', 'AUTH_INVALID_OTP');
    }

    // OTP verified, remove it from cache
    otpCache.delete(phoneHash);

    // Find or create user
    let user = await User.findOne({ phoneHash });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        phoneHash,
        language: 'en',
        isNgo: false,
        isPro: false,
        ratingAvg: 0,
        ratingCount: 0,
      });
      isNewUser = true;
      logger.info(`[Auth] Created new user with phone hash ${phoneHash.substring(0, 10)}...`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Update user's lastSeenAt
    user.lastSeenAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      isNewUser,
      user: {
        id: user._id,
        displayName: user.displayName,
        schoolId: user.schoolId,
        defaultGrade: user.defaultGrade,
        language: user.language,
        isNgo: user.isNgo,
        isPro: user.isPro,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is missing');
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user._id.toString());
      const newRefreshToken = generateRefreshToken(user._id.toString());

      // Set rotated refresh token in cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (err: any) {
      logger.warn(`Refresh token validation failed: ${err.message}`);
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { displayName, schoolId, defaultGrade, language } = req.body;
    const user = req.user;

    if (displayName !== undefined) user.displayName = displayName;
    if (schoolId !== undefined) user.schoolId = schoolId;
    if (defaultGrade !== undefined) user.defaultGrade = defaultGrade;
    if (language !== undefined) user.language = language;

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
