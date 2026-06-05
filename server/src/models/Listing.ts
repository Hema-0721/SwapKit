import { Schema, model, Document, Types } from 'mongoose';

export interface IListing extends Document {
  sellerId: Types.ObjectId;
  schoolId: Types.ObjectId;
  grade: number;
  category: 'textbook' | 'uniform_top' | 'uniform_bottom' | 'shoes' | 'bag' | 'stationery' | 'other';
  subject?: string;
  title: string;
  description?: string;
  condition: 'like_new' | 'good' | 'fair' | 'worn';
  mode: 'sell' | 'barter' | 'free';
  pricePaise?: number; // Null for barter/free
  barterWantCategory?: string;
  barterWantSubject?: string;
  barterWantGrade?: number;
  images: string[];
  isActive: boolean;
  isBoosted: boolean;
  viewCount: number;
  expiresAt: Date;
  soldAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    grade: { type: Number, min: 1, max: 12, required: true },
    category: {
      type: String,
      enum: ['textbook', 'uniform_top', 'uniform_bottom', 'shoes', 'bag', 'stationery', 'other'],
      required: true,
    },
    subject: { type: String },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String },
    condition: {
      type: String,
      enum: ['like_new', 'good', 'fair', 'worn'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['sell', 'barter', 'free'],
      required: true,
      index: true,
    },
    pricePaise: { type: Number },
    barterWantCategory: { type: String },
    barterWantSubject: { type: String },
    barterWantGrade: { type: Number },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    isBoosted: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    soldAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
listingSchema.index({ schoolId: 1, grade: 1, isActive: 1 });
listingSchema.index({ mode: 1, isActive: 1 });
listingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Listing = model<IListing>('Listing', listingSchema);
