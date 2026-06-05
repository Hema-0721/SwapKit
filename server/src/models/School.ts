import { Schema, model, Document } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  board: 'cbse' | 'icse' | 'state' | 'ib' | 'other';
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  adminPin: string;
  isPartner: boolean;
  partnerTier?: 'basic' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, maxlength: 200 },
    board: {
      type: String,
      enum: ['cbse', 'icse', 'state', 'ib', 'other'],
      required: true,
    },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    adminPin: { type: String, required: true, length: 8 },
    isPartner: { type: Boolean, default: false },
    partnerTier: { type: String, enum: ['basic', 'premium'] },
  },
  { timestamps: true }
);

schoolSchema.index({ location: '2dsphere' });
schoolSchema.index({ name: 'text', city: 'text' });
schoolSchema.index({ pincode: 1 });

export const School = model<ISchool>('School', schoolSchema);
