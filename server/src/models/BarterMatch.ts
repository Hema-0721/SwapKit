import { Schema, model, Document, Types } from 'mongoose';

export interface IBarterMatch extends Document {
  listingAId: Types.ObjectId;
  listingBId: Types.ObjectId;
  matchScore: 'full' | 'partial';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  notifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const barterMatchSchema = new Schema<IBarterMatch>(
  {
    listingAId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    listingBId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    matchScore: { type: String, enum: ['full', 'partial'], required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    notifiedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate matches and speed up lookup
barterMatchSchema.index({ listingAId: 1, listingBId: 1 }, { unique: true });
barterMatchSchema.index({ status: 1, expiresAt: 1 });

export const BarterMatch = model<IBarterMatch>('BarterMatch', barterMatchSchema);
