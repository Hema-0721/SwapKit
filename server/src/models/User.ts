import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  phoneHash: string;
  displayName?: string;
  avatarUrl?: string;
  schoolId?: Types.ObjectId;
  defaultGrade?: number;
  language: string;
  isNgo: boolean;
  ngoVerifiedAt?: Date;
  ratingAvg: number;
  ratingCount: number;
  isPro: boolean;
  proExpiresAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneHash: { type: String, unique: true, required: true, index: true },
    displayName: { type: String, maxlength: 80 },
    avatarUrl: { type: String },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
    defaultGrade: { type: Number, min: 1, max: 12 },
    language: { type: String, default: 'en' },
    isNgo: { type: Boolean, default: false },
    ngoVerifiedAt: { type: Date },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isPro: { type: Boolean, default: false },
    proExpiresAt: { type: Date },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
