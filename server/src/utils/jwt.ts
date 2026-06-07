import jwt from 'jsonwebtoken';

const getAccessSecret = () => process.env.JWT_SECRET || 'fallback_access_secret';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

export interface TokenPayload {
  userId: string;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, getAccessSecret(), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, getRefreshSecret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY || '30d') as any,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, getAccessSecret()) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, getRefreshSecret()) as TokenPayload;
};
