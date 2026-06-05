import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  revieweeId: Types.ObjectId; // User receiving review
  reviewerId: Types.ObjectId; // User writing review
  listingId: Types.ObjectId;  // Exchange item
  rating: number;             // 1-5 stars
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// Prevent reviewer from writing multiple reviews for the same listing
reviewSchema.index({ reviewerId: 1, listingId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
