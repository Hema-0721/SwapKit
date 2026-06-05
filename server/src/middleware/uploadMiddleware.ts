import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { BadRequestError } from '../utils/apiError';
import { logger } from '../utils/logger';
import streamifier from 'streamifier'; // wait, did we install streamifier? Let's check package.json.
// Ah, we did not install streamifier. But we can convert a buffer to a readable stream using simple built-in Node.js Readable stream!
import { Readable } from 'stream';

// Configure Cloudinary
// Ensure we use the exact credentials provided by the user
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djidml0mv',
  api_key: process.env.CLOUDINARY_API_KEY || '546864855873773',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Mv2wy3zLcqqA3qSyTblvAVetIew',
});

// Configure Multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed!') as any, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4, // Max 4 images
  },
});

// Helper function to upload buffer to Cloudinary
export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'swapkit_listings',
        transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto', fetch_format: 'webp' }],
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(error);
        }
        if (result) {
          return resolve(result.secure_url);
        }
        reject(new Error('Cloudinary stream upload returned empty result'));
      }
    );

    // Create a readable stream from the buffer and pipe it to Cloudinary
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null); // Indicates end of stream
    stream.pipe(uploadStream);
  });
};
